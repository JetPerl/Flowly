package com.flowly.api.model.dto;

import com.flowly.api.model.enums.CategoryType;

public record EffectiveCategory(
        Integer id,
        String name,
        CategoryType type,
        Integer parentId,
        String icon,
        String color,
        Integer sortOrder,
        Boolean isSystem,
        Boolean isCustomized,
        Boolean isHidden
) {
}
