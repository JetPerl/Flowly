package com.flowly.api.controller.impl;

import com.flowly.api.model.entity.User;
import com.flowly.api.model.response.AccountResponse;
import com.flowly.api.repository.AccountRepository;
import com.flowly.api.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AccountController {

    AccountRepository accountRepository;
    UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getAccounts(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : "ilyaburnos@gmail.com";
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.ok(List.of());
        }

        List<AccountResponse> accounts = accountRepository.findByUserId(user.getId())
                .stream()
                .map(acc -> new AccountResponse(
                        acc.getId(),
                        acc.getName(),
                        acc.getCurrency(),
                        acc.getBalance(),
                        acc.getType(),
                        acc.getColor(),
                        acc.getIcon()
                ))
                .toList();

        return ResponseEntity.ok(accounts);
    }
}
