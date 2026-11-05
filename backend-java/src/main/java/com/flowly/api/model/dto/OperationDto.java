package com.flowly.api.model.dto;

import com.flowly.api.model.enums.OperationType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OperationDto(
        Long id,
        Long accountId,
        String accountName,
        Long categoryId,
        String categoryName,
        BigDecimal amount,
        String currency,
        OperationType type,
        OffsetDateTime dateTime,
        String merchant,
        String place,
        String recipient,
        String note,
        String photoUrl,
        Boolean isPinned,
        Long relatedAccountId,
        List<TagDto> tags
) {
}
