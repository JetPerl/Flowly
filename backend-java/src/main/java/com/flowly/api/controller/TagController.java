package com.flowly.api.controller;

import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.dto.TagDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RequestMapping("/api/v1/tags")
@Tag(name = "Метки", description = "Методы для получения списка меток (тегов) операций")
public interface TagController {

    @Operation(summary = "Получение всех меток", description = "Возвращает полный список доступных меток для прикрепления к операциям")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Список успешно получен"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/Unauthorized")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<List<TagDto>> getTags();
}
