package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST-контракт для загрузки файлов (фотографий операций).
 */

@RequestMapping(ApiPaths.FILES)
@Tag(name = "Файлы", description = "Методы для загрузки изображений и медиафайлов")
public interface FileController {

    @Operation(summary = "Загрузка файла", description = "Загружает файл изображения на сервер и возвращает относительный URL")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Файл успешно загружен",
                    content = @Content(schema = @Schema(implementation = Map.class))),
            @ApiResponse(responseCode = "400", ref = "#/components/responses/BadRequest")
    })
    @BaseErrorResponses
    @PostMapping("/upload")
    ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file);
}
