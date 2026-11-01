package com.flowly.api.service;

import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.Operation;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.enums.OperationType;
import com.flowly.api.model.response.HistorySectionResponse;
import com.flowly.api.model.response.OperationResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.OperationRepository;
import com.flowly.api.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationService {

    OperationRepository operationRepository;
    UserRepository userRepository;
    AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<HistorySectionResponse> getOperationSections(String userEmail, Integer accountId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        List<Account> userAccounts = accountRepository.findByUserId(user.getId());
        List<Integer> accountIds = accountId != null
                ? List.of(accountId)
                : userAccounts.stream().map(Account::getId).toList();

        List<Operation> operations = operationRepository.findAll().stream()
                .filter(op -> op.getAccount() != null && accountIds.contains(op.getAccount().getId()))
                .sorted(Comparator.comparing(Operation::getDate).reversed())
                .toList();

        Map<String, List<Operation>> groupedByDate = operations.stream()
                .collect(Collectors.groupingBy(
                        op -> op.getDate().toLocalDate().toString(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<HistorySectionResponse> sections = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.of("ru"));

        groupedByDate.forEach((dateStr, ops) -> {
            List<OperationResponse> items = ops.stream().map(this::mapToResponse).toList();
            BigDecimal dayTotal = ops.stream()
                    .map(op -> op.getType() == OperationType.INCOME ? op.getAmount() : op.getAmount().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            sections.add(new HistorySectionResponse(
                    dateStr,
                    ops.getFirst().getDate().toLocalDate(),
                    ops.getFirst().getDate().format(formatter),
                    dayTotal,
                    items
            ));
        });

        return sections;
    }

    private OperationResponse mapToResponse(Operation op) {
        return new OperationResponse(
                op.getId(),
                op.getType().name().toLowerCase(),
                op.getAmount(),
                op.getCurrency(),
                op.getCategory() != null ? op.getCategory().getName() : "Без категории",
                op.getCategory() != null ? op.getCategory().getIcon() : null,
                op.getCategory() != null ? op.getCategory().getColor() : null,
                op.getCategory() != null ? op.getCategory().getId() : null,
                op.getAccount() != null ? op.getAccount().getName() : "Счет",
                op.getAccount() != null ? op.getAccount().getId() : null,
                op.getAccount() != null ? op.getAccount().getIcon() : null,
                op.getAccount() != null ? op.getAccount().getColor() : null,
                null,
                null,
                op.getComment(),
                "",
                "",
                false,
                op.getDate()
        );
    }
}
