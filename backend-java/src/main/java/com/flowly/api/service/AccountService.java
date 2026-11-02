package com.flowly.api.service;

import com.flowly.api.model.response.AccountResponse;

import java.util.List;

public interface AccountService {

    List<AccountResponse> getAccounts(String email);
}
