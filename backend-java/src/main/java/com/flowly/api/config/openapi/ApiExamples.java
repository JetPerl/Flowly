package com.flowly.api.config.openapi;

public final class ApiExamples {

    public static final String STANDARD_BAD_REQUEST = """
            {
              "code": 400,
              "type": "Bad Request",
              "message": "Некорректные данные в запросе"
            }
            """;

    public static final String STANDARD_UNAUTHORIZED = """
            {
              "code": 401,
              "type": "Unauthorized",
              "message": "Отсутствует или некорректный токен авторизации"
            }
            """;

    public static final String STANDARD_FORBIDDEN = """
            {
              "code": 403,
              "type": "Forbidden",
              "message": "У вас нет прав для выполнения данного действия"
            }
            """;

    public static final String RESOURCE_NOT_FOUND = """
            {
              "code": 404,
              "type": "Not Found",
              "message": "Запрашиваемый ресурс не найден"
            }
            """;

    public static final String CONFLICT_RESPONSE = """
            {
              "code": 409,
              "type": "Conflict",
              "message": "Ресурс с такими данными уже существует"
            }
            """;

    public static final String BUSINESS_VALIDATION_ERROR = """
            {
              "code": 422,
              "type": "Unprocessable Entity",
              "message": "Нарушение бизнес-логики операции"
            }
            """;

    public static final String STANDARD_INTERNAL_ERROR = """
            {
              "code": 500,
              "type": "Internal Server Error",
              "message": "Неизвестная ошибка сервера. Попробуйте снова"
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
                },
                {
                  "id": 369,
                  "type": "expense",
                  "amount": 44,
                  "currency": "BYN",
                  "category": "Без категории",
                  "categoryIcon": null,
                  "categoryColor": null,
                  "categoryId": null,
                  "account": "Наличные BYN",
                  "accountId": 23,
                  "accountIcon": "wallet",
                  "accountColor": "#AFE1AF",
                  "relatedAccountId": null,
                  "transferId": null,
                  "note": "",
                  "recipient": "",
                  "place": "",
                  "isPinned": false,
                  "dateTime": "2026-01-28T17:46:00"
                }
              ],
              "pageInfo": {
                "displayed": 2,
                "hasNext": true,
                "nextCursor": "MzY5"
              }
            }
            """;

    public static final String ACCOUNTS_LIST_SUCCESS = """
            [
              {
                "id": 33,
                "name": "Bybit",
                "currency": "USD",
                "balance": 22.95740624,
                "type": "REGULAR",
                "color": "#F7931A",
                "icon": "crypto"
              },
              {
                "id": 29,
                "name": "Наличные USD",
                "currency": "USD",
                "balance": -87.7,
                "type": "REGULAR",
                "color": "#9AC1F0",
                "icon": "wallet"
              },
              {
                "id": 25,
                "name": "Сбербанк",
                "currency": "RUB",
                "balance": 101276.66,
                "type": "REGULAR",
                "color": "#2CC36B",
                "icon": "card"
              }
            ]
            """;

    public static final String RATES_LIST_SUCCESS = """
            {
              "USD": 2.25,
              "EUR": 2.52,
              "RUB": 0.015
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

    private ApiExamples() {}
}
