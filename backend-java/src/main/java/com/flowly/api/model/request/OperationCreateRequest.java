package com.flowly.api.model.request;

import com.flowly.api.model.enums.OperationType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperationCreateRequest(
        @NotNull(message = "Идентификатор счета обязателен")
        Long accountId,

        Long categoryId,

        @NotNull(message = "Сумма операции обязательна для заполнения")
        @DecimalMin(value = "0.01", message = "Сумма операции должна быть больше 0")
        BigDecimal amount,

        @NotNull(message = "Тип операции обязателен для выбора")
        OperationType type,

        @NotNull(message = "Дата и время операции обязательны")
        LocalDateTime date,

        @Size(max = 255, message = "Комментарий не должен превышать 255 символов")
        String comment
) {
}
