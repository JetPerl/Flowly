package com.flowly.api.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum CategoryType {
    INCOME,
    EXPENSE;

    @JsonCreator
    public static CategoryType fromValue(String value) {
        if (value == null) {
            return EXPENSE;
        }
        return CategoryType.valueOf(value.trim().toUpperCase());
    }
}
