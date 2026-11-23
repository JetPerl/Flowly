package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.dto.CategoryDto;
import com.flowly.api.model.enums.CategoryType;
import com.flowly.api.model.request.category.CategoryCreateRequest;
import com.flowly.api.model.request.category.CategoryUpdateRequest;
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

import java.util.List;

@RequestMapping(ApiPaths.CATEGORIES)
@Tag(name = "Категории", description = "Методы для управления категориями расходов и доходов")
public interface CategoryController {

    @Operation(summary = "Получение списка категорий", description = "Возвращает категории пользователя (стандартные с персональными настройками и пользовательские)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/CategoriesListSuccess"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/Unauthorized")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<List<CategoryDto>> getCategories(
            @Parameter(description = "Тип категории (EXPENSE или INCOME)", example = "EXPENSE")
            @RequestParam(required = false) CategoryType type,
            @Parameter(description = "Включать скрытые категории", example = "false")
            @RequestParam(defaultValue = "false") boolean includeHidden,
            @Parameter(description = "Вернуть в виде дерева (иерархия до 5 уровней)", example = "false")
            @RequestParam(defaultValue = "false") boolean asTree
    );

    @Operation(summary = "Получение категории по ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/CategoryDetailsSuccess"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @GetMapping("/{id}")
    ResponseEntity<CategoryDto> getCategoryById(
            @PathVariable @Min(value = 1, message = "ID категории должен быть не менее 1") Integer id
    );

    @Operation(summary = "Создание пользовательской категории", description = "Создает категорию или подкатегорию (глубина иерархии не более 5 уровней)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", ref = "#/components/responses/CategoryDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PostMapping
    ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryCreateRequest request);

    @Operation(summary = "Изменение или скрытие категории", description = "Для пользовательской категории меняет сущность, для стандартной — сохраняет персональные настройки пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/CategoryDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PatchMapping("/{id}")
    ResponseEntity<CategoryDto> updateCategory(
            @PathVariable @Min(value = 1, message = "ID категории должен быть не менее 1") Integer id,
            @Valid @RequestBody CategoryUpdateRequest request
    );

    @Operation(summary = "Сброс стандартной категории к настройкам по умолчанию")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/CategoryDetailsSuccess"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PostMapping("/{id}/reset")
    ResponseEntity<CategoryDto> resetCategory(
            @PathVariable @Min(value = 1, message = "ID категории должен быть не менее 1") Integer id
    );

    @Operation(summary = "Удаление пользовательской категории", description = "Переводит операции в 'Без категории' и удаляет категорию пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Категория удалена"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteCategory(
            @PathVariable @Min(value = 1, message = "ID категории должен быть не менее 1") Integer id
    );
}
