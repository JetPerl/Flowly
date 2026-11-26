package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.model.dto.NbrbRateDto;
import com.flowly.api.service.RateService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Сервис автоматического обновления курсов валют по данным НБРБ раз в 20 минут.
 */

@Service
@Slf4j
@RequiredArgsConstructor
public class RateServiceImpl implements RateService {

    private static final String NB_RB_API_URL = "https://api.nbrb.by/exrates/rates?periodicity=0";

    private final Map<String, Double> ratesCache = new ConcurrentHashMap<>();
    private final RestClient restClient;

    @PostConstruct
    public void init() {
        ratesCache.put("BYN", 1.0);
        updateRates();
    }

    /**
     * Запуск каждые 20 минут (20 * 60 * 1000 = 1 200 000 мс).
     */

    @Override
    @Scheduled(fixedRate = 1_200_000, initialDelay = 1_200_000)
    public void updateRates() {
        try {
            log.info("Запрос актуальных курсов валют из API НБРБ...");

            List<NbrbRateDto> response = restClient.get()
                    .uri(NB_RB_API_URL)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response != null && !response.isEmpty()) {
                ratesCache.put("BYN", 1.0);

                for (NbrbRateDto rate : response) {
                    if (rate.curScale() != null && rate.curScale() > 0 && rate.curOfficialRate() != null) {
                        BigDecimal ratePerUnit = rate.curOfficialRate()
                                .divide(BigDecimal.valueOf(rate.curScale()), 6, RoundingMode.HALF_UP);

                        ratesCache.put(rate.curAbbreviation().toUpperCase(), ratePerUnit.doubleValue());
                    }
                }
                log.info("Курсы валют НБРБ успешно обновлены. Валют в кэше: {}", ratesCache.size());
            }
        } catch (Exception e) {
            log.error("Ошибка при обновлении курсов валют НБРБ: {}", e.getMessage());
            ratesCache.putIfAbsent("USD", 3.25);
            ratesCache.putIfAbsent("EUR", 3.55);
            ratesCache.putIfAbsent("RUB", 0.035);
        }
    }

    @Override
    public Map<String, Double> getCachedRates() {
        return Collections.unmodifiableMap(ratesCache);
    }

    @Override
    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (fromCurrency == null || toCurrency == null || fromCurrency.equalsIgnoreCase(toCurrency)) {
            return amount;
        }

        String normalizedFrom = fromCurrency.trim().toUpperCase();
        String normalizedTo = toCurrency.trim().toUpperCase();

        Double fromRate = ratesCache.get(normalizedFrom);
        Double toRate = ratesCache.get(normalizedTo);

        if (fromRate == null || fromRate <= 0) {
            throw new BusinessValidationException("Не найден курс для валюты: " + fromCurrency);
        }
        if (toRate == null || toRate <= 0) {
            throw new BusinessValidationException("Не найден курс для валюты: " + toCurrency);
        }

        BigDecimal amountInByn = amount.multiply(BigDecimal.valueOf(fromRate));
        return amountInByn.divide(BigDecimal.valueOf(toRate), 4, RoundingMode.HALF_UP);
    }
}
