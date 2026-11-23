package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(ApiPaths.ADMIN_USERS)
@Tag(name = "Администрирование пользователей", description = "Операции управления пользователями для администраторов")
public interface AdminUserController {

    @Operation(summary = "Удаление пользователя", description = "Удаляет пользователя из базы данных и Keycloak по его ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Пользователь успешно удален"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteUser(@PathVariable Integer id);
}
