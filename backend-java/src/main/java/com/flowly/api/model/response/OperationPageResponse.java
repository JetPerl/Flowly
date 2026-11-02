package com.flowly.api.model.response;

import java.util.List;

public record OperationPageResponse(
        List<OperationResponse> items,
        PageInfoResponse pageInfo
) {
}
