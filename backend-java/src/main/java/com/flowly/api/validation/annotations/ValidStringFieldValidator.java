package com.flowly.api.validation.annotations;

import com.flowly.api.validation.constraints.StringFieldConstraintType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidStringFieldValidator implements ConstraintValidator<ValidStringField, String> {

    private StringFieldConstraintType type;
    private boolean nullable;

    @Override
    public void initialize(ValidStringField annotation) {
        type = annotation.type();
        nullable = annotation.nullable();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return nullable || reject(context, "%s обязательно".formatted(type.getFieldName()));
        }
        if (value.startsWith(" ") || value.endsWith(" ")) {
            return reject(context, "%s не должно содержать пробелы в начале и конце".formatted(type.getFieldName()));
        }
        if (value.isEmpty()) {
            return reject(context, "%s - передано пустой строкой".formatted(type.getFieldName()));
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return reject(context, "%s обязательно".formatted(type.getFieldName()));
        }
        if (trimmed.contains("  ")) {
            return reject(context, "%s не должно содержать несколько пробелов подряд".formatted(type.getFieldName()));
        }
        if (trimmed.length() < type.getMinLength() || trimmed.length() > type.getMaxLength()) {
            return reject(context, "%s должно быть от %d до %d символов".formatted(
                    type.getFieldName(), type.getMinLength(), type.getMaxLength()));
        }
        return type.getPattern().getPattern().matcher(trimmed).matches()
                || reject(context, "%s не соответствует формату".formatted(type.getFieldName()));
    }

    private boolean reject(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}
