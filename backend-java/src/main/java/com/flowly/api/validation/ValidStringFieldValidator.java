package com.flowly.api.validation;

import com.flowly.api.validation.annotations.ValidStringField;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidStringFieldValidator implements ConstraintValidator<ValidStringField, String> {

    private StringFieldConstraintType type;
    private boolean nullable;

    @Override
    public void initialize(ValidStringField annotation) {
        this.type = annotation.type();
        this.nullable = annotation.nullable();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return nullable || reject(context, "%s обязательно".formatted(type.getFieldName()));
        }
        if (value.isEmpty()) {
            return reject(context, "%s передано пустой строкой".formatted(type.getFieldName()));
        }

        if (type == StringFieldConstraintType.PASSWORD) {
            if (value.chars().anyMatch(Character::isWhitespace)) {
                return reject(context, "%s не должно содержать пробелы".formatted(type.getFieldName()));
            }
            return validateLength(value, context) && validatePattern(value, context);
        }

        if (value.startsWith(" ") || value.endsWith(" ")) {
            return reject(context, "%s не должно содержать пробелы в начале и конце".formatted(type.getFieldName()));
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return reject(context, "%s обязательно".formatted(type.getFieldName()));
        }
        if (trimmed.contains("  ")) {
            return reject(context, "%s не должно содержать несколько пробелов подряд".formatted(type.getFieldName()));
        }

        return validateLength(trimmed, context) && validatePattern(trimmed, context);
    }

    private boolean validateLength(String candidate, ConstraintValidatorContext context) {
        if (candidate.length() < type.getMinLength() || candidate.length() > type.getMaxLength()) {
            return reject(
                    context,
                    "%s должно быть от %d до %d символов".formatted(
                            type.getFieldName(), type.getMinLength(), type.getMaxLength()
                    )
            );
        }
        return true;
    }

    private boolean validatePattern(String candidate, ConstraintValidatorContext context) {
        if (type.getPattern() != null && !type.getPattern().getPattern().matcher(candidate).matches()) {
            return reject(context, "%s не соответствует формату".formatted(type.getFieldName()));
        }
        return true;
    }

    private boolean reject(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}
