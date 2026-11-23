package com.flowly.api.service;

import com.flowly.api.model.request.authorization.LoginRequest;
import com.flowly.api.model.request.authorization.LogoutRequest;
import com.flowly.api.model.request.authorization.RefreshTokenRequest;
import com.flowly.api.model.request.authorization.RegisterRequest;
import com.flowly.api.model.response.authorization.AuthResponse;

/**
 * Контракт сервиса регистрации и аутентификации пользователей.
 */

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(LogoutRequest request);
}
