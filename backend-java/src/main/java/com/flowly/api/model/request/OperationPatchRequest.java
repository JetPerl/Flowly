package com.flowly.api.model.request;

import com.flowly.api.model.enums.OperationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Schema(description = "Запрос на частичное обновление финансовой операции")
public record OperationPatchRequest(
        OperationType type,

        @DecimalMin(value = "0.0001", message = "Сумма должна быть больше нуля")
        BigDecimal amount,

        String currency,
        Long accountId,
        Long categoryId,
        Long relatedAccountId,
        OffsetDateTime dateTime,

        String merchant,
        String place,
        String recipient,
        String note,
        String photoUrl,
        Boolean isPinned,
        List<Long> tagIds
) {
}
