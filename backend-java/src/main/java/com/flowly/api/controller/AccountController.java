package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.request.account.AccountCreateRequest;
import com.flowly.api.model.request.account.AccountUpdateRequest;
import com.flowly.api.model.response.account.AccountResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RequestMapping(ApiPaths.ACCOUNTS)
@Tag(name = "Счета", description = "Методы для управления банковскими и наличными счетами пользователя")
public interface AccountController {

    @Operation(summary = "Получение списка счетов", description = "Возвращает все счета, принадлежащие текущему пользователю")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AccountsListSuccess")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<List<AccountResponse>> getAccounts();

    @Operation(summary = "Получение счета по ID", description = "Возвращает информацию о счете текущего пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AccountDetailsSuccess"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @GetMapping("/{id}")
    ResponseEntity<AccountResponse> getAccountById(
            @PathVariable @Min(value = 1, message = "ID счета должен быть не менее 1") Integer id
    );

    @Operation(summary = "Создание счета", description = "Создает новый счет текущего пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", ref = "#/components/responses/AccountDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest")
    })
    @BaseErrorResponses
    @PostMapping
    ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody AccountCreateRequest request);

    @Operation(summary = "Изменение счета", description = "Частично обновляет данные счета текущего пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/AccountDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @PatchMapping("/{id}")
    ResponseEntity<AccountResponse> updateAccount(
            @PathVariable @Min(value = 1, message = "ID счета должен быть не менее 1") Integer id,
            @Valid @RequestBody AccountUpdateRequest request
    );

    @Operation(summary = "Удаление счета", description = "Удаляет счет текущего пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Счет удален"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteAccount(
            @PathVariable @Min(value = 1, message = "ID счета должен быть не менее 1") Integer id
    );
}
