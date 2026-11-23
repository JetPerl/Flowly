package com.flowly.api.model.dto;

import com.flowly.api.model.enums.CategoryType;

import java.util.List;

public record CategoryDto(
        Long id,
        String name,
        CategoryType type,
        Long parentId,
        String icon,
        String color,
        Integer sortOrder,
        Boolean isSystem,
        Boolean isCustomized,
        Boolean isHidden,
        List<CategoryDto> children
) {
}
