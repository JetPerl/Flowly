package com.flowly.api.controller.impl;

import com.flowly.api.controller.OperationController;
import com.flowly.api.model.request.operation.OperationCreateRequest;
import com.flowly.api.model.request.operation.OperationPatchRequest;
import com.flowly.api.model.response.operation.OperationPageResponse;
import com.flowly.api.model.response.operation.OperationResponse;
import com.flowly.api.service.OperationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationControllerImpl implements OperationController {

    OperationService operationService;

    @Override
    public ResponseEntity<OperationPageResponse> getOperations(
            Integer accountId,
            Integer limit,
            String cursor
    ) {
        OperationPageResponse response = operationService.getOperationsWithCursor(accountId, limit, cursor);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> getOperationById(Integer id) {
        OperationResponse response = operationService.getOperationById(id);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> patchOperation(Integer id, OperationPatchRequest request) {
        OperationResponse response = operationService.patchOperation(id, request);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> createOperation(OperationCreateRequest request) {
        OperationResponse response = operationService.createOperation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Override
    public ResponseEntity<Void> deleteOperation(Integer id) {
        operationService.deleteOperation(id);
        return ResponseEntity.noContent().build();
    }
}
