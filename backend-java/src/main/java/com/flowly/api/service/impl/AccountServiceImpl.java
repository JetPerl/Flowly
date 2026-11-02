package com.flowly.api.service.impl;

import com.flowly.api.mapper.AccountMapper;
import com.flowly.api.model.entity.Account;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.response.AccountResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.AccountService;
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
    UserRepository userRepository;
    AccountMapper accountMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> getAccounts(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return List.of();
        }

        List<Account> accounts = accountRepository.findByUserId(user.getId());
        return accountMapper.toAccountResponseList(accounts);
    }
}
