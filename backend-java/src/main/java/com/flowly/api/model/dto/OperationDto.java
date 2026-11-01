package com.flowly.api.model.dto;

import com.flowly.api.model.enums.OperationType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperationDto(
        Long id,
        Long accountId,
        String accountName,
        Long categoryId,
        String categoryName,
        BigDecimal amount,
        OperationType type,
        LocalDateTime date,
        String comment
) {
}
