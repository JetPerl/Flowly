package com.flowly.api.model.response;

public record PageInfoResponse(
        int displayed,
        boolean hasNext,
        String nextCursor
) {
}
