package com.flowly.api.model.request.authorization;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Электронная почта обязательна для заполнения")
        @Email(message = "Некорректный формат адреса электронной почты")
        String email,

        @NotBlank(message = "Пароль обязателен для заполнения")
        String password
) {
}
