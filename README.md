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
- 💳 Несколько счетов: карта, наличные, депозит, криптовалюта, инвестиции
- 💱 Мультивалютность: BYN, USD, EUR, RUB — с автоматической конвертацией через курсы НБРБ
- 📊 Общий баланс в основной валюте с разбивкой по типам счетов

### Категории и теги
- 🗂 100+ категорий с SVG-иконками и цветовой маркировкой
- 🏷 Теги для гибкой классификации операций
- 📁 Разделение на доходы и расходы

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
├── Flowly/                              # React Native / Expo
│   ├── app/
│   │   ├── _layout.tsx                 # Корневой layout (провайдеры, шрифты)
│   │   ├── (tabs)/
│   │   │   ├── index.tsx               # Главный экран (MainScreen)
│   │   │   ├── report.tsx              # Экран отчётов
│   │   │   └── profile/               # Профиль пользователя
│   │   │       ├── index.tsx
│   │   │       ├── edit-profile.tsx
│   │   │       ├── currency-list.tsx
│   │   │       └── security.tsx
│   │   ├── (modal)/
│   │   │   ├── transactions/new/       # Создание / редактирование операции
│   │   │   │   ├── index.tsx           # Основная форма
│   │   │   │   ├── category/           # Выбор категории
│   │   │   │   ├── account/            # Выбор счёта
│   │   │   │   ├── tags/               # Выбор тегов
│   │   │   │   ├── location.tsx        # Карта геолокации
│   │   │   │   ├── category-new.tsx    # Создание новой категории
│   │   │   │   └── account-new/        # Создание нового счёта
│   │   │   └── security-code/          # Экран PIN-кода
│   │   └── all-accounts.tsx            # Все счета
│   │
│   └── src/
│       ├── api/                        # HTTP-слой
│       │   ├── config.ts               # API_BASE_URL (EXPO_PUBLIC_API_URL)
│       │   ├── client.ts               # apiRequest<T>, uploadImageFile
│       │   ├── accounts.api.ts         # getAccounts()
│       │   ├── categories.api.ts       # getCategories(type?)
│       │   ├── operations.api.ts       # CRUD операций
│       │   ├── tags.api.ts             # getTags()
│       │   ├── rates.api.ts            # getRates()
│       │   ├── files.api.ts            # uploadOperationPhoto()
│       │   ├── auth.api.ts             # login, register, refresh, logout
│       │   └── index.ts
│       │
│       ├── types/                      # TypeScript DTO (зеркало Java-моделей)
│       │   ├── account.ts              # AccountResponse, AccountType
│       │   ├── category.ts             # CategoryDto, CategoryType
│       │   ├── operation.ts            # OperationResponse, OperationCreateRequest…
│       │   ├── tag.ts                  # TagDto
│       │   ├── auth.ts                 # AuthResponse, LoginRequest…
│       │   ├── rates.ts                # RatesMap
│       │   ├── common.ts              # ApiResponse, HttpErrorResponse
│       │   └── index.ts
│       │
│       ├── utils/                      # Чистые утилиты
│       │   ├── currency.ts             # Символы, конвертация, getRateToMain
│       │   ├── formatters.ts           # Дата/время, числа (ru-RU локаль)
│       │   ├── operationHelpers.ts     # Группировка операций по дням
│       │   └── index.ts
│       │
│       ├── components/
│       │   ├── CategoryIcon.tsx        # SVG-иконка категории
│       │   └── operations/
│       │       ├── OperationRow.tsx    # Универсальная строка операции
│       │       ├── OperationIcon.tsx   # Иконка операции (доход/расход/перевод)
│       │       ├── TransferIcon.tsx    # Двойная иконка перевода
│       │       └── HistorySectionHeader.tsx  # Заголовок секции (дата + итог)
│       │
│       ├── screens/
│       │   └── main/components/        # Компоненты главного экрана
│       │       ├── BalanceSlider.tsx
│       │       ├── AccountGroupsSummary.tsx
│       │       ├── QuickActions.tsx
│       │       ├── MonthlySpendingChart.tsx
│       │       ├── ExchangeRatesCard.tsx
│       │       └── HeroParallaxHeader.tsx
│       │
│       ├── security/                   # PIN + биометрия
│       │   └── SecurityCodeProvider.tsx
│       ├── context/                    # TransactionDraftContext
│       ├── currency/                   # CurrencyContext
│       ├── avatar/                     # AvatarContext
│       ├── location/                   # locationService.ts
│       ├── icons/                      # categoryIcons.ts (100+ SVG)
│       │
│       ├── MainScreen.tsx              # Главный экран (история + баланс)
│       ├── AllAccountsScreen.tsx       # Экран всех счетов
│       ├── ProfileScreen.tsx
│       ├── EditProfile.tsx
│       ├── CurrencyListScreen.tsx
│       └── SecurityList.tsx
│
└── backend-java/                       # Spring Boot
    └── src/main/java/com/flowly/api/
        ├── config/                     # RestClient, Swagger, WebMvc, OpenAPI
        ├── controller/                 # Интерфейсы контроллеров + impl/
        ├── service/                    # Бизнес-логика + impl/
        ├── model/
        │   ├── entity/                 # JPA-сущности (Operation, Account…)
        │   ├── dto/                    # DTO (AccountDto, CategoryDto…)
        │   ├── request/                # Запросы (Create, Patch, Login…)
        │   ├── response/               # Ответы (AccountResponse, AuthResponse…)
        │   └── enums/                  # AccountType, CategoryType, OperationType
        ├── mapper/                     # MapStruct-маппинги
        ├── security/                   # SecurityConfig, Keycloak JWT, EntryPoint
        ├── exception/                  # Доменные исключения
        ├── handler/                    # GlobalExceptionHandler
        └── utils/                      # SecurityUtils
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

### Счета

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/accounts` | Список счетов текущего пользователя |

### Категории

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/categories?type=EXPENSE\|INCOME` | Список категорий с фильтрацией по типу |

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

### Теги, Курсы, Файлы

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/tags` | Список тегов пользователя |
| `GET` | `/rates` | Актуальные курсы валют (НБРБ) |
| `POST` | `/files/upload` | Загрузка фото-чека (`multipart/form-data`) |

### Формат ответа на ошибку

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "timestamp": "2026-11-23T12:00:00Z"
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
| `categories` | Категории (тип INCOME/EXPENSE, иконка, цвет, пользователь) |
| `operations` | Финансовые операции (сумма, тип, дата, заметка, место, фото) |
| `tags` | Пользовательские теги |
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

**Ilya Burnos** — Full-Stack разработчик

- GitHub: [@ilaburnos](https://github.com/ilaburnos)

---

<div align="center">
  <sub>Сделано с ❤️ и ☕</sub>
</div>

