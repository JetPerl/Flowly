package com.flowly.api.model.response;

import java.time.LocalDateTime;

public record ApiResponse(
        boolean success,
        String message,
        LocalDateTime timestamp
) {
    public static ApiResponse ok(String message) {
        return new ApiResponse(true, message, LocalDateTime.now());
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message, LocalDateTime.now());
    }
}
