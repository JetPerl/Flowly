package com.flowly.api.model.request.tag;

import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Запрос на создание пользовательской метки")
public record TagCreateRequest(
        @Schema(description = "Название метки", example = "Отпуск")
        @ValidStringField(type = StringFieldConstraintType.TAG_NAME)
        String name,

        @Schema(description = "HEX-цвет метки", example = "#00B894", nullable = true)
        String color,

        @Schema(description = "Идентификатор иконки метки", example = "plane", nullable = true)
        String icon,

        @Schema(description = "Порядок сортировки", example = "11", nullable = true)
        Integer sortOrder
) {
}
