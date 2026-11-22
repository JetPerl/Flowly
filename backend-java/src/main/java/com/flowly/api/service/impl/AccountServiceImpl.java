package com.flowly.api.service.impl;

import com.flowly.api.mapper.AccountMapper;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.response.AccountResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.service.AccountService;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountServiceImpl implements AccountService {

    AccountRepository accountRepository;
    AccountMapper accountMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccounts() {
        Integer userId = SecurityUtils.getCurrentUserId();
        List<Account> accounts = accountRepository.findByUserId(userId);
        return accountMapper.toAccountResponseList(accounts);
    }
}
