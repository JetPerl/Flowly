package com.flowly.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Точка входа в приложение Flowly Finance Backend.
 * Запускает Spring Boot контекст и инициализирует автосканирование пакетов com.flowly.api.*
 */

@SpringBootApplication
@EnableScheduling
public class FlowlyApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlowlyApplication.class, args);
    }
}
