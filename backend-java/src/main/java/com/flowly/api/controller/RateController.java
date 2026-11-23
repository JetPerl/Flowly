package com.flowly.api.controller;

import com.flowly.api.config.openapi.paths.ApiPaths;
import com.flowly.api.config.openapi.annotations.BaseErrorResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Map;

@RequestMapping(ApiPaths.RATES)
@Tag(name = "Курсы валют", description = "Методы для получения актуальных курсов валют")
public interface RateController {

    @Operation(summary = "Получение курсов валют", description = "Возвращает кэшированные курсы валют")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", ref = "#/components/responses/RatesListSuccess")
    })
    @BaseErrorResponses
    @GetMapping
    ResponseEntity<Map<String,Double>> getRates();
}
