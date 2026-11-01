package com.flowly.api.model.request;

import com.flowly.api.model.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(
        @NotBlank(message = "Название категории обязательно для заполнения")
        @Size(max = 50, message = "Название категории не должно превышать 50 символов")
        String name,

        @NotNull(message = "Тип категории обязателен для выбора")
        CategoryType type,

        String icon,

        String color
) {
}
