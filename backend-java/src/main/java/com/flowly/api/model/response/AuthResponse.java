package com.flowly.api.model.response;

public record AuthResponse(
        String token,
        String tokenType,
        Integer userId,
        String email
) {
    public AuthResponse(String token, Integer userId, String email) {
        this(token, "Bearer", userId, email);
    }
}
