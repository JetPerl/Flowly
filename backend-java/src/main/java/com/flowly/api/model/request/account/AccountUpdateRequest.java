package com.flowly.api.model.request.account;

import com.flowly.api.model.enums.AccountType;
import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Запрос на частичное обновление счета пользователя")
public record AccountUpdateRequest(
        @Schema(description = "Новое название счета", example = "Основная карта", nullable = true)
        @ValidStringField(type = StringFieldConstraintType.ACCOUNT_NAME, nullable = true)
        String name,

        @Schema(description = "Новый баланс счета", example = "1500.00", nullable = true)
        BigDecimal balance,

        @Schema(description = "Код валюты (3 символа)", example = "BYN", nullable = true)
        @Size(min = 3, max = 3, message = "Код валюты должен состоять ровно из 3 символов")
        String currency,

        @Schema(description = "Тип счета", example = "CARD", nullable = true)
        AccountType type,

        @Schema(description = "HEX-цвет счета", example = "#2ECC71", nullable = true)
        String color,

        @Schema(description = "Идентификатор иконки счета", example = "card", nullable = true)
        String icon
) {
}
