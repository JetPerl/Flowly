package com.flowly.api.model.request;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "Refresh токен обязателен для заполнения")
        String refreshToken
) {
}
