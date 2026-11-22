package com.flowly.api.controller;

import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.request.OperationCreateRequest;
import com.flowly.api.model.request.OperationPatchRequest;
import com.flowly.api.model.response.OperationPageResponse;
import com.flowly.api.model.response.OperationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping("/api/v1/operations")
@Tag(name = "Операции", description = "Методы для управления и получения истории финансовых операций с курсорной пагинацией")
public interface OperationController {

    @Operation(summary = "Получение списка операций с курсорной пагинацией", description = "Возвращает порцию операций текущего пользователя с поддержкой фильтрации по счету и курсора")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/OperationsPageSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<OperationPageResponse> getOperations(
            @Parameter(description = "ID счета для фильтрации", example = "23")
            @RequestParam(required = false) @Min(value = 1, message = "ID должен быть не менее 1") Integer accountId,
            @Parameter(description = "Количество возвращаемых элементов (по умолчанию 20)", example = "20")
            @RequestParam(required = false) @Min(value = 1, message = "Количество элементов (limit) должно быть не менее 1") Integer limit,
            @Parameter(description = "Курсор для получения следующей страницы", example = "ZXlKcGJhdDI...")
            @RequestParam(required = false) String cursor
    );

    @Operation(summary = "Получение операции по ID", description = "Возвращает детальную информацию по конкретной финансовой операции текущего пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/OperationDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @GetMapping("/{id}")
    ResponseEntity<OperationResponse> getOperationById(
            @Parameter(description = "ID операции", example = "371")
            @PathVariable @Min(value = 1, message = "ID операции должен быть не менее 1") Integer id
    );

    @Operation(summary = "Частичное обновление операции", description = "Позволяет изменить отдельные поля финансовой операции (категорию, сумму, счет, дату, заметку и т.д.)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/OperationDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PatchMapping("/{id}")
    ResponseEntity<OperationResponse> patchOperation(
            @Parameter(description = "ID операции", example = "371")
            @PathVariable @Min(value = 1, message = "ID операции должен быть не менее 1") Integer id,
            @Valid @RequestBody OperationPatchRequest request
    );

    @Operation(summary = "Создание новой операции", description = "Создает новую финансовую операцию (доход, расход или перевод)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", ref = "#/components/responses/OperationDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @PostMapping
    ResponseEntity<OperationResponse> createOperation(
            @Valid @RequestBody OperationCreateRequest request
    );

    @Operation(summary = "Удаление операции", description = "Удаляет финансовую операцию по ID и возвращает баланс счета")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Операция успешно удалена"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteOperation(
            @PathVariable @Min(value = 1, message = "ID операции должен быть не менее 1") Integer id
    );
}
