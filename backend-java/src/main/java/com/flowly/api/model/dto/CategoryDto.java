package com.flowly.api.model.dto;

import com.flowly.api.model.enums.CategoryType;

public record CategoryDto(
        Long id,
        String name,
        CategoryType type,
        String icon,
        String color
) {
}
