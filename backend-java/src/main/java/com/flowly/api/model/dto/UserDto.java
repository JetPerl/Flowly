package com.flowly.api.model.dto;

import java.time.LocalDateTime;

public record UserDto(
        Long id,
        String email,
        String baseCurrency,
        LocalDateTime createdAt
) {
}
