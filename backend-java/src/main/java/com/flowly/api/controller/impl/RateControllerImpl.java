package com.flowly.api.controller.impl;

import com.flowly.api.controller.RateController;
import com.flowly.api.service.impl.RateServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RateControllerImpl implements RateController {

    RateServiceImpl rateServiceImpl;

    @Override
    public ResponseEntity<Map<String,Double>> getRates() {
        return ResponseEntity.ok(rateServiceImpl.getCachedRates());
    }
}
