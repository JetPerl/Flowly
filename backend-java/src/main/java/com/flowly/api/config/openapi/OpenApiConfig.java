package com.flowly.api.config.openapi;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Flowly Finance API")
                        .description("REST API для сервиса управления личными финансами")
                        .version("1.0.0"))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        // JWT Security Scheme
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                        .addResponses("BadRequest", createBadRequestResponse())
                        .addResponses("Unauthorized", createUnauthorizedResponse())
                        .addResponses("Forbidden", createForbiddenResponse())
                        .addResponses("NotFound", createNotFoundResponse())
                        .addResponses("Conflict", createConflictResponse())
                        .addResponses("UnprocessableEntity", createUnprocessableEntityResponse())
                        .addResponses("InternalServerError", createInternalServerErrorResponse())
                        .addResponses("OperationsPageSuccess", createOperationsPageSuccessResponse())
                        .addResponses("AccountsListSuccess", createAccountsListSuccessResponse())
                        .addResponses("RatesListSuccess", createRatesListSuccessResponse())
                        .addResponses("OperationDetailsSuccess", createOperationDetailsSuccessResponse())
                );
    }

    private ApiResponse createBadRequestResponse() {
        return new ApiResponse()
                .description("Некорректный запрос")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.STANDARD_BAD_REQUEST)));
    }

    private ApiResponse createUnauthorizedResponse() {
        return new ApiResponse()
                .description("Пользователь не авторизован")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.STANDARD_UNAUTHORIZED)));
    }

    private ApiResponse createForbiddenResponse() {
        return new ApiResponse()
                .description("Доступ запрещен, недостаточно прав")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.STANDARD_FORBIDDEN)));
    }

    private ApiResponse createNotFoundResponse() {
        return new ApiResponse()
                .description("Ресурс не найден")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.RESOURCE_NOT_FOUND)));
    }

    private ApiResponse createConflictResponse() {
        return new ApiResponse()
                .description("Конфликт данных")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.CONFLICT_RESPONSE)));
    }

    private ApiResponse createUnprocessableEntityResponse() {
        return new ApiResponse()
                .description("Ошибка бизнес-логики")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.BUSINESS_VALIDATION_ERROR)));
    }

    private ApiResponse createInternalServerErrorResponse() {
        return new ApiResponse()
                .description("Внутренняя ошибка сервера")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.STANDARD_INTERNAL_ERROR)));
    }

    private ApiResponse createOperationsPageSuccessResponse() {
        return new ApiResponse()
                .description("Список операций успешно получен")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.OPERATIONS_PAGE_SUCCESS)));
    }

    private ApiResponse createAccountsListSuccessResponse() {
        return new ApiResponse()
                .description("Список счетов успешно получен")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.ACCOUNTS_LIST_SUCCESS)));
    }

    private ApiResponse createRatesListSuccessResponse() {
        return new ApiResponse()
                .description("Курсы успешно получены")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.RATES_LIST_SUCCESS)));
    }

    private ApiResponse createOperationDetailsSuccessResponse() {
        return new ApiResponse()
                .description("Операция успешно получена")
                .content(new Content().addMediaType("application/json",
                        new MediaType().example(ApiExamples.OPERATION_DETAILS_SUCCESS)));
    }
}
