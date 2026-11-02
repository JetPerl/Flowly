package com.flowly.api.service.impl;

import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.OperationMapper;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.Category;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.request.OperationPatchRequest;
import com.flowly.api.model.response.OperationPageResponse;
import com.flowly.api.model.response.OperationResponse;
import com.flowly.api.model.response.PageInfoResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.CategoryRepository;
import com.flowly.api.repository.OperationRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.OperationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
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

        boolean hasAccess = userAccountIds.contains(operation.getAccount().getId());
        if (!hasAccess) {
            throw new ForbiddenAccessException("У вас нет прав для доступа к этой операции");
        }

        return operationMapper.toOperationResponse(operation);
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

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Категория с ID " + request.categoryId() + " не найдена"));
            operation.setCategory(category);
        }

        if (request.accountId() != null) {
            Account newAccount = userAccounts.stream()
                    .filter(acc -> acc.getId().equals(request.accountId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + request.accountId() + " не найден у пользователя"));

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
            operation.setDate(request.dateTime());
        }

        if (request.note() != null) {
            operation.setComment(request.note());
        }

        if (request.recipient() != null) {
            operation.setRecipient(request.recipient());
        }

        if (request.place() != null) {
            operation.setPlace(request.place());
        }

        if (request.isPinned() != null) {
            operation.setIsPinned(request.isPinned());
        }

        Operation updatedOperation = operationRepository.save(operation);

        return operationMapper.toOperationResponse(updatedOperation);
    }
}
