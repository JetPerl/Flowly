package com.flowly.api.model.request;

import com.flowly.api.model.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AccountCreateRequest(
        @NotBlank(message = "Название счета обязательно для заполнения")
        @Size(max = 100, message = "Название счета не должно превышать 100 символов")
        String name,

        @NotNull(message = "Начальный баланс обязателен для заполнения")
        BigDecimal balance,

        @NotBlank(message = "Валюта счета обязательна для заполнения")
        @Size(min = 3, max = 3, message = "Код валюты должен состоять ровно из 3 символов")
        String currency,

        @NotNull(message = "Тип счета обязателен для выбора")
        AccountType type
) {
}
