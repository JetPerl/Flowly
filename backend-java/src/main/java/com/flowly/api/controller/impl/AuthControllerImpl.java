package com.flowly.api.controller.impl;

import com.flowly.api.controller.AuthController;
import com.flowly.api.model.request.LoginRequest;
import com.flowly.api.model.request.RegisterRequest;
import com.flowly.api.model.response.AuthResponse;
import com.flowly.api.service.AuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Реализация REST-контроллера аутентификации.
 */


@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthControllerImpl implements AuthController {

    AuthService authService;

    @Override
    public ResponseEntity<AuthResponse> register(RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Override
    public ResponseEntity<AuthResponse> login(LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
