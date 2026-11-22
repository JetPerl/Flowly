package com.flowly.api.controller;

import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RequestMapping("/api/v1/categories")
@Tag(name = "Категории", description = "Методы для получения списка категорий расходов и доходов")
public interface CategoryController {

    @Operation(summary = "Получение списка категорий", description = "Возвращает категории с возможностью фильтрации по типу (EXPENSE / INCOME)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Список успешно получен"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/Unauthorized")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<List<CategoryDto>> getCategories(
            @Parameter(description = "Тип категории (EXPENSE или INCOME)", example = "EXPENSE")
            @RequestParam(required = false) CategoryType type
    );
}
