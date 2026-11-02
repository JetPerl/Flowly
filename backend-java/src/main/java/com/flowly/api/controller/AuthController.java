package com.flowly.api.controller;

import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.request.LoginRequest;
import com.flowly.api.model.request.RegisterRequest;
import com.flowly.api.model.response.AuthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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

@RequestMapping("/api/v1/auth")
@Tag(name = "Аутентификация", description = "Методы для регистрации новых пользователей и получения JWT-токенов доступа")
public interface AuthController {

    @Operation(summary = "Регистрация нового пользователя", description = "Создает учетную запись и возвращает JWT-токен доступа")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Пользователь успешно зарегистрирован",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "409", description = "Конфликт: пользователь с таким email уже существует")
    })
    @BaseErrorResponses
    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request);

    @Operation(summary = "Авторизация пользователя", description = "Проверяет email и пароль и возвращает действующий JWT-токен")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Успешная авторизация",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest")
    })
    @BaseErrorResponses
    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request);
}
