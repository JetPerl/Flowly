package com.flowly.api.model.response.operation;

public record PageInfoResponse(
        int displayed,
        boolean hasNext,
        String nextCursor
) {
}
