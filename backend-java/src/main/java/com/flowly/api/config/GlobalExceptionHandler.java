package com.flowly.api.config;

import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.model.response.HttpErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Глобальный перехватчик исключений REST-контроллеров Flowly.
 * Приводит все ошибки валидации, аутентификации и бизнес-логики к стандартизированному ответу HttpErrorResponse.
 */

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<HttpErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();

        String message = bindingResult.getFieldErrors().stream()
                .map(err -> formatFieldError(err, bindingResult))
                .collect(Collectors.joining("; "));

        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<HttpErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String paramName = ex.getName();
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request",
                String.format("Параметр '%s' имеет некорректный формат или тип", paramName));
    }

    @ExceptionHandler({ResourceNotFoundException.class, EntityNotFoundException.class})
    public ResponseEntity<HttpErrorResponse> handleEntityNotFound(RuntimeException ex) {
        return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<HttpErrorResponse> handleControllerValidation(HandlerMethodValidationException ex) {
        String message = ex.getAllValidationResults().stream()
                .flatMap(r -> r.getResolvableErrors().stream())
                .map(MessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<HttpErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<HttpErrorResponse> handleHttpMessageNotReadable() {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Некорректный формат JSON-тела запроса");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<HttpErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        return buildError(HttpStatus.FORBIDDEN, "Forbidden", "Недостаточно прав для выполнения операции");
    }

    @ExceptionHandler({AuthenticationException.class, BadCredentialsException.class})
    public ResponseEntity<HttpErrorResponse> handleUnauthorized(Exception ex) {
        String detailMessage = (ex instanceof BadCredentialsException)
                ? ex.getMessage()
                : "Отсутствует или некорректный токен авторизации";
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", detailMessage);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<HttpErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<HttpErrorResponse> handleInternal(Exception ex) {
        log.error("Непредвиденная внутренняя ошибка сервера", ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Внутренняя ошибка сервера. Повторите попытку позже");
    }

    private String formatFieldError(FieldError err, BindingResult bindingResult) {
        String fieldName = err.getField();

        if (err.isBindingFailure() || "typeMismatch".equals(err.getCode())) {
            Object rejectedValue = err.getRejectedValue();
            Class<?> targetType = bindingResult.getFieldType(fieldName);

            if (targetType != null && targetType.isEnum()) {
                String allowedValues = Arrays.toString(targetType.getEnumConstants());
                return String.format("Поле '%s': значение '%s' недопустимо. Возможные варианты: %s",
                        fieldName, rejectedValue, allowedValues);
            }

            if (Boolean.class.equals(targetType) || boolean.class.equals(targetType)) {
                return String.format("Поле '%s': ожидается логический тип (true/false), получено: '%s'",
                        fieldName, rejectedValue);
            }

            return String.format("Поле '%s': некорректное значение '%s'", fieldName, rejectedValue);
        }

        return err.getDefaultMessage();
    }

    private ResponseEntity<HttpErrorResponse> buildError(HttpStatus status, String type, String message) {
        return ResponseEntity.status(status)
                .body(new HttpErrorResponse(status.value(), type, message));
    }
}