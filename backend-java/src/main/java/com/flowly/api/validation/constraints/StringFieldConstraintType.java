package com.flowly.api.validation.constraints;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum StringFieldConstraintType {
    ACCOUNT_NAME("Наименование счета", 2, 50, PatternType.ENTITY_NAME),
    CATEGORY_NAME("Наименование категории", 2, 50, PatternType.ENTITY_NAME),
    COMMENT("Комментарий", 1, 255, PatternType.COMMENT),
    PASSWORD("Пароль", 8, 72, PatternType.PASSWORD);

    private final String fieldName;
    private final int minLength;
    private final int maxLength;
    private final PatternType pattern;
}
