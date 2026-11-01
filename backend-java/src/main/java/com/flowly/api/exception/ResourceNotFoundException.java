package com.flowly.api.exception;

/**
 * Исключение, выбрасываемое при отсутствии запрашиваемой сущности в базе данных.
 */

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
