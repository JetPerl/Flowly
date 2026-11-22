package com.flowly.api.model.response;

/**
 * Единый формат ответа при возникновении ошибок API.
 *
 * @param status числовой HTTP-код состояния (400, 401, 404, 500)
 * @param type      краткое наименование ошибки (Bad Request, Unauthorized и т.д.)
 * @param message    подробное описание ошибки на русском языке
 */

public record HttpErrorResponse(
        int status,
        String type,
        String message
) {
}
