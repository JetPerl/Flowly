package com.flowly.api.controller.impl;

import com.flowly.api.controller.OperationController;
import com.flowly.api.model.request.OperationCreateRequest;
import com.flowly.api.model.request.OperationPatchRequest;
import com.flowly.api.model.response.OperationPageResponse;
import com.flowly.api.model.response.OperationResponse;
import com.flowly.api.service.OperationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
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
            String cursor,
            UserDetails userDetails
    ) {
        String email = userDetails.getUsername();
        OperationPageResponse response = operationService.getOperationsWithCursor(email, accountId, limit, cursor);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> getOperationById(Integer id, UserDetails userDetails) {
        String email = userDetails.getUsername();
        OperationResponse response = operationService.getOperationById(email, id);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> patchOperation(Integer id, OperationPatchRequest request, UserDetails userDetails) {
        String email = userDetails.getUsername();
        OperationResponse response = operationService.patchOperation(email, id, request);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<OperationResponse> createOperation(OperationCreateRequest request, UserDetails userDetails) {
        String email = userDetails.getUsername();
        OperationResponse response = operationService.createOperation(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Override
    public ResponseEntity<Void> deleteOperation(Integer id, UserDetails userDetails) {
        String email = userDetails.getUsername();
        operationService.deleteOperation(email, id);
        return ResponseEntity.noContent().build();
    }
}
