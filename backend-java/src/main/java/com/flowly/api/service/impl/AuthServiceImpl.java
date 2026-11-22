package com.flowly.api.service.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowly.api.exception.ConflictException;
import com.flowly.api.model.entity.User;
import com.flowly.api.model.request.LoginRequest;
import com.flowly.api.model.request.LogoutRequest;
import com.flowly.api.model.request.RefreshTokenRequest;
import com.flowly.api.model.request.RegisterRequest;
import com.flowly.api.model.response.AuthResponse;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.AuthService;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Сервис управления процессами регистрации и входа пользователей через Keycloak.
 */

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    ObjectMapper objectMapper;
    RestClient restClient;
    String serverUrl;
    String realm;
    String clientId;
    String clientSecret;

    public AuthServiceImpl(
            UserRepository userRepository,
            ObjectMapper objectMapper,
            RestClient restClient,
            @Value("${keycloak.server-url}") String serverUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.client-id}") String clientId,
            @Value("${keycloak.client-secret}") String clientSecret
    ) {
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.restClient = restClient;
        this.serverUrl = serverUrl;
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Пользователь с адресом " + normalizedEmail + " уже зарегистрирован");
        }

        String adminToken = getServiceAccountToken();
        String keycloakUserId = createUserInKeycloak(adminToken, normalizedEmail, request.password());

        try {
            User user = User.builder()
                    .keycloakId(keycloakUserId)
                    .email(normalizedEmail)
                    .baseCurrency("USD")
                    .build();

            User savedUser = userRepository.save(user);
            setUserIdAttributeInKeycloak(adminToken, keycloakUserId, normalizedEmail, savedUser.getId());
            TokenResponse tokens = requestPasswordGrant(normalizedEmail, request.password());

            return new AuthResponse(
                    tokens.accessToken(),
                    tokens.refreshToken(),
                    tokens.expiresIn(),
                    savedUser.getId(),
                    savedUser.getEmail()
            );
        } catch (RuntimeException ex) {
            deleteUserFromKeycloakSafely(adminToken, keycloakUserId);
            throw ex;
        }
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        TokenResponse tokens;
        try {
            tokens = requestPasswordGrant(normalizedEmail, request.password());
        } catch (HttpClientErrorException e) {
            throw new BadCredentialsException("Неверный адрес электронной почты или пароль");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException("Пользователь найден в Keycloak, но отсутствует в локальной БД"));

        return new AuthResponse(
                tokens.accessToken(),
                tokens.refreshToken(),
                tokens.expiresIn(),
                user.getId(),
                user.getEmail()
        );
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        TokenResponse tokens;
        try {
            tokens = requestRefreshGrant(request.refreshToken());
        } catch (HttpClientErrorException e) {
            throw new BadCredentialsException("Недействительный или истекший refresh токен");
        }

        JwtClaims claims = extractClaimsFromAccessToken(tokens.accessToken());

        Integer userId = claims.userId();
        if (userId == null) {
            User user = userRepository.findByKeycloakId(claims.sub())
                    .orElseThrow(() -> new IllegalStateException("Не удалось определить пользователя по токену"));
            userId = user.getId();
        }

        String email = claims.email();
        if (email == null || email.isBlank()) {
            email = userRepository.findById(userId)
                    .map(User::getEmail)
                    .orElse("");
        }

        return new AuthResponse(
                tokens.accessToken(),
                tokens.refreshToken() != null ? tokens.refreshToken() : request.refreshToken(),
                tokens.expiresIn(),
                userId,
                email
        );
    }

    @Override
    public void logout(LogoutRequest request) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", request.refreshToken());

        try {
            restClient.post()
                    .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/logout")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 400 && responseBody.contains("invalid_grant")) {
                log.debug("Refresh токен уже отозван или истек при logout: {}", responseBody);
                return;
            }
            if (e.getStatusCode().value() == 401 || responseBody.contains("invalid_client")) {
                throw new IllegalStateException("Ошибка аутентификации клиента в Keycloak при logout: " + e.getStatusCode(), e);
            }
            throw new BadCredentialsException("Недействительный refresh токен для завершения сессии", e);
        }
    }

    private TokenResponse requestRefreshGrant(String refreshToken) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "refresh_token");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken);

        TokenResponse response = restClient.post()
                .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(TokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new IllegalStateException("Пустой ответ при обновлении токена из Keycloak");
        }
        return response;
    }

    private String getServiceAccountToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        TokenResponse response = restClient.post()
                .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(TokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new IllegalStateException("Не удалось получить сервисный токен от Keycloak");
        }
        return response.accessToken();
    }

    private TokenResponse requestPasswordGrant(String username, String password) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("username", username);
        form.add("password", password);

        TokenResponse response = restClient.post()
                .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(TokenResponse.class);

        if (response == null || response.accessToken() == null) {
            throw new IllegalStateException("Пустой ответ при получении токена из Keycloak");
        }
        return response;
    }

    private String createUserInKeycloak(String adminToken, String email, String password) {
        Map<String, Object> payload = Map.of(
                "username", email,
                "email", email,
                "firstName", email.split("@")[0],
                "lastName", "User",
                "enabled", true,
                "emailVerified", true,
                "requiredActions", List.of(),
                "credentials", List.of(Map.of(
                        "type", "password",
                        "value", password,
                        "temporary", false
                ))
        );

        ResponseEntity<Void> response;
        try {
            response = restClient.post()
                    .uri(serverUrl + "/admin/realms/" + realm + "/users")
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        if (res.getStatusCode().value() == 409) {
                            throw new ConflictException("Пользователь с таким адресом уже существует в Keycloak");
                        }
                        throw new IllegalStateException("Ошибка Keycloak при создании пользователя: " + res.getStatusCode());
                    })
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Conflict e) {
            throw new ConflictException("Пользователь с таким адресом уже существует в Keycloak");
        }

        URI location = response.getHeaders().getLocation();
        if (location == null) {
            throw new IllegalStateException("Keycloak не вернул Location с ID созданного пользователя");
        }
        String path = location.getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private void deleteUserFromKeycloakSafely(String adminToken, String keycloakUserId) {
        try {
            restClient.delete()
                    .uri(serverUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId)
                    .header("Authorization", "Bearer " + adminToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception cleanupEx) {
            log.warn("Не удалось откатить пользователя {} в Keycloak после ошибки регистрации", keycloakUserId, cleanupEx);
        }
    }

    private void setUserIdAttributeInKeycloak(String adminToken, String keycloakUserId, String email, Integer userId) {
        Map<String, Object> updatePayload = Map.of(
                "email", email,
                "firstName", email.split("@")[0],
                "lastName", "User",
                "enabled", true,
                "emailVerified", true,
                "attributes", Map.of("user_id", List.of(userId.toString()))
        );

        try {
            restClient.put()
                    .uri(serverUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId)
                    .header("Authorization", "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(updatePayload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Не удалось сохранить атрибут user_id в Keycloak для пользователя " + keycloakUserId,
                    ex
            );
        }
    }

    private record TokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("expires_in") Long expiresIn
    ) {}

    private JwtClaims extractClaimsFromAccessToken(String accessToken) {
        try {
            String[] parts = accessToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalStateException("Некорректный формат JWT токена");
            }
            byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> payload = objectMapper.readValue(decodedBytes, new TypeReference<>() {});

            String sub = payload.get("sub") != null ? payload.get("sub").toString() : null;
            String email = payload.get("email") != null
                    ? payload.get("email").toString()
                    : (payload.get("preferred_username") != null ? payload.get("preferred_username").toString() : null);

            Integer userId = null;
            Object rawUserId = payload.get("user_id");
            if (rawUserId != null && !rawUserId.toString().isBlank()) {
                userId = Integer.parseInt(rawUserId.toString());
            }

            return new JwtClaims(sub, email, userId);
        } catch (Exception e) {
            throw new IllegalStateException("Не удалось извлечь данные пользователя из обновленного токена", e);
        }
    }

    private record JwtClaims(String sub, String email, Integer userId) {}
}
