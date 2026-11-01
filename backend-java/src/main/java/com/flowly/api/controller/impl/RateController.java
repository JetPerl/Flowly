package com.flowly.api.controller.impl;

import com.flowly.api.service.RateService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/rates", "/api/v1/rates"})
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RateController {

    RateService rateService;

    @GetMapping
    public ResponseEntity<?> getRates() {
        return ResponseEntity.ok(rateService.getCachedRates());
    }
}
