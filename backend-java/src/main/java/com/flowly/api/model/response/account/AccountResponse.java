package com.flowly.api.model.response.account;

import com.flowly.api.model.enums.AccountType;

import java.math.BigDecimal;

public record AccountResponse(
        Integer id,
        String name,
        String currency,
        BigDecimal balance,
        AccountType type,
        String color,
        String icon
) {
}
