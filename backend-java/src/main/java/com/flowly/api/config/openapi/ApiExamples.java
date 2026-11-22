package com.flowly.api.config.openapi;

public final class ApiExamples {

    public static final String STANDARD_BAD_REQUEST = """
            {
              "status": 400,
              "type": "Bad Request",
              "message": "Некорректные данные в запросе"
            }
            """;

    public static final String STANDARD_UNAUTHORIZED = """
            {
              "status": 401,
              "type": "Unauthorized",
              "message": "Отсутствует или некорректный токен авторизации"
            }
            """;

    public static final String INVALID_CREDENTIALS_UNAUTHORIZED = """
            {
              "status": 401,
              "type": "Unauthorized",
              "message": "Неверный адрес электронной почты или пароль"
            }
            """;

    public static final String STANDARD_FORBIDDEN = """
            {
              "status": 403,
              "type": "Forbidden",
              "message": "У вас нет прав для выполнения данного действия"
            }
            """;

    public static final String RESOURCE_NOT_FOUND = """
            {
              "status": 404,
              "type": "Not Found",
              "message": "Запрашиваемый ресурс не найден"
            }
            """;

    public static final String CONFLICT_RESPONSE = """
            {
              "status": 409,
              "type": "Conflict",
              "message": "Пользователь с таким адресом уже зарегистрирован"
            }
            """;

    public static final String BUSINESS_VALIDATION_ERROR = """
            {
              "status": 422,
              "type": "Unprocessable Entity",
              "message": "Нарушение бизнес-логики операции"
            }
            """;

    public static final String STANDARD_INTERNAL_ERROR = """
            {
              "status": 500,
              "type": "Internal Server Error",
              "message": "Неизвестная ошибка сервера. Попробуйте снова"
            }
            """;

    public static final String AUTH_RESPONSE_SUCCESS = """
            {
              "token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJFR3dSWTNpN1FFbXBET3cySHNTN2E2azR2cUN6WU1qdU5LMkpR...",
              "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI4MzlhNmMzYS1kYTRmLTQ1NTAtOTExNi0zNTdjODRlYz...",
              "tokenType": "Bearer",
              "expiresIn": 300,
              "userId": 13,
              "email": "test_user@test.com"
            }
            """;

    public static final String OPERATIONS_PAGE_SUCCESS = """
            {
              "items": [
                {
                  "id": 371,
                  "type": "expense",
                  "amount": 12,
                  "currency": "BYN",
                  "category": "Мясо",
                  "categoryIcon": "meat",
                  "categoryColor": null,
                  "categoryId": 28,
                  "account": "Наличные BYN",
                  "accountId": 23,
                  "accountIcon": "wallet",
                  "accountColor": "#AFE1AF",
                  "relatedAccountId": null,
                  "transferId": null,
                  "note": "Хамон",
                  "recipient": "",
                  "place": "",
                  "isPinned": false,
                  "dateTime": "2026-03-02T10:38:00"
                }
              ],
              "pageInfo": {
                "displayed": 1,
                "hasNext": false,
                "nextCursor": null
              }
            }
            """;

    public static final String ACCOUNTS_LIST_SUCCESS = """
            [
              {
                "id": 33,
                "name": "ByBit",
                "currency": "USD",
                "balance": 22.95740624,
                "type": "REGULAR",
                "color": "#F7931A",
                "icon": "crypto"
              }
            ]
            """;

    public static final String RATES_LIST_SUCCESS = """
            {
              "USD": 3.25,
              "EUR": 3.55,
              "RUB": 0.035
            }
            """;

    public static final String OPERATION_DETAILS_SUCCESS = """
            {
              "id": 371,
              "type": "expense",
              "amount": 12,
              "currency": "BYN",
              "category": "Мясо",
              "categoryIcon": "meat",
              "categoryColor": null,
              "categoryId": 28,
              "account": "Наличные BYN",
              "accountId": 23,
              "accountIcon": "wallet",
              "accountColor": "#AFE1AF",
              "relatedAccountId": null,
              "transferId": null,
              "note": "Хамон",
              "recipient": "",
              "place": "",
              "isPinned": false,
              "dateTime": "2026-03-02T10:38:00"
            }
            """;

    private ApiExamples() {
    }
}
