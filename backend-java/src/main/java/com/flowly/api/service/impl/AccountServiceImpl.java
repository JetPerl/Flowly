package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.mapper.AccountMapper;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.enums.AccountType;
import com.flowly.api.model.request.account.AccountCreateRequest;
import com.flowly.api.model.request.account.AccountUpdateRequest;
import com.flowly.api.model.response.account.AccountResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.AccountService;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountServiceImpl implements AccountService {

    AccountRepository accountRepository;
    UserRepository userRepository;
    AccountMapper accountMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccounts() {
        Integer userId = SecurityUtils.getCurrentUserId();
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accountMapper.toAccountResponseList(accounts);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccountById(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Account account = findOwnedAccount(id, userId);
        return accountMapper.toAccountResponse(account);
    }

    @Override
    @Transactional
    public AccountResponse createAccount(AccountCreateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с ID " + userId + " не найден"));

        validateBalanceForType(request.type(), request.balance());

        Account account = Account.builder()
                .user(user)
                .name(request.name().trim())
                .balance(request.balance())
                .currency(request.currency().trim().toUpperCase())
                .type(request.type())
                .color(request.color().trim())
                .icon(request.icon().trim())
                .build();

        Account saved = accountRepository.save(account);
        return accountMapper.toAccountResponse(saved);
    }

    @Override
    @Transactional
    public AccountResponse updateAccount(Integer id, AccountUpdateRequest request) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Account account = findOwnedAccount(id, userId);

        AccountType effectiveType = request.type() != null ? request.type() : account.getType();
        BigDecimal effectiveBalance = request.balance() != null ? request.balance() : account.getBalance();
        validateBalanceForType(effectiveType, effectiveBalance);

        if (request.name() != null) {
            account.setName(request.name().trim());
        }
        if (request.balance() != null) {
            account.setBalance(request.balance());
        }
        if (request.currency() != null) {
            account.setCurrency(request.currency().trim().toUpperCase());
        }
        if (request.type() != null) {
            account.setType(request.type());
        }
        if (request.color() != null) {
            account.setColor(request.color().trim());
        }
        if (request.icon() != null) {
            account.setIcon(request.icon().trim());
        }

        Account updated = accountRepository.save(account);
        return accountMapper.toAccountResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAccount(Integer id) {
        Integer userId = SecurityUtils.getCurrentUserId();
        Account account = findOwnedAccount(id, userId);
        accountRepository.delete(account);
    }

    private void validateBalanceForType(AccountType type, BigDecimal balance) {
        if (type == AccountType.CASH && balance != null && balance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Баланс наличного счета не может быть отрицательным");
        }
    }

    private Account findOwnedAccount(Integer id, Integer userId) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Счет с ID " + id + " не найден"));

        if (account.getUser() == null || !account.getUser().getId().equals(userId)) {
            throw new ForbiddenAccessException("У вас нет прав для доступа к этому счету");
        }

        return account;
    }
}
