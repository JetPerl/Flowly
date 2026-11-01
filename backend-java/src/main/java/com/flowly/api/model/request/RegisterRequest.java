package com.flowly.api.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Электронная почта обязательна для заполнения")
        @Email(message = "Некорректный формат адреса электронной почты")
        String email,

        @NotBlank(message = "Пароль обязателен для заполнения")
        @Size(min = 6, message = "Пароль должен содержать не менее 6 символов")
        String password,

        @Size(min = 3, max = 3, message = "Базовая валюта должна состоять ровно из 3 символов (например, USD, EUR, RUB)")
        String baseCurrency
) {
}
