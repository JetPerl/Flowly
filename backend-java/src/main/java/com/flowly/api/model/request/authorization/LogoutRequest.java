package com.flowly.api.model.request.authorization;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "Refresh токен обязателен для заполнения")
        String refreshToken
) {
}
