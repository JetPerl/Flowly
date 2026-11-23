package com.flowly.api.config.openapi;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        .addResponses(
                                "BadRequest",
                                jsonResponse("Некорректный запрос", ApiExamples.STANDARD_BAD_REQUEST)
                        )
                        .addResponses(
                                "Unauthorized",
                                jsonResponse("Пользователь не авторизован", ApiExamples.STANDARD_UNAUTHORIZED)
                        )
                        .addResponses(
                                "InvalidCredentials",
                                jsonResponse("Неверные учетные данные или недействительный токен", ApiExamples.INVALID_CREDENTIALS_UNAUTHORIZED)
                        )
                        .addResponses(
                                "Forbidden",
                                jsonResponse("Доступ запрещен, недостаточно прав", ApiExamples.STANDARD_FORBIDDEN)
                        )
                        .addResponses(
                                "NotFound",
                                jsonResponse("Ресурс не найден", ApiExamples.RESOURCE_NOT_FOUND)
                        )
                        .addResponses(
                                "Conflict",
                                jsonResponse("Конфликт данных", ApiExamples.CONFLICT_RESPONSE)
                        )
                        .addResponses(
                                "UnprocessableEntity",
                                jsonResponse("Ошибка бизнес-логики", ApiExamples.BUSINESS_VALIDATION_ERROR)
                        )
                        .addResponses(
                                "InternalServerError",
                                jsonResponse("Внутренняя ошибка сервера", ApiExamples.STANDARD_INTERNAL_ERROR)
                        )
                        .addResponses(
                                "AuthSuccess",
                                jsonResponse("Успешная аутентификация / выдача токенов", ApiExamples.AUTH_RESPONSE_SUCCESS)
                        )
                        .addResponses(
                                "OperationsPageSuccess",
                                jsonResponse("Список операций успешно получен", ApiExamples.OPERATIONS_PAGE_SUCCESS)
                        )
                        .addResponses(
                                "AccountsListSuccess",
                                jsonResponse("Список счетов успешно получен", ApiExamples.ACCOUNTS_LIST_SUCCESS)
                        )
                        .addResponses(
                                "RatesListSuccess",
                                jsonResponse("Курсы успешно получены", ApiExamples.RATES_LIST_SUCCESS)
                        )
                        .addResponses(
                                "OperationDetailsSuccess",
                                jsonResponse("Операция успешно получена", ApiExamples.OPERATION_DETAILS_SUCCESS)
                        )
                        .addResponses(
                                "CategoriesListSuccess",
                                jsonResponse("Список категорий успешно получен", ApiExamples.CATEGORIES_LIST_SUCCESS)
                        )
                        .addResponses(
                                "CategoryDetailsSuccess",
                                jsonResponse("Данные категории успешно получены", ApiExamples.CATEGORY_DETAILS_SUCCESS)
                        )
                        .addResponses(
                                "TagsListSuccess",
                                jsonResponse("Список меток успешно получен", ApiExamples.TAGS_LIST_SUCCESS)
                        )
                        .addResponses(
                                "TagDetailsSuccess",
                                jsonResponse("Данные метки успешно получены", ApiExamples.TAG_DETAILS_SUCCESS)
                        )
                        .addResponses(
                                "AccountDetailsSuccess",
                                jsonResponse("Данные счета успешно получены", ApiExamples.ACCOUNT_DETAILS_SUCCESS)
                        )
                );
    }

    private ApiResponse jsonResponse(String description, String example) {
        return new ApiResponse()
                .description(description)
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(example)));
    }
}
