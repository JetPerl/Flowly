package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.OperationMapper;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.entity.UserCategory;
import com.flowly.api.model.entity.UserTag;
import com.flowly.api.model.enums.AccountType;
import com.flowly.api.model.enums.OperationType;
import com.flowly.api.model.request.operation.OperationCreateRequest;
import com.flowly.api.model.request.operation.OperationPatchRequest;
import com.flowly.api.model.response.operation.OperationPageResponse;
import com.flowly.api.model.response.operation.OperationResponse;
import com.flowly.api.model.response.operation.PageInfoResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.repository.OperationRepository;
import com.flowly.api.repository.TagRepository;
import com.flowly.api.repository.UserCategoryRepository;
import com.flowly.api.repository.UserTagRepository;
import com.flowly.api.service.OperationService;
import com.flowly.api.service.RateService;
import com.flowly.api.utils.CategoryAccessPolicy;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationServiceImpl implements OperationService {

    OperationRepository operationRepository;
    AccountRepository accountRepository;
    OperationMapper operationMapper;
    CategoryRepository categoryRepository;
    TagRepository tagRepository;
    UserCategoryRepository userCategoryRepository;
    UserTagRepository userTagRepository;
    RateService rateService;

    @Override
    @Transactional(readOnly = true)
    public OperationPageResponse getOperationsWithCursor(Integer accountId, Integer limit, String cursor) {
        Integer userId = SecurityUtils.getCurrentUserId();
        List<Integer> accountIds = resolveUserAccountIds(userId, accountId);

        if (accountIds.isEmpty()) {
            return new OperationPageResponse(List.of(), new PageInfoResponse(0, false, null));
        }

        Integer decodedCursor = decodeCursor(cursor);
        int pageSize = (limit != null) ? limit : 20;

        List<Operation> operations = operationRepository.findOperationsWithCursor(
                accountIds,
                decodedCursor,
                PageRequest.of(0, pageSize + 1)
        );

        boolean hasNext = operations.size() > pageSize;
        if (hasNext) {
            operations = operations.subList(0, pageSize);
        }

        List<OperationResponse> items = enrichOperations(operations, userId);

        String nextCursor = null;
        if (hasNext && !operations.isEmpty()) {
            nextCursor = encodeCursor(operations.getLast().getId());
        }

        return new OperationPageResponse(
                items,
                new PageInfoResponse(items.size(), hasNext, nextCursor)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public OperationResponse getOperationById(Integer operationId) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Operation operation = findOwnedOperation(operationId, userId, "У вас нет прав для доступа к этой операции");
        return enrichOperation(operation, userId);
    }

    @Override
    @Transactional
    public OperationResponse createOperation(OperationCreateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();

        if (request.accountId() == null) {
            throw new IllegalArgumentException("Идентификатор счета обязателен");
        }
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Сумма операции должна быть больше нуля");
        }

        Integer sourceAccountId = request.accountId().intValue();
        Account sourceAccount = accountRepository.findById(sourceAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + sourceAccountId + " не найден"));

        if (!sourceAccount.getUser().getId().equals(userId)) {
            throw new ForbiddenAccessException("Счет не принадлежит текущему пользователю");
        }

        OffsetDateTime operationDate = request.dateTime() != null ? request.dateTime() : OffsetDateTime.now();
        boolean isPinned = Boolean.TRUE.equals(request.isPinned());
        List<Tag> operationTags = resolveAccessibleTags(request.tagIds(), userId);

        if (request.type() == OperationType.TRANSFER) {
            if (request.relatedAccountId() == null) {
                throw new IllegalArgumentException("Для перевода необходимо указать целевой счет (relatedAccountId)");
            }

            Integer targetAccountId = request.relatedAccountId().intValue();
            Account targetAccount = accountRepository.findById(targetAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Целевой счет с ID " + targetAccountId + " не найден"));

            if (!targetAccount.getUser().getId().equals(userId)) {
                throw new ForbiddenAccessException("Целевой счет не принадлежит текущему пользователю");
            }

            BigDecimal incomingAmount = request.targetAmount() != null ? request.targetAmount() : request.amount();
            if (incomingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Сумма зачисления должна быть больше нуля");
            }

            int transferId = (int) (System.currentTimeMillis() % 1_000_000_000L);
            String expenseCurrency = request.currency() != null ? request.currency() : sourceAccount.getCurrency();
            String incomeCurrency = targetAccount.getCurrency();

            BigDecimal sourceAccountDebit = convertAmount(request.amount(), expenseCurrency, sourceAccount.getCurrency());
            BigDecimal targetAccountCredit = convertAmount(incomingAmount, incomeCurrency, targetAccount.getCurrency());

            applyDeltaToAccount(sourceAccount, sourceAccountDebit.negate());
            applyDeltaToAccount(targetAccount, targetAccountCredit);

            Operation expensePart = buildTransferLeg(
                    request,
                    sourceAccount,
                    targetAccount.getName(),
                    request.amount(),
                    OperationType.EXPENSE,
                    expenseCurrency,
                    targetAccountId,
                    transferId,
                    operationDate,
                    isPinned,
                    operationTags
            );

            Operation incomePart = buildTransferLeg(
                    request,
                    targetAccount,
                    sourceAccount.getName(),
                    incomingAmount,
                    OperationType.INCOME,
                    incomeCurrency,
                    sourceAccountId,
                    transferId,
                    operationDate,
                    isPinned,
                    operationTags
            );

            accountRepository.save(sourceAccount);
            accountRepository.save(targetAccount);

            Operation savedExpense = operationRepository.save(expensePart);
            operationRepository.save(incomePart);

            return enrichOperation(savedExpense, userId);
        }

        Category category = null;
        if (request.categoryId() != null) {
            category = resolveAccessibleCategory(request.categoryId().intValue(), userId);
        }

        String operationCurrency = request.currency() != null ? request.currency() : sourceAccount.getCurrency();
        BigDecimal convertedAmount = convertAmount(request.amount(), operationCurrency, sourceAccount.getCurrency());
        BigDecimal delta = calculateSignedDelta(request.type(), convertedAmount);

        applyDeltaToAccount(sourceAccount, delta);
        accountRepository.save(sourceAccount);

        Operation operation = Operation.builder()
                .account(sourceAccount)
                .category(category)
                .amount(request.amount())
                .type(request.type())
                .currency(operationCurrency)
                .date(operationDate)
                .comment(request.note())
                .merchant(request.merchant())
                .place(request.place())
                .recipient(request.recipient())
                .photoUrl(request.photoUrl())
                .isPinned(isPinned)
                .relatedAccountId(null)
                .transferId(null)
                .tags(operationTags)
                .build();

        Operation savedOperation = operationRepository.save(operation);
        return enrichOperation(savedOperation, userId);
    }

    @Override
    @Transactional
    public OperationResponse patchOperation(Integer operationId, OperationPatchRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Operation operation = findOwnedOperation(operationId, userId, "У вас нет прав для изменения этой операции");
        List<Account> userAccounts = accountRepository.findByUserId(userId);

        Operation partnerOperation = null;
        if (operation.getTransferId() != null) {
            partnerOperation = operationRepository.findAllByTransferId(operation.getTransferId())
                    .stream()
                    .filter(op -> !op.getId().equals(operation.getId()))
                    .findFirst()
                    .orElse(null);
        }

        revertOperationBalanceImpact(operation);
        if (partnerOperation != null) {
            revertOperationBalanceImpact(partnerOperation);
        }

        if (request.categoryId() != null) {
            operation.setCategory(resolveAccessibleCategory(request.categoryId().intValue(), userId));
        }

        if (request.accountId() != null) {
            Integer targetAccId = request.accountId().intValue();
            Account newAccount = userAccounts.stream()
                    .filter(acc -> acc.getId().equals(targetAccId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + targetAccId + " не найден у пользователя"));

            operation.setAccount(newAccount);
            operation.setCurrency(newAccount.getCurrency());
        }

        if (request.amount() != null) {
            if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Сумма операции должна быть больше нуля");
            }
            operation.setAmount(request.amount());
        }

        if (request.type() != null) {
            operation.setType(request.type());
        }

        if (request.dateTime() != null) {
            OffsetDateTime newDate = request.dateTime();
            operation.setDate(newDate);
            if (partnerOperation != null) {
                partnerOperation.setDate(newDate);
            }
        }

        if (request.note() != null) {
            operation.setComment(request.note());
            if (partnerOperation != null) {
                partnerOperation.setComment(request.note());
            }
        }

        if (request.recipient() != null) {
            operation.setRecipient(request.recipient());
        }

        if (request.place() != null) {
            operation.setPlace(request.place());
            if (partnerOperation != null) {
                partnerOperation.setPlace(request.place());
            }
        }

        if (request.merchant() != null) {
            operation.setMerchant(request.merchant());
            if (partnerOperation != null) {
                partnerOperation.setMerchant(request.merchant());
            }
        }

        if (request.photoUrl() != null) {
            operation.setPhotoUrl(request.photoUrl());
            if (partnerOperation != null) {
                partnerOperation.setPhotoUrl(request.photoUrl());
            }
        }

        if (request.currency() != null) {
            operation.setCurrency(request.currency());
        }

        if (request.isPinned() != null) {
            operation.setIsPinned(request.isPinned());
            if (partnerOperation != null) {
                partnerOperation.setIsPinned(request.isPinned());
            }
        }

        if (request.relatedAccountId() != null) {
            Integer relatedId = request.relatedAccountId().intValue();
            Account relatedAccount = userAccounts.stream()
                    .filter(acc -> acc.getId().equals(relatedId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Связанный счет с ID " + relatedId + " не найден у пользователя"));
            operation.setRelatedAccountId(relatedAccount.getId());
            if (partnerOperation != null) {
                partnerOperation.setAccount(relatedAccount);
                partnerOperation.setCurrency(relatedAccount.getCurrency());
                partnerOperation.setRelatedAccountId(operation.getAccount().getId());
            }
        }

        if (request.amount() != null && partnerOperation != null && partnerOperation.getType() == OperationType.INCOME) {
            partnerOperation.setAmount(request.amount());
        }

        if (request.tagIds() != null) {
            List<Tag> updatedTags = resolveAccessibleTags(request.tagIds(), userId);
            operation.setTags(updatedTags);
            if (partnerOperation != null) {
                partnerOperation.setTags(new ArrayList<>(updatedTags));
            }
        }

        applyOperationBalanceImpact(operation);
        accountRepository.save(operation.getAccount());

        if (partnerOperation != null) {
            applyOperationBalanceImpact(partnerOperation);
            accountRepository.save(partnerOperation.getAccount());
            operationRepository.save(partnerOperation);
        }

        Operation updatedOperation = operationRepository.save(operation);
        return enrichOperation(updatedOperation, userId);
    }

    @Override
    @Transactional
    public void deleteOperation(Integer operationId) {
        Integer userId = SecurityUtils.getCurrentUserId();

        Operation operation = operationRepository.findById(operationId).orElse(null);
        if (operation == null) {
            return;
        }

        List<Integer> userAccountIds = accountRepository.findByUserId(userId).stream()
                .map(Account::getId)
                .toList();

        if (!userAccountIds.contains(operation.getAccount().getId())) {
            throw new ForbiddenAccessException("У вас нет прав для удаления этой операции");
        }

        if (operation.getTransferId() != null) {
            List<Operation> transferOperations = operationRepository.findAllByTransferId(operation.getTransferId());
            for (Operation leg : transferOperations) {
                revertOperationBalanceImpact(leg);
                accountRepository.save(leg.getAccount());
            }
            operationRepository.deleteAll(transferOperations);
        } else {
            revertOperationBalanceImpact(operation);
            accountRepository.save(operation.getAccount());
            operationRepository.delete(operation);
        }
    }

    private void applyOperationBalanceImpact(Operation operation) {
        String opCurrency = operation.getCurrency() != null
                ? operation.getCurrency()
                : operation.getAccount().getCurrency();
        BigDecimal convertedAmount = convertAmount(operation.getAmount(), opCurrency, operation.getAccount().getCurrency());
        BigDecimal delta = calculateSignedDelta(operation.getType(), convertedAmount);
        applyDeltaToAccount(operation.getAccount(), delta);
    }

    private void revertOperationBalanceImpact(Operation operation) {
        String opCurrency = operation.getCurrency() != null
                ? operation.getCurrency()
                : operation.getAccount().getCurrency();
        BigDecimal convertedAmount = convertAmount(operation.getAmount(), opCurrency, operation.getAccount().getCurrency());
        BigDecimal delta = calculateSignedDelta(operation.getType(), convertedAmount).negate();
        applyDeltaToAccount(operation.getAccount(), delta);
    }

    private BigDecimal calculateSignedDelta(OperationType type, BigDecimal amount) {
        if (type == null || amount == null) {
            return BigDecimal.ZERO;
        }
        return switch (type) {
            case EXPENSE, TRANSFER -> amount.negate();
            case INCOME -> amount;
        };
    }

    private BigDecimal convertAmount(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        Map<String, Double> rates = rateService.getCachedRates();
        Double fromRate = rates.get(fromCurrency.trim().toUpperCase());
        Double toRate = rates.get(toCurrency.trim().toUpperCase());

        if (fromRate == null || fromRate <= 0) {
            throw new BusinessValidationException("Не найден курс для валюты: " + fromCurrency);
        }
        if (toRate == null || toRate <= 0) {
            throw new BusinessValidationException("Не найден курс для валюты: " + toCurrency);
        }

        BigDecimal amountInByn = amount.multiply(BigDecimal.valueOf(fromRate));
        return amountInByn.divide(BigDecimal.valueOf(toRate), 4, RoundingMode.HALF_UP);
    }

    private void applyDeltaToAccount(Account account, BigDecimal delta) {
        BigDecimal currentBalance = account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
        BigDecimal nextBalance = currentBalance.add(delta);

        if (account.getType() == AccountType.CASH && nextBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Баланс наличного счета не может быть отрицательным");
        }

        account.setBalance(nextBalance);
    }

    private List<Integer> resolveUserAccountIds(Integer userId, Integer requestedAccountId) {
        List<Account> userAccounts = accountRepository.findByUserId(userId);
        if (requestedAccountId == null) {
            return userAccounts.stream().map(Account::getId).toList();
        }

        accountRepository.findById(requestedAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + requestedAccountId + " не найден"));

        boolean belongsToUser = userAccounts.stream().anyMatch(acc -> acc.getId().equals(requestedAccountId));
        if (!belongsToUser) {
            throw new ForbiddenAccessException("У вас нет прав для доступа к этому счету");
        }

        return List.of(requestedAccountId);
    }

    private Operation findOwnedOperation(Integer operationId, Integer userId, String forbiddenMessage) {
        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new ResourceNotFoundException("Операция с ID " + operationId + " не найдена"));

        boolean belongsToUser = accountRepository.findByUserId(userId).stream()
                .anyMatch(acc -> acc.getId().equals(operation.getAccount().getId()));

        if (!belongsToUser) {
            throw new ForbiddenAccessException(forbiddenMessage);
        }

        return operation;
    }

    private Operation buildTransferLeg(
            OperationCreateRequest request,
            Account account,
            String recipient,
            BigDecimal amount,
            OperationType type,
            String currency,
            Integer relatedAccountId,
            int transferId,
            OffsetDateTime operationDate,
            boolean isPinned,
            List<Tag> operationTags
    ) {
        return Operation.builder()
                .account(account)
                .category(null)
                .amount(amount)
                .type(type)
                .currency(currency)
                .date(operationDate)
                .comment(request.note())
                .merchant(request.merchant())
                .place(request.place())
                .recipient(recipient)
                .photoUrl(request.photoUrl())
                .isPinned(isPinned)
                .relatedAccountId(relatedAccountId)
                .transferId(transferId)
                .tags(new ArrayList<>(operationTags))
                .build();
    }

    private List<OperationResponse> enrichOperations(List<Operation> operations, Integer userId) {
        Map<Integer, UserCategory> categoryOverrides = loadCategoryOverrides(userId);
        Map<Integer, UserTag> tagOverrides = loadTagOverrides(userId);

        return operations.stream()
                .map(op -> applyUserOverrides(op, operationMapper.toOperationResponse(op), categoryOverrides, tagOverrides))
                .toList();
    }

    private OperationResponse enrichOperation(Operation operation, Integer userId) {
        return applyUserOverrides(
                operation,
                operationMapper.toOperationResponse(operation),
                loadCategoryOverrides(userId),
                loadTagOverrides(userId)
        );
    }

    private Integer decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(cursor), StandardCharsets.UTF_8);
            return Integer.valueOf(decoded);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Некорректный формат курсора пагинации");
        }
    }

    private String encodeCursor(Integer id) {
        return Base64.getEncoder().encodeToString(id.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Map<Integer, UserCategory> loadCategoryOverrides(Integer userId) {
        return userCategoryRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(uc -> uc.getCategory().getId(), uc -> uc));
    }

    private Map<Integer, UserTag> loadTagOverrides(Integer userId) {
        return userTagRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(ut -> ut.getTag().getId(), ut -> ut));
    }

    private OperationResponse applyUserOverrides(
            Operation op,
            OperationResponse base,
            Map<Integer, UserCategory> categoryOverrides,
            Map<Integer, UserTag> tagOverrides
    ) {
        String categoryName = base.category();
        String categoryIcon = base.categoryIcon();
        String categoryColor = base.categoryColor();

        if (op.getCategory() != null) {
            UserCategory catOverride = categoryOverrides.get(op.getCategory().getId());
            if (catOverride != null && Boolean.TRUE.equals(catOverride.getIsCustomized())) {
                if (catOverride.getCustomName() != null) {
                    categoryName = catOverride.getCustomName();
                }
                if (catOverride.getCustomIcon() != null) {
                    categoryIcon = catOverride.getCustomIcon();
                }
                if (catOverride.getCustomColor() != null) {
                    categoryColor = catOverride.getCustomColor();
                }
            }
        }

        List<TagDto> resolvedTags = base.tags() == null
                ? List.of()
                : base.tags().stream()
                .map(tagDto -> {
                    if (tagDto.id() == null) {
                        return tagDto;
                    }
                    UserTag tagOverride = tagOverrides.get(tagDto.id().intValue());
                    if (tagOverride == null || !Boolean.TRUE.equals(tagOverride.getIsCustomized())) {
                        return tagDto;
                    }
                    return new TagDto(
                            tagDto.id(),
                            tagOverride.getCustomName() != null ? tagOverride.getCustomName() : tagDto.name(),
                            tagOverride.getCustomColor() != null ? tagOverride.getCustomColor() : tagDto.color(),
                            tagOverride.getCustomIcon() != null ? tagOverride.getCustomIcon() : tagDto.icon()
                    );
                })
                .toList();

        return new OperationResponse(
                base.id(),
                base.type(),
                base.amount(),
                base.currency(),
                categoryName,
                categoryIcon,
                categoryColor,
                base.categoryId(),
                base.account(),
                base.accountId(),
                base.accountIcon(),
                base.accountColor(),
                base.relatedAccountId(),
                base.transferId(),
                base.note(),
                base.recipient(),
                base.place(),
                resolvedTags,
                base.merchant(),
                base.photoUrl(),
                base.isPinned(),
                base.dateTime()
        );
    }

    private Category resolveAccessibleCategory(Integer categoryId, Integer userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + categoryId + " не найдена"));

        CategoryAccessPolicy.assertAccessible(category, userId);

        UserCategory override = userCategoryRepository.findByUserIdAndCategoryId(userId, category.getId()).orElse(null);
        boolean isHidden = (override != null && Boolean.TRUE.equals(override.getIsHidden()))
                || Boolean.TRUE.equals(category.getIsHidden());

        if (isHidden) {
            throw new BusinessValidationException("Нельзя привязать операцию к скрытой категории");
        }

        return category;
    }

    private List<Tag> resolveAccessibleTags(List<Long> tagIds, Integer userId) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Integer> uniqueTagIds = new LinkedHashSet<>();
        for (Long rawId : tagIds) {
            if (rawId != null) {
                uniqueTagIds.add(rawId.intValue());
            }
        }

        if (uniqueTagIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Tag> foundTags = tagRepository.findAllById(uniqueTagIds);
        if (foundTags.size() != uniqueTagIds.size()) {
            throw new ResourceNotFoundException("Одна или несколько указанных меток не найдены");
        }

        List<Tag> result = new ArrayList<>(foundTags.size());
        for (Tag tag : foundTags) {
            boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem()) && tag.getUser() == null;
            boolean isOwner = tag.getUser() != null && tag.getUser().getId().equals(userId);

            if (!isSystem && !isOwner) {
                throw new ForbiddenAccessException("У вас нет прав для использования метки с ID " + tag.getId());
            }

            UserTag override = userTagRepository.findByUserIdAndTagId(userId, tag.getId()).orElse(null);
            boolean isHidden = (override != null && Boolean.TRUE.equals(override.getIsHidden()))
                    || Boolean.TRUE.equals(tag.getIsArchived());

            if (isHidden) {
                throw new BusinessValidationException("Нельзя привязать операцию к скрытой метке с ID " + tag.getId());
            }

            result.add(tag);
        }

        return result;
    }
}
