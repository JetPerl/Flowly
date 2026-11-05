package com.flowly.api.model.response;

import java.time.OffsetDateTime;

public record ApiResponse(
        boolean success,
        String message,
        OffsetDateTime timestamp
) {
    public static ApiResponse ok(String message) {
        return new ApiResponse(true, message, OffsetDateTime.now());
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message, OffsetDateTime.now());
    }
}
