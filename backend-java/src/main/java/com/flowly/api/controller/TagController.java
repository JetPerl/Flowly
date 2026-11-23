package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import com.flowly.api.model.dto.TagDto;
import com.flowly.api.model.request.tag.TagCreateRequest;
import com.flowly.api.model.request.tag.TagUpdateRequest;
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

@RequestMapping(ApiPaths.TAGS)
@Tag(name = "Метки", description = "Методы для управления метками (тегами) операций")
public interface TagController {

    @Operation(summary = "Получение списка меток")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/TagsListSuccess"),
            @ApiResponse(responseCode = "401", ref = "#/components/responses/Unauthorized")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<List<TagDto>> getTags(
            @Parameter(description = "Включать скрытые метки", example = "false")
            @RequestParam(defaultValue = "false") boolean includeHidden
    );

    @Operation(summary = "Получение метки по ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/TagDetailsSuccess"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @GetMapping("/{id}")
    ResponseEntity<TagDto> getTagById(
            @PathVariable @Min(value = 1, message = "ID метки должен быть не менее 1") Integer id
    );

    @Operation(summary = "Создание пользовательской метки")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", ref = "#/components/responses/TagDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest")
    })
    @BaseErrorResponses
    @PostMapping
    ResponseEntity<TagDto> createTag(@Valid @RequestBody TagCreateRequest request);

    @Operation(summary = "Изменение или скрытие метки")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/TagDetailsSuccess"),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound")
    })
    @BaseErrorResponses
    @PatchMapping("/{id}")
    ResponseEntity<TagDto> updateTag(
            @PathVariable @Min(value = 1, message = "ID метки должен быть не менее 1") Integer id,
            @Valid @RequestBody TagUpdateRequest request
    );

    @Operation(summary = "Сброс стандартной метки к настройкам по умолчанию")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/TagDetailsSuccess"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @PostMapping("/{id}/reset")
    ResponseEntity<TagDto> resetTag(
            @PathVariable @Min(value = 1, message = "ID метки должен быть не менее 1") Integer id
    );

    @Operation(summary = "Удаление пользовательской метки", description = "Отвязывает метку от операций и удаляет метку пользователя")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Метка удалена"),
            @ApiResponse(responseCode = "403", ref = "#/components/responses/Forbidden"),
            @ApiResponse(responseCode = "404", ref = "#/components/responses/NotFound"),
            @ApiResponse(responseCode = "422", ref = "#/components/responses/UnprocessableEntity")
    })
    @BaseErrorResponses
    @DeleteMapping("/{id}")
    ResponseEntity<Void> deleteTag(
            @PathVariable @Min(value = 1, message = "ID метки должен быть не менее 1") Integer id
    );
}
