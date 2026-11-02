package com.flowly.api.controller.impl;

import com.flowly.api.controller.RateController;
import com.flowly.api.service.RateService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RateControllerImpl implements RateController {

    RateService rateService;

    @Override
    public ResponseEntity<?> getRates() {
        return ResponseEntity.ok(rateService.getCachedRates());
    }
}
