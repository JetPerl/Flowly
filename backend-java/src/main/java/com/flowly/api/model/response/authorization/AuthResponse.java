package com.flowly.api.model.response.authorization;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String token,
        String refreshToken,
        String tokenType,
        Long expiresIn,
        Integer userId,
        String email
) {

    public AuthResponse(String token, String refreshToken, Long expiresIn, Integer userId, String email) {
        this(token, refreshToken, "Bearer", expiresIn, userId, email);
    }
}
