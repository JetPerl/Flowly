package com.flowly.api.model.response.operation;

import com.flowly.api.model.dto.TagDto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record OperationResponse(
        Integer id,
        String type,
        BigDecimal amount,
        String currency,
        String category,
        String categoryIcon,
        String categoryColor,
        Integer categoryId,
        String account,
        Integer accountId,
        String accountIcon,
        String accountColor,
        Integer relatedAccountId,
        Integer transferId,
        String note,
        String recipient,
        String place,
        List<TagDto> tags,
        String merchant,
        String photoUrl,
        Boolean isPinned,
        OffsetDateTime dateTime
) {
}
