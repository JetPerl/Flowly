package com.flowly.api.controller.impl;

import com.flowly.api.controller.AccountController;
import com.flowly.api.model.request.account.AccountCreateRequest;
import com.flowly.api.model.request.account.AccountUpdateRequest;
import com.flowly.api.model.response.account.AccountResponse;
import com.flowly.api.service.AccountService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountControllerImpl implements AccountController {

    AccountService accountService;

    @Override
    public ResponseEntity<List<AccountResponse>> getAccounts() {
        return ResponseEntity.ok(accountService.getAccounts());
    }

    @Override
    public ResponseEntity<AccountResponse> getAccountById(Integer id) {
        return ResponseEntity.ok(accountService.getAccountById(id));
    }

    @Override
    public ResponseEntity<AccountResponse> createAccount(AccountCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.createAccount(request));
    }

    @Override
    public ResponseEntity<AccountResponse> updateAccount(Integer id, AccountUpdateRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    @Override
    public ResponseEntity<Void> deleteAccount(Integer id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
