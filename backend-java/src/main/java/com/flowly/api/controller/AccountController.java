package com.flowly.api.controller;

import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/v1/accounts")
@Tag(name = "Счета", description = "Методы для управления банковскими и наличными счетами пользователя")
public interface AccountController {

    @Operation(summary = "Получение списка счетов", description = "Возвращает все счета, принадлежащие текущему пользователю")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AccountsListSuccess")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<?> getAccounts(@AuthenticationPrincipal UserDetails userDetails);
}
