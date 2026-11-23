package com.flowly.api.model.request.authorization;

import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Электронная почта обязательна для заполнения")
        @Email(message = "Некорректный формат адреса электронной почты")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Пароль обязателен для заполнения")
        @ValidStringField(type = StringFieldConstraintType.PASSWORD)
        String password
) {
}
