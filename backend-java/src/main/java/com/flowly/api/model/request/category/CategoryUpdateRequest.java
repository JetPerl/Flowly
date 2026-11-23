package com.flowly.api.model.request.category;

import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Запрос на изменение или скрытие категории либо персональных настроек пользователя")
public record CategoryUpdateRequest(
        @Schema(description = "Новое название категории", example = "Супермаркеты", nullable = true)
        @ValidStringField(type = StringFieldConstraintType.CATEGORY_NAME, nullable = true)
        String name,

        @Schema(description = "Новый ID родительской категории", example = "12", nullable = true)
        Long parentId,

        @Schema(description = "Новый идентификатор иконки", example = "food", nullable = true)
        String icon,

        @Schema(description = "Новый HEX-цвет", example = "#2ECC71", nullable = true)
        String color,

        @Schema(description = "Новый порядок сортировки", example = "5", nullable = true)
        Integer sortOrder,

        @Schema(description = "Скрыть или показать категорию", example = "false", nullable = true)
        Boolean isHidden
) {
}
