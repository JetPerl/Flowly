package com.flowly.api.model.dto;

import com.flowly.api.model.enums.AccountType;

import java.math.BigDecimal;

public record AccountDto(
        Long id,
        String name,
        BigDecimal balance,
        String currency,
        AccountType type
) {
}
