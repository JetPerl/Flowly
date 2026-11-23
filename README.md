# 💸 Flowly — Личный финансовый менеджер

> Полнофункциональное мобильное приложение для учёта личных финансов. Монорепозиторий с мобильным клиентом на React Native (Expo) и REST API на Spring Boot + Keycloak + PostgreSQL.

---

## 📋 Содержание

- [О проекте](#-о-проекте)
- [Технологический стек](#-технологический-стек)
- [Архитектура](#-архитектура)
- [Функциональность](#-функциональность)
- [Структура проекта](#-структура-проекта)
- [API](#-api)
- [Запуск проекта](#-запуск-проекта)
- [Схема базы данных](#-схема-базы-данных)
- [Автор](#-автор)

---

## 🎯 О проекте

**Flowly** — мобильное приложение для ведения личного бюджета с поддержкой нескольких счетов, категорий, тегов, геолокации операций и фото-чеков. Приложение синхронизируется с собственным Java-бэкендом, который обеспечивает безопасное хранение данных и авторизацию через Keycloak.

Проект разрабатывался с нуля как учебно-портфолийный — от проектирования схемы БД до реализации сложных UI-паттернов в React Native.

---

## 🛠 Технологический стек

### 📱 Мобильный клиент (`Flowly/`)

| Категория | Технология |
|-----------|-----------|
| Платформа | React Native 0.88 + Expo 58 |
| Язык | TypeScript 6 |
| Навигация | Expo Router 58 (файловая маршрутизация) |
| Состояние | React Context API (Currency, Avatar, SecurityCode, TransactionDraft) |
| Анимации | react-native-reanimated 4.7 |
| Графика | @shopify/react-native-skia 2.14, react-native-svg |
| Графики | react-native-gifted-charts |
| Карты | react-native-maps + expo-location + Nominatim (обратный геокодинг) |
| Bottom Sheet | @gorhom/bottom-sheet 5 |
| Биометрия | expo-local-authentication (Face ID / Touch ID) |
| Хранилище | @react-native-async-storage/async-storage |
| Тесты | Jest 30 |
| Линтер | ESLint + Prettier |

### ☕ Бэкенд (`backend-java/`)

| Категория | Технология |
|-----------|-----------|
| Платформа | Spring Boot 3.3 (Java) |
| Аутентификация | Keycloak + Spring Security OAuth2 Resource Server (JWT) |
| База данных | PostgreSQL |
| Миграции | Liquibase |
| ORM | Spring Data JPA / Hibernate |
| Маппинг | MapStruct |
| Генерация кода | Lombok |
| Документация API | SpringDoc OpenAPI (Swagger UI) |
| Курсы валют | Интеграция с API НБРБ |

---

## 🏗 Архитектура

### Общая схема

```
FlowlyProject/
├── Flowly/           # React Native мобильный клиент
└── backend-java/     # Spring Boot REST API
```

```
Mobile App (React Native / Expo)
         │  HTTP/REST (Bearer JWT)
         ▼
Spring Boot API  ──►  Keycloak (OAuth2)
         │
         ▼
    PostgreSQL
```

### Frontend — слоистая архитектура

```
app/           ← маршруты (Expo Router, тонкие обёртки)
  ├── (tabs)/  ← tab-навигация
  └── (modal)/ ← модальные экраны (операции, категории, теги, карта)
src/
  ├── api/           ← единый HTTP-слой (fetch + типизированные функции)
  ├── types/         ← TypeScript DTO, точно отражающие Java-модели
  ├── utils/         ← чистые утилиты (валюта, форматирование, группировка)
  ├── components/    ← переиспользуемые UI-компоненты (OperationRow, CategoryIcon…)
  ├── screens/       ← бизнес-экраны с декомпозицией компонентов
  ├── context/       ← глобальные контексты
  ├── security/      ← PIN-код + биометрия
  └── location/      ← геолокационный сервис
```

### Backend — Controller / Service / Repository

```
Controller (Interface + Impl)
  └── Service (Interface + Impl)
        └── Repository (Spring Data JPA)
              └── Entity → Mapper (MapStruct) → DTO/Response
```

Разделение `Controller` / `ControllerImpl` позволяет OpenAPI-аннотациям жить в интерфейсе, сохраняя реализации чистыми.

---

## ✨ Функциональность

### Учёт финансов
- ➕ Создание, редактирование и удаление операций (доходы / расходы / переводы)
- 🔄 Переводы между счетами — реализованы как пара связанных операций (`transferId`) с автоматической балансировкой
- 📋 История операций с курсорной пагинацией (`nextCursor` / `hasNext`)
- 🔍 Поиск операций по сумме, категории, заметке
- 📌 Закрепление важных операций

### Счета
- 💳 Несколько счетов: обычный, карта, наличные, сберегательный, криптовалюта, инвестиции — с созданием, редактированием и удалением
- 💱 Мультивалютность: BYN, USD, EUR, RUB — с автоматической конвертацией через курсы НБРБ при операциях и переводах
- 🛡️ Контроль остатка: наличный счёт (`CASH`) защищён от ухода баланса в минус при изменении счёта и проведении операций
- 📊 Общий баланс в основной валюте с разбивкой по типам счетов

### Категории и теги
- 🗂 100+ системных категорий с SVG-иконками и цветовой маркировкой, поддержка вложенных подкатегорий (до 5 уровней) и вывода в виде дерева (`asTree`)
- ✏️ Пользовательские категории и теги: создание, редактирование и удаление (при удалении категории операции автоматически переносятся в «Без категории»)
- 🎨 Персонализация стандартных категорий и тегов для каждого пользователя (переименование, смена иконки/цвета, скрытие и сброс к настройкам по умолчанию)
- 🏷 Теги для гибкой классификации операций
- 📁 Разделение категорий на доходы (`INCOME`) и расходы (`EXPENSE`)

### Дополнительные возможности
- 📸 Фото чека — прикрепление изображения к операции (`multipart/form-data`)
- 📍 Геолокация операции — выбор места на карте или автоопределение, обратное геокодирование через Nominatim
- 📆 Выбор произвольной даты и времени
- 📈 График расходов по месяцам (Gifted Charts + Skia)
- 💱 Карточка актуальных курсов валют (НБРБ)

### Безопасность
- 🔒 PIN-код приложения с анимированным экраном блокировки
- 👆 Биометрическая аутентификация (Face ID / Touch ID) через `expo-local-authentication`
- 🔑 JWT-авторизация через Keycloak (OAuth2 / OpenID Connect)
- ♻️ Прозрачное обновление access-токена через refresh-token

---

## 📁 Структура проекта

```
FlowlyProject/
│
├── Flowly/                                          # React Native / Expo
│   ├── app/
│   │   ├── _layout.tsx                              # Корневой layout (провайдеры, шрифты)
│   │   ├── (tabs)/
│   │   │   ├── index.tsx                            # Главный экран (MainScreen)
│   │   │   ├── report.tsx                           # Экран отчётов
│   │   │   └── profile/                             # Профиль пользователя
│   │   │       ├── index.tsx
│   │   │       ├── edit-profile.tsx
│   │   │       ├── currency-list.tsx
│   │   │       └── security.tsx
│   │   ├── (modal)/
│   │   │   ├── transactions/new/                    # Создание / редактирование операции
│   │   │   │   ├── index.tsx                        # Основная форма
│   │   │   │   ├── category/                        # Выбор категории
│   │   │   │   ├── account/                         # Выбор счёта
│   │   │   │   ├── tags/                            # Выбор тегов
│   │   │   │   ├── location.tsx                     # Карта геолокации
│   │   │   │   ├── category-new.tsx                 # Создание новой категории
│   │   │   │   └── account-new/                     # Создание нового счёта
│   │   │   └── security-code/                       # Экран PIN-кода
│   │   └── all-accounts.tsx                         # Все счета
│   │
│   └── src/
│       ├── api/                                     # HTTP-слой
│       │   ├── config.ts                            # API_BASE_URL (EXPO_PUBLIC_API_URL)
│       │   ├── client.ts                            # apiRequest<T>, uploadImageFile
│       │   ├── accounts.api.ts                      # getAccounts()
│       │   ├── categories.api.ts                    # getCategories(type?)
│       │   ├── operations.api.ts                    # CRUD операций
│       │   ├── tags.api.ts                          # getTags()
│       │   ├── rates.api.ts                         # getRates()
│       │   ├── files.api.ts                         # uploadOperationPhoto()
│       │   ├── auth.api.ts                          # login, register, refresh, logout
│       │   └── index.ts
│       │
│       ├── types/                                   # TypeScript DTO (зеркало Java-моделей)
│       │   ├── account.ts                           # AccountResponse, AccountType
│       │   ├── category.ts                          # CategoryDto, CategoryType
│       │   ├── operation.ts                         # OperationResponse, OperationCreateRequest…
│       │   ├── tag.ts                               # TagDto
│       │   ├── auth.ts                              # AuthResponse, LoginRequest…
│       │   ├── rates.ts                             # RatesMap
│       │   ├── common.ts                            # ApiResponse, HttpErrorResponse
│       │   └── index.ts
│       │
│       ├── utils/                                   # Чистые утилиты
│       │   ├── currency.ts                          # Символы, конвертация, getRateToMain
│       │   ├── formatters.ts                        # Дата/время, числа (ru-RU локаль)
│       │   ├── operationHelpers.ts                  # Группировка операций по дням
│       │   └── index.ts
│       │
│       ├── components/
│       │   ├── CategoryIcon.tsx                     # SVG-иконка категории
│       │   └── operations/
│       │       ├── OperationRow.tsx                 # Универсальная строка операции
│       │       ├── OperationIcon.tsx                # Иконка операции (доход/расход/перевод)
│       │       ├── TransferIcon.tsx                 # Двойная иконка перевода
│       │       └── HistorySectionHeader.tsx         # Заголовок секции (дата + итог)
│       │
│       ├── screens/
│       │   └── main/components/                     # Компоненты главного экрана
│       │       ├── BalanceSlider.tsx
│       │       ├── AccountGroupsSummary.tsx
│       │       ├── QuickActions.tsx
│       │       ├── MonthlySpendingChart.tsx
│       │       ├── ExchangeRatesCard.tsx
│       │       └── HeroParallaxHeader.tsx
│       │
│       ├── security/                                # PIN + биометрия
│       │   └── SecurityCodeProvider.tsx
│       ├── context/                                 # TransactionDraftContext
│       ├── currency/                                # CurrencyContext
│       ├── avatar/                                  # AvatarContext
│       ├── location/                                # locationService.ts
│       ├── icons/                                   # categoryIcons.ts (100+ SVG)
│       │
│       ├── MainScreen.tsx                           # Главный экран (история + баланс)
│       ├── AllAccountsScreen.tsx                    # Экран всех счетов
│       ├── ProfileScreen.tsx
│       ├── EditProfile.tsx
│       ├── CurrencyListScreen.tsx
│       └── SecurityList.tsx
│
└── backend-java/                                                # Spring Boot REST API
    └── src/
        ├── main/
        │   ├── java/com/flowly/api/
        │   │   ├── FlowlyApplication.java                       # Точка входа Spring Boot приложения
        │   │   ├── config/                                      
        │   │   │   ├── RestClientConfig.java                    # Настройка HTTP-клиента RestClient и таймаутов
        │   │   │   ├── SwaggerConfig.java                       # Конфигурация авторизации OAuth2 в Swagger UI
        │   │   │   ├── WebMvcConfig.java                        # Настройки Spring Web MVC (CORS, ресурсы и т.д.)
        │   │   │   └── openapi/
        │   │   │       ├── ApiExamples.java                     # Примеры JSON-ответов и ошибок для документации
        │   │   │       ├── OpenApiConfig.java                   # Регистрация компонентов ответов OpenAPI
        │   │   │       ├── annotations/
        │   │   │       │   └── BaseErrorResponses.java          # Аннотация общих ответов ошибок (401, 500)
        │   │   │       └── paths/
        │   │   │           └── ApiPaths.java                    # Константы базовых путей эндпоинтов API v1
        │   │   ├── controller/                                  
        │   │   │   ├── AccountController.java                   # Контракт эндпоинтов счетов
        │   │   │   ├── AdminUserController.java                 # Контракт админ-эндпоинтов управления пользователями
        │   │   │   ├── AuthController.java                      # Контракт эндпоинтов аутентификации и токенов
        │   │   │   ├── CategoryController.java                  # Контракт эндпоинтов категорий и кастомизации
        │   │   │   ├── FileController.java                      # Контракт эндпоинта загрузки файлов
        │   │   │   ├── OperationController.java                 # Контракт эндпоинтов операций
        │   │   │   ├── RateController.java                      # Контракт эндпоинта курсов валют
        │   │   │   ├── TagController.java                       # Контракт эндпоинтов меток и кастомизации
        │   │   │   └── impl/
        │   │   │       ├── AccountControllerImpl.java           # Реализация контроллера счетов
        │   │   │       ├── AdminUserControllerImpl.java         # Реализация админ-контроллера пользователей
        │   │   │       ├── AuthControllerImpl.java              # Реализация контроллера аутентификации
        │   │   │       ├── CategoryControllerImpl.java          # Реализация контроллера категорий
        │   │   │       ├── FileControllerImpl.java              # Реализация контроллера файлов
        │   │   │       ├── OperationControllerImpl.java         # Реализация контроллера операций
        │   │   │       ├── RateControllerImpl.java              # Реализация контроллера курсов валют
        │   │   │       └── TagControllerImpl.java               # Реализация контроллера меток
        │   │   ├── exception/                                   
        │   │   │   ├── BusinessValidationException.java         # Ошибка нарушения бизнес-правил
        │   │   │   ├── ConflictException.java                   # Ошибка конфликта данных
        │   │   │   ├── ForbiddenAccessException.java            # Ошибка отсутствия прав доступа к ресурсу
        │   │   │   └── ResourceNotFoundException.java           # Ошибка «ресурс не найден»
        │   │   ├── handler/
        │   │   │   └── GlobalExceptionHandler.java              # Глобальный перехватчик исключений в HTTP-ответы
        │   │   ├── mapper/                                      
        │   │   │   ├── AccountMapper.java                       # Маппинг счетов
        │   │   │   ├── CategoryMapper.java                      # Маппинг категорий
        │   │   │   ├── OperationMapper.java                     # Маппинг операций
        │   │   │   └── TagMapper.java                           # Маппинг меток
        │   │   ├── model/                                       
        │   │   │   ├── dto/
        │   │   │   │   ├── AccountDto.java                      # DTO счёта
        │   │   │   │   ├── CategoryDto.java                     # DTO категории
        │   │   │   │   ├── NbrbRateDto.java                     # DTO записи курса валюты из API НБРБ
        │   │   │   │   ├── OperationDto.java                    # DTO операции
        │   │   │   │   ├── TagDto.java                          # DTO метки
        │   │   │   │   └── UserDto.java                         # DTO пользователя
        │   │   │   ├── entity/
        │   │   │   │   ├── Account.java                         # JPA-сущность счёта
        │   │   │   │   ├── Category.java                        # JPA-сущность категории
        │   │   │   │   ├── Operation.java                       # JPA-сущность финансовой операции
        │   │   │   │   ├── Tag.java                             # JPA-сущность метки
        │   │   │   │   ├── User.java                            # JPA-сущность пользователя
        │   │   │   │   ├── UserCategory.java                    # Персональные настройки категории пользователя
        │   │   │   │   └── UserTag.java                         # Персональные настройки метки пользователя
        │   │   │   ├── enums/
        │   │   │   │   ├── AccountType.java                     # Типы счетов (например, CASH, CARD и др.)
        │   │   │   │   ├── CategoryType.java                    # Типы категорий (EXPENSE, INCOME)
        │   │   │   │   └── OperationType.java                   # Типы операций (EXPENSE, INCOME, TRANSFER)
        │   │   │   ├── request/
        │   │   │   │   ├── account/
        │   │   │   │   │   ├── AccountCreateRequest.java        # Запрос на создание счёта
        │   │   │   │   │   └── AccountUpdateRequest.java        # Запрос на частичное обновление счёта
        │   │   │   │   ├── authorization/
        │   │   │   │   │   ├── LoginRequest.java                # Запрос на вход
        │   │   │   │   │   ├── LogoutRequest.java               # Запрос на выход / отзыв сессии
        │   │   │   │   │   ├── RefreshTokenRequest.java         # Запрос на обновление access-токена
        │   │   │   │   │   └── RegisterRequest.java             # Запрос на регистрацию пользователя
        │   │   │   │   ├── category/
        │   │   │   │   │   ├── CategoryCreateRequest.java       # Запрос на создание категории
        │   │   │   │   │   └── CategoryUpdateRequest.java       # Запрос на обновление / кастомизацию категории
        │   │   │   │   ├── operation/
        │   │   │   │   │   ├── OperationCreateRequest.java      # Запрос на создание операции / перевода
        │   │   │   │   │   └── OperationPatchRequest.java       # Запрос на частичное обновление операции
        │   │   │   │   └── tag/
        │   │   │   │       ├── TagCreateRequest.java            # Запрос на создание метки
        │   │   │   │       └── TagUpdateRequest.java            # Запрос на обновление / кастомизацию метки
        │   │   │   └── response/
        │   │   │       ├── HttpErrorResponse.java               # Единый формат ответа об ошибке
        │   │   │       ├── account/
        │   │   │       │   └── AccountResponse.java             # Ответ с данными счёта
        │   │   │       ├── authorization/
        │   │   │       │   └── AuthResponse.java                # Ответ с токенами и данными пользователя
        │   │   │       └── operation/
        │   │   │           ├── OperationPageResponse.java       # Страница операций с метаданными пагинации
        │   │   │           ├── OperationResponse.java           # Ответ с данными операции
        │   │   │           └── PageInfoResponse.java            # Информация о курсорной пагинации
        │   │   ├── repository/                                  
        │   │   │   ├── AccountRepository.java                   # Репозиторий счетов
        │   │   │   ├── CategoryRepository.java                  # Репозиторий категорий
        │   │   │   ├── OperationRepository.java                 # Репозиторий операций
        │   │   │   ├── TagRepository.java                       # Репозиторий меток
        │   │   │   ├── UserCategoryRepository.java              # Репозиторий персональных настроек категорий
        │   │   │   ├── UserRepository.java                      # Репозиторий пользователей
        │   │   │   └── UserTagRepository.java                   # Репозиторий персональных настроек меток
        │   │   ├── security/                                    
        │   │   │   ├── CustomAccessDeniedHandler.java           # Обработка 403 Forbidden
        │   │   │   ├── CustomAuthenticationEntryPoint.java      # Обработка 401 Unauthorized
        │   │   │   └── SecurityConfig.java                      # Конфигурация Spring Security и Resource Server
        │   │   ├── service/                                     
        │   │   │   ├── AccountService.java                      # Контракт сервиса счетов
        │   │   │   ├── AdminUserService.java                    # Контракт админ-сервиса пользователей
        │   │   │   ├── AuthService.java                         # Контракт сервиса аутентификации
        │   │   │   ├── CategoryService.java                     # Контракт сервиса категорий
        │   │   │   ├── FileStorageService.java                  # Контракт сервиса хранения файлов
        │   │   │   ├── OperationService.java                    # Контракт сервиса операций
        │   │   │   ├── RateService.java                         # Контракт сервиса курсов валют
        │   │   │   ├── TagService.java                          # Контракт сервиса меток
        │   │   │   └── impl/
        │   │   │       ├── AccountServiceImpl.java              # CRUD счетов и контроль баланса CASH
        │   │   │       ├── AdminUserServiceImpl.java            # Удаление пользователей в БД и Keycloak
        │   │   │       ├── AuthServiceImpl.java                 # Регистрация, вход, refresh и logout через Keycloak
        │   │   │       ├── CategoryServiceImpl.java             # Иерархия, CRUD, скрытие, сброс и кастомизация категорий
        │   │   │       ├── FileStorageServiceImpl.java          # Сохранение загруженных файлов
        │   │   │       ├── OperationServiceImpl.java            # CRUD операций, переводы, конвертация валют и балансы
        │   │   │       ├── RateServiceImpl.java                 # Периодическое обновление и кэширование курсов НБРБ
        │   │   │       └── TagServiceImpl.java                  # CRUD, скрытие, сброс и кастомизация меток
        │   │   ├── utils/
        │   │   │   ├── CategoryAccessPolicy.java                # Проверка прав доступа к системным и пользовательским категориям
        │   │   │   └── SecurityUtils.java                       # Извлечение данных текущего пользователя из JWT
        │   │   └── validation/                                  
        │   │       ├── ValidStringFieldValidator.java           # Валидатор строковых ограничений
        │   │       ├── annotations/
        │   │       │   └── ValidStringField.java                # Аннотация валидации строкового поля
        │   │       └── constraints/
        │   │           ├── PatternType.java                     # Наборы регулярных выражений для полей
        │   │           └── StringFieldConstraintType.java       # Типы ограничений длины и формата строк
        │   └── resources/
        │       ├── application.yml                              # Конфигурация БД, Keycloak, Swagger и таймаутов
        │       └── db/migration/                                # Миграции схемы и данных Liquibase
        │           ├── db.changelog-master.xml                  # Главный changelog Liquibase
        │           └── 2026/11/
        │               ├── 11/
        │               │   ├── 2026-11-11_create_accounts_table.sql               # Создание таблицы счетов
        │               │   ├── 2026-11-11_create_budgets_table.sql                # Создание таблицы бюджетов
        │               │   ├── 2026-11-11_create_categories_table.sql             # Создание таблицы категорий
        │               │   ├── 2026-11-11_create_crypto_assets_table.sql          # Создание таблицы криптоактивов
        │               │   ├── 2026-11-11_create_exchange_rates_table.sql         # Создание таблицы курсов валют
        │               │   ├── 2026-11-11_create_goals_table.sql                  # Создание таблицы целей
        │               │   ├── 2026-11-11_create_indexes.sql                      # Создание индексов БД
        │               │   ├── 2026-11-11_create_logs_table.sql                   # Создание таблицы логов
        │               │   ├── 2026-11-11_create_merchants_table.sql              # Создание таблицы мерчантов
        │               │   ├── 2026-11-11_create_operation_tags_table.sql         # Создание M2M таблицы операций и меток
        │               │   ├── 2026-11-11_create_operations_table.sql             # Создание таблицы операций
        │               │   ├── 2026-11-11_create_tags_table.sql                   # Создание таблицы меток
        │               │   ├── 2026-11-11_create_user_sessions_table.sql          # Создание таблицы пользовательских сессий
        │               │   ├── 2026-11-11_create_users_table.sql                  # Создание таблицы пользователей
        │               │   ├── 2026-11-11_insert_initial_categories.sql           # Начальное наполнение категорий
        │               │   ├── 2026-11-11_insert_initial_exchange_rates.sql       # Начальное наполнение курсов валют
        │               │   └── 2026-11-11_insert_initial_tags.sql                 # Начальное наполнение меток
        │               ├── 20/
        │               │   ├── 2026-11-20_add_keycloak_id_column.sql              # Добавление keycloak_id в users
        │               │   ├── 2026-11-20_configure_operations_fk_on_delete.sql   # Настройка ON DELETE для операций
        │               │   ├── 2026-11-20_configure_user_fk_on_delete.sql         # Настройка ON DELETE для пользователя
        │               │   └── 2026-11-20_drop_password_hash_column.sql           # Удаление устаревшей колонки password_hash
        │               └── 23/
        │                   ├── 2026-11-23_add_is_system_and_user_tags.sql         # Поля системности и привязка меток к пользователю
        │                   ├── 2026-11-23_create_user_categories_table.sql        # Создание таблицы user_categories
        │                   └── 2026-11-23_create_user_tags_table.sql              # Создание таблицы user_tags
        └── test/java/com/flowly/api/                                              # Пакет тестов приложения
```

---

## 🌐 API

Базовый URL: `http://localhost:8080/api/v1`

Swagger UI доступен по адресу: `http://localhost:8080/swagger-ui/index.html`

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/register` | Регистрация нового пользователя в Keycloak |
| `POST` | `/auth/login` | Получение access + refresh токенов |
| `POST` | `/auth/refresh` | Обновление access-токена |
| `POST` | `/auth/logout` | Инвалидация сессии в Keycloak |

### Операции

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/operations` | История операций (курсорная пагинация) |
| `POST` | `/operations` | Создание операции |
| `GET` | `/operations/{id}` | Операция по ID |
| `PATCH` | `/operations/{id}` | Частичное обновление операции |
| `DELETE` | `/operations/{id}` | Удаление операции |

Параметры пагинации `GET /operations`:

| Параметр | Тип | Описание |
|----------|-----|----------|
| `cursor` | `string?` | Непрозрачный курсор для следующей страницы |
| `limit` | `int` | Количество записей (по умолчанию 20) |
| `type` | `EXPENSE\|INCOME\|TRANSFER?` | Фильтр по типу |

### Счета

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/accounts` | Список счетов текущего пользователя |
| `GET` | `/accounts/{id}` | Получение информации о счёте по ID |
| `POST` | `/accounts` | Создание нового счёта пользователя |
| `PATCH` | `/accounts/{id}` | Частичное обновление счёта (название, баланс, валюта, тип, цвет, иконка) |
| `DELETE` | `/accounts/{id}` | Удаление счёта пользователя |

### Категории

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/categories` | Список категорий пользователя (`type`, `includeHidden`, `asTree` до 5 уровней) |
| `GET` | `/categories/{id}` | Получение категории по ID |
| `POST` | `/categories` | Создание пользовательской категории или подкатегории |
| `PATCH` | `/categories/{id}` | Изменение пользовательской категории или персональная настройка/скрытие стандартной |
| `POST` | `/categories/{id}/reset` | Сброс персональных настроек стандартной категории к значениям по умолчанию |
| `DELETE` | `/categories/{id}` | Удаление пользовательской категории (операции переводятся в «Без категории») |

### Теги (метки)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/tags` | Список меток пользователя (`includeHidden`) |
| `GET` | `/tags/{id}` | Получение метки по ID |
| `POST` | `/tags` | Создание пользовательской метки |
| `PATCH` | `/tags/{id}` | Изменение пользовательской метки или персональная настройка/скрытие стандартной |
| `POST` | `/tags/{id}/reset` | Сброс персональных настроек стандартной метки к значениям по умолчанию |
| `DELETE` | `/tags/{id}` | Отвязка метки от операций и удаление пользовательской метки |

### Курсы и Файлы

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/rates` | Актуальные курсы валют (НБРБ) |
| `POST` | `/files/upload` | Загрузка фото-чека (`multipart/form-data`) |

### Формат ответа на ошибку

```json
{
  "status": 400,
  "type": "Bad Request",
  "message": "Некорректные данные в запросе"
}
```

---

## 🚀 Запуск проекта

### Требования

- Java 21+
- Node.js 18+
- PostgreSQL 15+
- Keycloak 25+ (или Docker)
- Expo Go / Android Emulator / iOS Simulator

---

### 1. Бэкенд

#### 1.1 Поднять Keycloak (Docker)

```bash
docker run -d \
  --name keycloak \
  -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

Создайте realm `flowly`, client `flowly-backend` (confidential), настройте пользователей.

#### 1.2 База данных

```sql
CREATE DATABASE flowly;
```

#### 1.3 Конфигурация (`application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/flowly
    username: YOUR_USER
    password: YOUR_PASSWORD
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/flowly

keycloak:
  server-url: http://localhost:8180
  realm: flowly
  client-id: flowly-backend
  client-secret: YOUR_CLIENT_SECRET
```

#### 1.4 Запуск

```bash
cd backend-java
./mvnw spring-boot:run
```

Liquibase автоматически создаст все таблицы и заполнит справочные данные (категории, теги, курсы).

---

### 2. Мобильное приложение

#### 2.1 Установка зависимостей

```bash
cd Flowly
npm install
```

#### 2.2 Конфигурация API URL

Создайте файл `.env` в папке `Flowly/`:

```env
# iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1

# Android Emulator
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1

# Физическое устройство — укажите IP вашей машины
# EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api/v1
```

#### 2.3 Запуск

```bash
# Dev-сервер (Expo Go)
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

---

## 🗄 Схема базы данных

Схема управляется Liquibase-миграциями (`db/migration/`).

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи (связь с Keycloak через `keycloak_id`) |
| `accounts` | Счета (тип, валюта, баланс, иконка, цвет) |
| `categories` | Системные (`is_system`) и пользовательские категории (тип `INCOME`/`EXPENSE`, иерархия `parent_id`, иконка, цвет) |
| `user_categories` | Персональные настройки стандартных категорий пользователя (название, цвет, иконка, родитель, скрытие) |
| `operations` | Финансовые операции (сумма, тип, дата, заметка, место, фото) |
| `tags` | Системные (`is_system`) и пользовательские метки (название, цвет, иконка) |
| `user_tags` | Персональные настройки стандартных меток пользователя (название, цвет, иконка, скрытие) |
| `operation_tags` | M2M связь операций и тегов |
| `exchange_rates` | Кэш курсов валют (НБРБ) |
| `user_sessions` | JWT refresh-сессии |

> Таблицы `budgets`, `goals`, `crypto_assets`, `merchants`, `logs` созданы в схеме и зарезервированы для будущих фич.

### Ключевые особенности модели `Operation`

```
operation {
  id, account_id, category_id,
  amount, type (INCOME|EXPENSE|TRANSFER),
  currency, date_time,
  note, merchant, place,
  photo_url, is_pinned,
  related_account_id,  ← id счёта-получателя (для переводов)
  transfer_id,         ← id связанной операции (для переводов)
  updated_at
}
```

Переводы хранятся как **две отдельные операции**: одна EXPENSE на счёте-источнике, одна INCOME на счёте-получателе. Они связаны общим `transfer_id` и взаимными `related_account_id`. Клиент объединяет их в одну строку в истории.

---

## 👨‍💻 Автор

**Nexodex** — Full-Stack разработчик

- GitHub: [@JetPerl](https://github.com/JetPerl)

---

<div align="center">
  <sub>Сделано с ❤️ и ☕</sub>
</div>

