package com.flowly.api.config;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ConflictException;
import com.flowly.api.exception.ForbiddenAccessException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.model.response.HttpErrorResponse;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> "Поле '" + err.getField() + "' " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<HttpErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return buildError(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage());
    }

    @ExceptionHandler({AccessDeniedException.class, ForbiddenAccessException.class})
    public ResponseEntity<HttpErrorResponse> handleAccessDenied(RuntimeException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "У вас нет прав для выполнения данного действия";
        return buildError(HttpStatus.FORBIDDEN, "Forbidden", msg);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<HttpErrorResponse> handleUnauthorized() {
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", "Отсутствует или некорректный токен авторизации");
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<HttpErrorResponse> handleConflict(ConflictException ex) {
        return buildError(HttpStatus.CONFLICT, "Conflict", ex.getMessage());
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<HttpErrorResponse> handleBusiness(BusinessValidationException ex) {
        return buildError(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable Entity", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<HttpErrorResponse> handleInternal(Exception ex) {
        log.error("Неизвестная ошибка сервера", ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Неизвестная ошибка сервера. Попробуйте снова");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<HttpErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        HttpErrorResponse error = new HttpErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<HttpErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(violation -> violation.getMessage())
                .findFirst()
                .orElse("Некорректные данные в запросе");

        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<HttpErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Некорректный формат JSON или недопустимое значение полей");
    }

    private ResponseEntity<HttpErrorResponse> buildError(HttpStatus status, String type, String message) {
        return ResponseEntity.status(status).body(new HttpErrorResponse(status.value(), type, message));
    }
}