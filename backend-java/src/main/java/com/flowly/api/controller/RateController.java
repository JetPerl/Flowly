package com.flowly.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/api/v1/rates")
@Tag(name = "Курсы валют", description = "Методы для получения актуальных курсов валют НБРБ")
public interface RateController {

    @Operation(summary = "Получение кэшированных курсов валют", description = "Возвращает актуальный список курсов валют")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/RatesListSuccess"),
            @ApiResponse(responseCode = "500", ref = "#/components/responses/InternalServerError")
    })
    @GetMapping
    ResponseEntity<?> getRates();
}
