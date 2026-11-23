package com.flowly.api.model.request.tag;

import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Запрос на изменение или скрытие метки")
public record TagUpdateRequest(
        @Schema(description = "Новое название метки", example = "Командировка", nullable = true)
        @ValidStringField(type = StringFieldConstraintType.TAG_NAME, nullable = true)
        String name,

        @Schema(description = "Новый HEX-цвет метки", example = "#0984E3", nullable = true)
        String color,

        @Schema(description = "Новый идентификатор иконки метки", example = "briefcase", nullable = true)
        String icon,

        @Schema(description = "Новый порядок сортировки", example = "3", nullable = true)
        Integer sortOrder,

        @Schema(description = "Скрыть или показать метку", example = "false", nullable = true)
        Boolean isHidden
) {
}
