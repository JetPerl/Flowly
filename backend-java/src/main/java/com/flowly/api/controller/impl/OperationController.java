package com.flowly.api.controller.impl;

import com.flowly.api.model.response.HistorySectionResponse;
import com.flowly.api.service.OperationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OperationController {

    OperationService operationService;

    @GetMapping("/sections")
    public ResponseEntity<List<HistorySectionResponse>> getSections(
            @RequestParam(required = false) Integer accountId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : "ilyaburnos@gmail.com";
        List<HistorySectionResponse> sections = operationService.getOperationSections(email, accountId);
        return ResponseEntity.ok(sections);
    }
}
