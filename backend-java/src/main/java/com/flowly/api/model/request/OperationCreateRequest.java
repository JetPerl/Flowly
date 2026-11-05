package com.flowly.api.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.flowly.api.model.enums.OperationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OperationCreateRequest(
        @NotNull(message = "Тип операции обязателен")
        OperationType type,

        @NotNull(message = "Сумма операции обязательна")
        @DecimalMin(value = "0.01", message = "Сумма операции должна быть больше 0")
        BigDecimal amount,

        @NotNull(message = "Валюта обязательна")
        String currency,

        @NotNull(message = "Идентификатор счета обязателен")
        Long accountId,

        Long categoryId,         // null для переводов
        Long relatedAccountId,   // ID целевого счета (если перевод)
        BigDecimal targetAmount, // Сумма зачисления на целевой счет (в его валюте)

        @NotNull(message = "Дата и время операции обязательны")
        OffsetDateTime dateTime,

        String merchant,
        String place,
        String recipient,

        @Size(max = 255, message = "Примечание не должно превышать 255 символов")
        String note,

        String photoUrl,
        Boolean isPinned,
        List<Long> tagIds
) {
}
