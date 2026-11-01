package com.flowly.api.service;

import com.flowly.api.model.dto.NbrbRateDto;
import jakarta.annotation.PostConstruct;
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
public class RateService {

    private static final String NBRB_API_URL = "https://api.nbrb.by/exrates/rates?periodicity=0";

    // Базовый кэш: стоимость 1 единицы валюты в BYN (BYN = 1.0)
    private final Map<String, Double> ratesCache = new ConcurrentHashMap<>();
    private final RestClient restClient = RestClient.create();

    @PostConstruct
    public void init() {
        // Устанавливаем базовую валюту
        ratesCache.put("BYN", 1.0);
        // Загружаем курсы сразу при запуске
        updateRates();
    }

    /**
     * Запуск каждые 20 минут (20 * 60 * 1000 = 1 200 000 мс).
     */
    @Scheduled(fixedRate = 1_200_000, initialDelay = 1_200_000)
    public void updateRates() {
        try {
            log.info("Запрос актуальных курсов валют из API НБРБ...");

            List<NbrbRateDto> response = restClient.get()
                    .uri(NBRB_API_URL)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response != null && !response.isEmpty()) {
                ratesCache.put("BYN", 1.0);

                for (NbrbRateDto rate : response) {
                    if (rate.curScale() != null && rate.curScale() > 0 && rate.curOfficialRate() != null) {
                        // Рассчитываем курс за 1 единицу валюты к BYN
                        BigDecimal ratePerUnit = rate.curOfficialRate()
                                .divide(BigDecimal.valueOf(rate.curScale()), 6, RoundingMode.HALF_UP);

                        ratesCache.put(rate.curAbbreviation().toUpperCase(), ratePerUnit.doubleValue());
                    }
                }
                log.info("Курсы валют НБРБ успешно обновлены. Валют в кэше: {}", ratesCache.size());
            }
        } catch (Exception e) {
            log.error("Ошибка при обновлении курсов валют НБРБ: {}", e.getMessage());
            // Если кэш пуст (например, сеть упала на старте), оставляем резервные значения
            ratesCache.putIfAbsent("USD", 3.25);
            ratesCache.putIfAbsent("EUR", 3.55);
            ratesCache.putIfAbsent("RUB", 0.035);
        }
    }

    public Map<String, Double> getCachedRates() {
        return Collections.unmodifiableMap(ratesCache);
    }
}
