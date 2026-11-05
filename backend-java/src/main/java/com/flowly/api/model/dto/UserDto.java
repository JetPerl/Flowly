package com.flowly.api.model.dto;

import java.time.OffsetDateTime;

public record UserDto(
        Long id,
        String login,
        String baseCurrency,
        OffsetDateTime createdAt
) {
}
