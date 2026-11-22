package com.flowly.api.controller.impl;

import com.flowly.api.controller.AccountController;
import com.flowly.api.model.response.AccountResponse;
import com.flowly.api.service.AccountService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountControllerImpl implements AccountController {

    AccountService accountService;

    @Override
    public ResponseEntity<List<AccountResponse>> getAccounts() {
        List<AccountResponse> accounts = accountService.getAccounts();
        return ResponseEntity.ok(accounts);
    }
}
