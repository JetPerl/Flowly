package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.request.authorization.LoginRequest;
import com.flowly.api.model.request.authorization.LogoutRequest;
import com.flowly.api.model.request.authorization.RefreshTokenRequest;
import com.flowly.api.model.request.authorization.RegisterRequest;
import com.flowly.api.model.response.authorization.AuthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * REST-контракт для открытых операций регистрации и авторизации пользователей.
 */

@RequestMapping(ApiPaths.AUTH)
@Tag(name = "Аутентификация", description = "Методы для регистрации новых пользователей и управления JWT-токенами")
public interface AuthController {

    @Operation(summary = "Регистрация нового пользователя", description = "Создает учетную запись в Keycloak и БД и возвращает пару токенов")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", ref = "#/components/responses/AuthSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "409", ref = "#/components/responses/Conflict")
    })
    @BaseErrorResponses
    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request);

    @Operation(summary = "Авторизация пользователя", description = "Проверяет email и пароль в Keycloak и возвращает access и refresh токены")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AuthSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/InvalidCredentials")
    })
    @BaseErrorResponses
    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request);

    @Operation(summary = "Обновление access-токена", description = "Принимает действующий refresh-токен и возвращает обновленные токены")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AuthSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/InvalidCredentials")
    })
    @BaseErrorResponses
    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request);

    @Operation(summary = "Выход из системы", description = "Отзывает refresh-токен и завершает сессию пользователя в Keycloak")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Сессия успешно завершена"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/InvalidCredentials")
    })
    @BaseErrorResponses
    @PostMapping("/logout")
    ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request);
}
