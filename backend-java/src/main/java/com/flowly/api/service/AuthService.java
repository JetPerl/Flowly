package com.flowly.api.service;

import com.flowly.api.model.request.LoginRequest;
import com.flowly.api.model.request.LogoutRequest;
import com.flowly.api.model.request.RefreshTokenRequest;
import com.flowly.api.model.request.RegisterRequest;
import com.flowly.api.model.response.AuthResponse;

/**
 * Контракт сервиса регистрации и аутентификации пользователей.
 */

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);
}
