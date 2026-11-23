package com.flowly.api.service;

import com.flowly.api.model.request.account.AccountCreateRequest;
import com.flowly.api.model.request.account.AccountUpdateRequest;
import com.flowly.api.model.response.account.AccountResponse;

import java.util.List;

public interface AccountService {

    List<AccountResponse> getAccounts();

    AccountResponse getAccountById(Integer id);

    AccountResponse createAccount(AccountCreateRequest request);

    AccountResponse updateAccount(Integer id, AccountUpdateRequest request);

    void deleteAccount(Integer id);
}
