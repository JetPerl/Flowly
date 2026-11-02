package com.flowly.api.model.request;

import com.flowly.api.model.enums.OperationType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "Запрос на частичное обновление финансовой операции")
public record OperationPatchRequest(
        @Schema(description = "ID новой категории", example = "15")
        Integer categoryId,

        @Schema(description = "ID нового счета", example = "23")
        Integer accountId,

        @Schema(description = "Сумма операции", example = "150.50")
        @DecimalMin(value = "0.0001", message = "Сумма должна быть больше нуля")
        BigDecimal amount,

        @Schema(description = "Тип операции (expense/income)", example = "EXPENSE")
        OperationType type,

        @Schema(description = "Дата и время операции", example = "2026-03-02T12:00:00")
        LocalDateTime dateTime,

        @Schema(description = "Заметка / комментарий", example = "Обед в ресторане")
        String note,

        @Schema(description = "Получатель", example = "Supermarket")
        String recipient,

        @Schema(description = "Место", example = "Minsk")
        String place,

        @Schema(description = "Закреплена ли операция", example = "true")
        Boolean isPinned
) {
}
