package com.flowly.api.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum OperationType {
    INCOME,
    EXPENSE,
    TRANSFER;

    @JsonCreator
    public static OperationType fromValue(String value) {
        if (value == null) {
            return EXPENSE;
        }
        return OperationType.valueOf(value.trim().toUpperCase());
    }
}
