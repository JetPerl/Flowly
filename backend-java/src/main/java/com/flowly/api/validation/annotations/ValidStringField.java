package com.flowly.api.validation.annotations;

import com.flowly.api.validation.ValidStringFieldValidator;
import com.flowly.api.validation.constraints.StringFieldConstraintType;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ValidStringFieldValidator.class)
public @interface ValidStringField {

    String message() default "Некорректное значение поля";

    StringFieldConstraintType type();

    boolean nullable() default false;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
