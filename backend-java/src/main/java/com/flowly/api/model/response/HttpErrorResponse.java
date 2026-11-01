package com.flowly.api.model.response;

import java.time.LocalDateTime;

/**
 * Единый формат ответа при возникновении ошибок API.
 *
 * @param statusCode числовой HTTP-код состояния (400, 401, 404, 500)
 * @param error      краткое наименование ошибки (Bad Request, Unauthorized и т.д.)
 * @param message    подробное описание ошибки на русском языке
 * @param timestamp  время возникновения ошибки
 */

public record HttpErrorResponse(
        int statusCode,
        String error,
        String message,
        LocalDateTime timestamp
) {
    public HttpErrorResponse(int statusCode, String error, String message) {
        this(statusCode, error, message, LocalDateTime.now());
    }
}
