package com.flowly.api.model.request.account;

import com.flowly.api.model.enums.AccountType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Запрос на создание счета пользователя")
public record AccountCreateRequest(
        @Schema(description = "Название счета", example = "Основная карта")
        @NotBlank(message = "Название счета обязательно для заполнения")
        @Size(max = 100, message = "Название счета не должно превышать 100 символов")
        String name,

        @Schema(description = "Баланс счета", example = "1500.00")
        @NotNull(message = "Начальный баланс обязателен для заполнения")
        @DecimalMin(value = "0.0", inclusive = true, message = "Начальный баланс не может быть отрицательным")
        BigDecimal balance,

        @Schema(description = "Код валюты (3 символа)", example = "BYN")
        @NotBlank(message = "Валюта счета обязательна для заполнения")
        @Size(min = 3, max = 3, message = "Код валюты должен состоять ровно из 3 символов")
        String currency,

        @Schema(description = "Тип счета", example = "CARD")
        @NotNull(message = "Тип счета обязателен для выбора")
        AccountType type,

        @Schema(description = "HEX-цвет счета", example = "#2ECC71")
        @NotBlank(message = "Цвет счета обязателен")
        @Size(max = 50, message = "Цвет счета не должен превышать 50 символов")
        String color,

        @Schema(description = "Идентификатор иконки счета", example = "card")
        @NotBlank(message = "Иконка счета обязательна")
        @Size(max = 100, message = "Иконка счета не должна превышать 100 символов")
        String icon
) {
}
