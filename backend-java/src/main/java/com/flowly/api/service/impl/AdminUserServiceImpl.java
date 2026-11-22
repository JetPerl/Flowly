package com.flowly.api.service.impl;

import com.flowly.api.exception.BusinessValidationException;
import com.flowly.api.exception.ResourceNotFoundException;
import com.flowly.api.model.entity.User;
import com.flowly.api.repository.UserRepository;
import com.flowly.api.service.AdminUserService;
import com.flowly.api.utils.SecurityUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUserServiceImpl implements AdminUserService {

    final UserRepository userRepository;
    final RestClient restClient;

    @Value("${keycloak.server-url}")
    String serverUrl;

    @Value("${keycloak.realm}")
    String realm;

    @Value("${keycloak.client-id}")
    String clientId;

    @Value("${keycloak.client-secret}")
    String clientSecret;

    @Override
    @Transactional
    public void deleteUser(Integer userId) {
        Integer currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new BusinessValidationException("Администратор не может удалить собственный аккаунт");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с id " + userId + " не найден"));

        String keycloakId = user.getKeycloakId();
        String email = user.getEmail();

        userRepository.delete(user);
        userRepository.flush();

        if (keycloakId != null && !keycloakId.isBlank()) {
            deleteUserFromKeycloak(keycloakId);
        }

        log.info("Администратор (id={}) удалил пользователя id={}, email={}", currentUserId, userId, email);
    }

    private void deleteUserFromKeycloak(String keycloakUserId) {
        String adminToken = getServiceAccountToken();

        restClient.delete()
                .uri(serverUrl + "/admin/realms/" + realm + "/users/" + keycloakUserId)
                .header("Authorization", "Bearer " + adminToken)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    if (res.getStatusCode().value() == 404) {
                        log.warn("Пользователь с keycloakId={} уже отсутствует в Keycloak", keycloakUserId);
                        return;
                    }
                    throw new IllegalStateException("Ошибка Keycloak при удалении пользователя: " + res.getStatusCode());
                })
                .toBodilessEntity();
    }

    private String getServiceAccountToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        Map<?, ?> response = restClient.post()
                .uri(serverUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("Не удалось получить сервисный токен от Keycloak");
        }
        return response.get("access_token").toString();
    }
}
