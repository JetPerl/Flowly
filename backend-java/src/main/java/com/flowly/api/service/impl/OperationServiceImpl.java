package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.OperationMapper;
import com.flowly.api.mapper.TagMapper;
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
import com.flowly.api.utils.CursorCodec;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    TagMapper tagMapper;

    @Override
    @Transactional(readOnly = true)
    public OperationPageResponse getOperationsWithCursor(Integer accountId, Integer limit, String cursor) {
        Integer userId = SecurityUtils.getCurrentUserId();
        List<Integer> accountIds = resolveUserAccountIds(userId, accountId);

        if (accountIds.isEmpty()) {
            return new OperationPageResponse(List.of(), new PageInfoResponse(0, false, null));
        }

        int pageSize = (limit != null) ? limit : 20;
        List<Operation> operations = operationRepository.findOperationsWithCursor(
                accountIds,
                CursorCodec.decode(cursor),
                PageRequest.of(0, pageSize + 1)
        );

        boolean hasNext = operations.size() > pageSize;
        if (hasNext) {
            operations = operations.subList(0, pageSize);
        }

        List<OperationResponse> items = enrichOperations(operations, userId);
        String nextCursor = (hasNext && !operations.isEmpty()) ? CursorCodec.encode(operations.getLast().getId()) : null;

        return new OperationPageResponse(items, new PageInfoResponse(items.size(), hasNext, nextCursor));
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
        validateCreateRequest(request);

        OffsetDateTime operationDate = request.dateTime() != null ? request.dateTime() : OffsetDateTime.now();
        boolean isPinned = Boolean.TRUE.equals(request.isPinned());
        List<Tag> operationTags = resolveAccessibleTags(request.tagIds(), userId);

        if (request.type() == OperationType.TRANSFER) {
            return createTransfer(request, userId, operationDate, isPinned, operationTags);
        }
        return createSingleOperation(request, userId, operationDate, isPinned, operationTags);
    }

    @Override
    @Transactional
    public OperationResponse patchOperation(Integer operationId, OperationPatchRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Operation operation = findOwnedOperation(operationId, userId, "У вас нет прав для изменения этой операции");
        Operation partnerOperation = findTransferPartner(operation);

        if (request.amount() != null && request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Сумма операции должна быть больше нуля");
        }

        Set<Integer> accountIdsToLock = Stream.of(
                        operation.getAccount() != null ? operation.getAccount().getId() : null,
                        partnerOperation != null && partnerOperation.getAccount() != null ? partnerOperation.getAccount().getId() : null,
                        request.accountId() != null ? request.accountId().intValue() : null,
                        request.relatedAccountId() != null ? request.relatedAccountId().intValue() : null
                )
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, Account> lockedAccounts = lockOwnedAccounts(accountIdsToLock, userId);

        Account currentOpAccount = lockedAccounts.get(operation.getAccount().getId());
        Account currentPartnerAccount = partnerOperation != null
                ? lockedAccounts.get(partnerOperation.getAccount().getId())
                : null;

        revertOperationBalanceImpact(operation, currentOpAccount);
        if (partnerOperation != null) {
            revertOperationBalanceImpact(partnerOperation, currentPartnerAccount);
        }

        operation.setAccount(currentOpAccount);
        if (partnerOperation != null) {
            partnerOperation.setAccount(currentPartnerAccount);
        }

        operationMapper.updateFromPatch(request, operation);

        if (request.categoryId() != null) {
            operation.setCategory(resolveAccessibleCategory(request.categoryId().intValue(), userId));
        }

        if (request.accountId() != null) {
            Account newAccount = lockedAccounts.get(request.accountId().intValue());
            operation.setAccount(newAccount);
            if (request.currency() == null) {
                operation.setCurrency(newAccount.getCurrency());
            }
        }

        if (request.relatedAccountId() != null) {
            Account relatedAccount = lockedAccounts.get(request.relatedAccountId().intValue());
            operation.setRelatedAccountId(relatedAccount.getId());
            if (partnerOperation != null) {
                partnerOperation.setAccount(relatedAccount);
                partnerOperation.setCurrency(relatedAccount.getCurrency());
                partnerOperation.setRelatedAccountId(operation.getAccount().getId());
            }
        }

        if (partnerOperation != null) {
            operationMapper.syncPartnerFromPatch(request, partnerOperation);
            if (request.amount() != null && partnerOperation.getType() == OperationType.INCOME) {
                partnerOperation.setAmount(request.amount());
            }
        }

        if (request.tagIds() != null) {
            List<Tag> updatedTags = resolveAccessibleTags(request.tagIds(), userId);
            operation.setTags(updatedTags);
            if (partnerOperation != null) {
                partnerOperation.setTags(new ArrayList<>(updatedTags));
            }
        }

        applyOperationBalanceImpact(operation, operation.getAccount());
        accountRepository.save(operation.getAccount());

        if (partnerOperation != null) {
            applyOperationBalanceImpact(partnerOperation, partnerOperation.getAccount());
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
            Set<Integer> accountIds = transferOperations.stream()
                    .map(leg -> leg.getAccount() != null ? leg.getAccount().getId() : null)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            Map<Integer, Account> lockedAccounts = lockOwnedAccounts(accountIds, userId);
            for (Operation leg : transferOperations) {
                Account lockedAccount = lockedAccounts.get(leg.getAccount().getId());
                revertOperationBalanceImpact(leg, lockedAccount);
                accountRepository.save(lockedAccount);
            }
            operationRepository.deleteAll(transferOperations);
        } else {
            Integer accountId = operation.getAccount().getId();
            Account lockedAccount = lockOwnedAccounts(Set.of(accountId), userId).get(accountId);
            revertOperationBalanceImpact(operation, lockedAccount);
            accountRepository.save(lockedAccount);
            operationRepository.delete(operation);
        }
    }

    private void validateCreateRequest(OperationCreateRequest request) {
        if (request.accountId() == null) {
            throw new IllegalArgumentException("Идентификатор счета обязателен");
        }
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Сумма операции должна быть больше нуля");
        }
        if (request.type() == OperationType.TRANSFER) {
            if (request.relatedAccountId() == null) {
                throw new IllegalArgumentException("Для перевода необходимо указать целевой счет (relatedAccountId)");
            }
            BigDecimal incomingAmount = request.targetAmount() != null ? request.targetAmount() : request.amount();
            if (incomingAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Сумма зачисления должна быть больше нуля");
            }
        }
    }

    private OperationResponse createTransfer(
            OperationCreateRequest request,
            Integer userId,
            OffsetDateTime operationDate,
            boolean isPinned,
            List<Tag> operationTags
    ) {
        Integer sourceAccountId = request.accountId().intValue();
        Integer targetAccountId = request.relatedAccountId().intValue();
        BigDecimal incomingAmount = request.targetAmount() != null ? request.targetAmount() : request.amount();

        Map<Integer, Account> lockedAccounts = lockOwnedAccounts(Set.of(sourceAccountId, targetAccountId), userId);
        Account sourceAccount = lockedAccounts.get(sourceAccountId);
        Account targetAccount = lockedAccounts.get(targetAccountId);

        int transferId = (int) (System.currentTimeMillis() % 1_000_000_000L);
        String expenseCurrency = request.currency() != null ? request.currency() : sourceAccount.getCurrency();
        String incomeCurrency = targetAccount.getCurrency();

        BigDecimal sourceDebit = rateService.convert(request.amount(), expenseCurrency, sourceAccount.getCurrency());
        BigDecimal targetCredit = rateService.convert(incomingAmount, incomeCurrency, targetAccount.getCurrency());

        applyDeltaToAccount(sourceAccount, sourceDebit.negate());
        applyDeltaToAccount(targetAccount, targetCredit);

        Operation expensePart = operationMapper.toTransferLeg(
                request, sourceAccount, targetAccount.getName(), request.amount(),
                OperationType.EXPENSE, expenseCurrency, targetAccountId, transferId,
                operationDate, isPinned, operationTags
        );
        Operation incomePart = operationMapper.toTransferLeg(
                request, targetAccount, sourceAccount.getName(), incomingAmount,
                OperationType.INCOME, incomeCurrency, sourceAccountId, transferId,
                operationDate, isPinned, operationTags
        );

        accountRepository.save(sourceAccount);
        accountRepository.save(targetAccount);
        Operation savedExpense = operationRepository.save(expensePart);
        operationRepository.save(incomePart);

        return enrichOperation(savedExpense, userId);
    }

    private OperationResponse createSingleOperation(
            OperationCreateRequest request,
            Integer userId,
            OffsetDateTime operationDate,
            boolean isPinned,
            List<Tag> operationTags
    ) {
        Integer sourceAccountId = request.accountId().intValue();
        Account sourceAccount = lockOwnedAccounts(Set.of(sourceAccountId), userId).get(sourceAccountId);

        Category category = request.categoryId() != null
                ? resolveAccessibleCategory(request.categoryId().intValue(), userId)
                : null;

        String operationCurrency = request.currency() != null ? request.currency() : sourceAccount.getCurrency();
        BigDecimal convertedAmount = rateService.convert(request.amount(), operationCurrency, sourceAccount.getCurrency());
        BigDecimal delta = calculateSignedDelta(request.type(), convertedAmount);

        applyDeltaToAccount(sourceAccount, delta);
        accountRepository.save(sourceAccount);

        Operation operation = operationMapper.toEntity(
                request, sourceAccount, category, operationCurrency, operationDate, isPinned, operationTags
        );
        return enrichOperation(operationRepository.save(operation), userId);
    }

    private Operation findTransferPartner(Operation operation) {
        if (operation.getTransferId() == null) {
            return null;
        }
        return operationRepository.findAllByTransferId(operation.getTransferId()).stream()
                .filter(op -> !op.getId().equals(operation.getId()))
                .findFirst()
                .orElse(null);
    }

    private void applyOperationBalanceImpact(Operation operation, Account targetAccount) {
        String opCurrency = operation.getCurrency() != null ? operation.getCurrency() : targetAccount.getCurrency();
        BigDecimal convertedAmount = rateService.convert(operation.getAmount(), opCurrency, targetAccount.getCurrency());
        applyDeltaToAccount(targetAccount, calculateSignedDelta(operation.getType(), convertedAmount));
    }

    private void revertOperationBalanceImpact(Operation operation, Account targetAccount) {
        String opCurrency = operation.getCurrency() != null ? operation.getCurrency() : targetAccount.getCurrency();
        BigDecimal convertedAmount = rateService.convert(operation.getAmount(), opCurrency, targetAccount.getCurrency());
        applyDeltaToAccount(targetAccount, calculateSignedDelta(operation.getType(), convertedAmount).negate());
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

    private List<OperationResponse> enrichOperations(List<Operation> operations, Integer userId) {
        Map<Integer, UserCategory> categoryOverrides = loadCategoryOverrides(userId);
        Map<Integer, UserTag> tagOverrides = loadTagOverrides(userId);
        return operations.stream()
                .map(op -> buildEnrichedResponse(op, categoryOverrides, tagOverrides))
                .toList();
    }

    private OperationResponse enrichOperation(Operation operation, Integer userId) {
        return buildEnrichedResponse(operation, loadCategoryOverrides(userId), loadTagOverrides(userId));
    }

    private OperationResponse buildEnrichedResponse(
            Operation op,
            Map<Integer, UserCategory> categoryOverrides,
            Map<Integer, UserTag> tagOverrides
    ) {
        String categoryName = op.getCategory() != null ? op.getCategory().getName() : "Без категории";
        String categoryIcon = op.getCategory() != null ? op.getCategory().getIcon() : null;
        String categoryColor = op.getCategory() != null ? op.getCategory().getColor() : null;

        if (op.getCategory() != null) {
            UserCategory override = categoryOverrides.get(op.getCategory().getId());
            if (override != null && Boolean.TRUE.equals(override.getIsCustomized())) {
                if (override.getCustomName() != null) {
                    categoryName = override.getCustomName();
                }
                if (override.getCustomIcon() != null) {
                    categoryIcon = override.getCustomIcon();
                }
                if (override.getCustomColor() != null) {
                    categoryColor = override.getCustomColor();
                }
            }
        }

        List<TagDto> resolvedTags = op.getTags() == null
                ? List.of()
                : op.getTags().stream()
                .filter(Objects::nonNull)
                .map(tag -> tagMapper.toDto(tag, tag.getId() != null ? tagOverrides.get(tag.getId()) : null))
                .toList();

        return operationMapper.toOperationResponse(op, categoryName, categoryIcon, categoryColor, resolvedTags);
    }

    private Map<Integer, UserCategory> loadCategoryOverrides(Integer userId) {
        return userCategoryRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(uc -> uc.getCategory().getId(), uc -> uc));
    }

    private Map<Integer, UserTag> loadTagOverrides(Integer userId) {
        return userTagRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(ut -> ut.getTag().getId(), ut -> ut));
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

        Set<Integer> uniqueTagIds = tagIds.stream()
                .filter(Objects::nonNull)
                .map(Long::intValue)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (uniqueTagIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Tag> foundTags = tagRepository.findAllById(uniqueTagIds);
        if (foundTags.size() != uniqueTagIds.size()) {
            throw new ResourceNotFoundException("Одна или несколько указанных меток не найдены");
        }

        Map<Integer, UserTag> tagOverrides = loadTagOverrides(userId);

        for (Tag tag : foundTags) {
            boolean isSystem = Boolean.TRUE.equals(tag.getIsSystem()) && tag.getUser() == null;
            boolean isOwner = tag.getUser() != null
                    && userId != null
                    && userId.equals(tag.getUser().getId());

            if (!isSystem && !isOwner) {
                throw new ForbiddenAccessException("У вас нет прав для использования метки с ID " + tag.getId());
            }

            UserTag override = tag.getId() != null ? tagOverrides.get(tag.getId()) : null;
            boolean isHidden = (override != null && Boolean.TRUE.equals(override.getIsHidden()))
                    || Boolean.TRUE.equals(tag.getIsArchived());

            if (isHidden) {
                throw new BusinessValidationException("Нельзя привязать операцию к скрытой метке с ID " + tag.getId());
            }
        }

        return foundTags;
    }

    private Map<Integer, Account> lockOwnedAccounts(Set<Integer> accountIds, Integer userId) {
        List<Integer> sortedIds = accountIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        Map<Integer, Account> lockedById = new LinkedHashMap<>();
        for (Integer accId : sortedIds) {
            Account account = accountRepository.findByIdForUpdate(accId)
                    .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + accId + " не найден"));
            if (account.getUser() == null || !account.getUser().getId().equals(userId)) {
                throw new ForbiddenAccessException("Счет не принадлежит текущему пользователю");
            }
            lockedById.put(accId, account);
        }
        return lockedById;
    }
}
