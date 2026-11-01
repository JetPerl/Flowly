package com.flowly.api.model.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
        Boolean isPinned,
        LocalDateTime dateTime
) {
}
