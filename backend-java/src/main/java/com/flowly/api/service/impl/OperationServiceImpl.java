package com.flowly.api.service.impl;

import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.OperationMapper;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.Tag;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.enums.OperationType;
import com.flowly.api.model.request.OperationCreateRequest;
import com.flowly.api.model.request.OperationPatchRequest;
import com.flowly.api.model.response.OperationPageResponse;
import com.flowly.api.model.response.OperationResponse;
import com.flowly.api.model.response.PageInfoResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.repository.OperationRepository;
import com.flowly.api.repository.TagRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.OperationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationServiceImpl implements OperationService {

    OperationRepository operationRepository;
    UserRepository userRepository;
    AccountRepository accountRepository;
    OperationMapper operationMapper;
    CategoryRepository categoryRepository;
    TagRepository tagRepository; // <-- 1. ДОБАВИТЬ РЕПОЗИТОРИЙ ТЕГОВ

    @Override
    @Transactional(readOnly = true)
    public OperationPageResponse getOperationsWithCursor(String userEmail, Integer accountId, Integer limit, String cursor) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        List<Account> userAccounts = accountRepository.findByUserId(user.getId());

        List<Integer> accountIds;
        if (accountId != null) {
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + accountId + " не найден"));

            boolean belongsToUser = userAccounts.stream().anyMatch(acc -> acc.getId().equals(accountId));
            if (!belongsToUser) {
                throw new ForbiddenAccessException("У вас нет прав для доступа к этому счету");
            }

            accountIds = List.of(accountId);
        } else {
            accountIds = userAccounts.stream().map(Account::getId).toList();
        }

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

        List<OperationResponse> items = operations.stream()
                .map(operationMapper::toOperationResponse)
                .toList();

        String nextCursor = null;
        if (hasNext && !operations.isEmpty()) {
            Integer lastId = operations.getLast().getId();
            nextCursor = encodeCursor(lastId);
        }

        return new OperationPageResponse(
                items,
                new PageInfoResponse(items.size(), hasNext, nextCursor)
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

    @Override
    @Transactional(readOnly = true)
    public OperationResponse getOperationById(String userEmail, Integer operationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new ResourceNotFoundException("Операция с ID " + operationId + " не найдена"));

        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        List<Integer> userAccountIds = userAccounts.stream().map(Account::getId).toList();

        if (!userAccountIds.contains(operation.getAccount().getId())) {
            throw new ForbiddenAccessException("У вас нет прав для доступа к этой операции");
        }

        return operationMapper.toOperationResponse(operation);
    }

    @Override
    @Transactional
    public OperationResponse createOperation(String userEmail, OperationCreateRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        Integer sourceAccountId = request.accountId() != null ? request.accountId().intValue() : null;
        Account sourceAccount = accountRepository.findById(sourceAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + sourceAccountId + " не найден"));

        if (!sourceAccount.getUser().getId().equals(user.getId())) {
            throw new ForbiddenAccessException("Счет не принадлежит текущему пользователю");
        }

        OffsetDateTime operationDate = request.dateTime() != null ? request.dateTime() : OffsetDateTime.now();

        // Загрузка тегов
        List<Tag> operationTags = new ArrayList<>();
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            List<Integer> tagIntIds = request.tagIds().stream().map(Long::intValue).toList();
            operationTags = tagRepository.findAllById(tagIntIds);
        }

        // --- ЛОГИКА ПЕРЕВОДА ---
        if (request.type() == OperationType.TRANSFER) {
            if (request.relatedAccountId() == null) {
                throw new IllegalArgumentException("Для перевода необходимо указать целевой счет (relatedAccountId)");
            }

            Integer targetAccountId = request.relatedAccountId().intValue();
            Account targetAccount = accountRepository.findById(targetAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Целевой счет с ID " + targetAccountId + " не найден"));

            if (!targetAccount.getUser().getId().equals(user.getId())) {
                throw new ForbiddenAccessException("Целевой счет не принадлежит текущему пользователю");
            }

            int transferId = (int) (System.currentTimeMillis() % 1_000_000_000L);

            BigDecimal incomingAmount = request.targetAmount() != null ? request.targetAmount() : request.amount();

            // 1. Списание со счета-источника
            Operation expensePart = Operation.builder()
                    .account(sourceAccount)
                    .category(null)
                    .amount(request.amount())
                    .type(OperationType.EXPENSE)
                    .currency(request.currency() != null ? request.currency() : sourceAccount.getCurrency())
                    .date(operationDate)
                    .comment(request.note())
                    .merchant(request.merchant())
                    .place(request.place())
                    .recipient(targetAccount.getName())
                    .photoUrl(request.photoUrl())
                    .isPinned(request.isPinned() != null ? request.isPinned() : false)
                    .relatedAccountId(targetAccountId)
                    .transferId(transferId)
                    .tags(new ArrayList<>(operationTags))
                    .build();

            // 2. Зачисление на целевой счет (в его валюте и сумме)
            Operation incomePart = Operation.builder()
                    .account(targetAccount)
                    .category(null)
                    .amount(incomingAmount)
                    .type(OperationType.INCOME)
                    .currency(targetAccount.getCurrency())
                    .date(operationDate)
                    .comment(request.note())
                    .merchant(request.merchant())
                    .place(request.place())
                    .recipient(sourceAccount.getName())
                    .photoUrl(request.photoUrl())
                    .isPinned(request.isPinned() != null ? request.isPinned() : false)
                    .relatedAccountId(sourceAccountId)
                    .transferId(transferId)
                    .tags(new ArrayList<>(operationTags))
                    .build();

            Operation savedExpense = operationRepository.save(expensePart);
            operationRepository.save(incomePart);

            return operationMapper.toOperationResponse(savedExpense);
        }

        // --- ОБЫЧНАЯ ОПЕРАЦИЯ (EXPENSE / INCOME) ---
        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId().intValue())
                    .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + request.categoryId() + " не найдена"));
        }

        Operation operation = Operation.builder()
                .account(sourceAccount)
                .category(category)
                .amount(request.amount())
                .type(request.type())
                .currency(request.currency() != null ? request.currency() : sourceAccount.getCurrency())
                .date(operationDate)
                .comment(request.note())
                .merchant(request.merchant())
                .place(request.place())
                .recipient(request.recipient())
                .photoUrl(request.photoUrl())
                .isPinned(request.isPinned() != null ? request.isPinned() : false)
                .relatedAccountId(null)
                .transferId(null)
                .tags(operationTags)
                .build();

        Operation savedOperation = operationRepository.save(operation);
        return operationMapper.toOperationResponse(savedOperation);
    }

    @Override
    @Transactional
    public OperationResponse patchOperation(String userEmail, Integer operationId, OperationPatchRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        Operation operation = operationRepository.findById(operationId)
                .orElseThrow(() -> new ResourceNotFoundException("Операция с ID " + operationId + " не найдена"));

        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        List<Integer> userAccountIds = userAccounts.stream().map(Account::getId).toList();

        if (!userAccountIds.contains(operation.getAccount().getId())) {
            throw new ForbiddenAccessException("У вас нет прав для изменения этой операции");
        }

        Operation partnerOperation = null;
        if (operation.getTransferId() != null) {
            partnerOperation = operationRepository.findAllByTransferId(operation.getTransferId())
                    .stream()
                    .filter(op -> !op.getId().equals(operation.getId()))
                    .findFirst()
                    .orElse(null);
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId().intValue())
                    .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + request.categoryId() + " не найдена"));
            operation.setCategory(category);
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
            operation.setRelatedAccountId(request.relatedAccountId().intValue());
        }

        // Обновление тегов
        if (request.tagIds() != null) {
            List<Integer> tagIntIds = request.tagIds().stream().map(Long::intValue).toList();
            List<Tag> updatedTags = tagRepository.findAllById(tagIntIds);
            operation.setTags(updatedTags);
            if (partnerOperation != null) {
                partnerOperation.setTags(new ArrayList<>(updatedTags));
            }
        }

        if (partnerOperation != null) {
            operationRepository.save(partnerOperation);
        }

        Operation updatedOperation = operationRepository.save(operation);
        return operationMapper.toOperationResponse(updatedOperation);
    }

    @Override
    @Transactional
    public void deleteOperation(String userEmail, Integer operationId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        // Если операция уже удалена (идемпотентность HTTP DELETE) — просто выходим
        Operation operation = operationRepository.findById(operationId).orElse(null);
        if (operation == null) {
            return;
        }

        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        List<Integer> userAccountIds = userAccounts.stream().map(Account::getId).toList();

        if (!userAccountIds.contains(operation.getAccount().getId())) {
            throw new ForbiddenAccessException("У вас нет прав для удаления этой операции");
        }

        if (operation.getTransferId() != null) {
            List<Operation> transferOperations = operationRepository.findAllByTransferId(operation.getTransferId());
            operationRepository.deleteAll(transferOperations);
        } else {
            operationRepository.delete(operation);
        }
    }
}
