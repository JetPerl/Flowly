package com.flowly.api.model.response;

import java.math.BigDecimal;

public record AccountResponse(
        Integer id,
        String name,
        String currency,
        BigDecimal balance,
        com.flowly.api.model.enums.AccountType type,
        String color,
        String icon
) {
}
