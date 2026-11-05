package com.flowly.api.service;

import com.flowly.api.model.request.OperationCreateRequest;
import com.flowly.api.model.request.OperationPatchRequest;
import com.flowly.api.model.response.OperationPageResponse;
import com.flowly.api.model.response.OperationResponse;

public interface OperationService {

    OperationPageResponse getOperationsWithCursor(String userEmail, Integer accountId, Integer limit, String cursor);

    OperationResponse getOperationById(String userEmail, Integer operationId);

    OperationResponse patchOperation(String userEmail, Integer operationId, OperationPatchRequest request);

    OperationResponse createOperation(String userEmail, OperationCreateRequest request);

    void deleteOperation(String userEmail, Integer operationId);
}
