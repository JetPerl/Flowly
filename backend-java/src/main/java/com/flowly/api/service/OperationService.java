package com.flowly.api.service;

import com.flowly.api.model.request.operation.OperationCreateRequest;
import com.flowly.api.model.request.operation.OperationPatchRequest;
import com.flowly.api.model.response.operation.OperationPageResponse;
import com.flowly.api.model.response.operation.OperationResponse;

public interface OperationService {

    OperationPageResponse getOperationsWithCursor(Integer accountId, Integer limit, String cursor);

    OperationResponse getOperationById(Integer operationId);

    OperationResponse patchOperation(Integer operationId, OperationPatchRequest request);

    OperationResponse createOperation(OperationCreateRequest request);

    void deleteOperation(Integer operationId);
}
