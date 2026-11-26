package com.flowly.api.service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Контракт сервиса работы с курсами валют.
 */

public interface RateService {

    void updateRates();

    Map<String, Double> getCachedRates();

    BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency);
}
