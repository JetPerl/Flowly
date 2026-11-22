package com.flowly.api.service;

import java.util.Map;

/**
 * Контракт сервиса работы с курсами валют.
 */

public interface RateService {

    void updateRates();

    Map<String, Double> getCachedRates();
}
