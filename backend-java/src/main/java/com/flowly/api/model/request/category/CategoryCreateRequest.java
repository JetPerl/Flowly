package com.flowly.api.model.request.category;

import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Запрос на создание пользовательской категории или подкатегории")
public record CategoryCreateRequest(
        @Schema(description = "Название категории", example = "Кофе с собой")
        @ValidStringField(type = StringFieldConstraintType.CATEGORY_NAME)
        String name,

        @Schema(description = "Тип категории (EXPENSE или INCOME)", example = "EXPENSE")
        @NotNull(message = "Тип категории обязателен для выбора")
        CategoryType type,

        @Schema(description = "ID родительской категории (опционально, глубина до 5 уровней)", example = "14", nullable = true)
        Long parentId,

        @Schema(description = "Идентификатор иконки", example = "coffee", nullable = true)
        @ValidStringField(type = StringFieldConstraintType.COMMENT, nullable = true)
        String icon,

        @Schema(description = "HEX-цвет категории", example = "#8B5A2B", nullable = true)
        String color,

        @Schema(description = "Порядок сортировки", example = "10", nullable = true)
        Integer sortOrder
) {
}