package com.flowly.api.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Integer getCurrentUserId() {
        Jwt jwt = getJwt();
        Object userIdClaim = jwt.getClaim("user_id");
        if (userIdClaim == null || userIdClaim.toString().isBlank()) {
            throw new IllegalStateException("В JWT токене отсутствует атрибут user_id");
        }
        return Integer.parseInt(userIdClaim.toString());
    }

    public static String getCurrentKeycloakId() {
        return getJwt().getSubject();
    }

    public static String getCurrentUserEmail() {
        Jwt jwt = getJwt();
        String email = jwt.getClaimAsString("email");
        return email != null ? email : jwt.getClaimAsString("preferred_username");
    }

    private static Jwt getJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt;
        }
        throw new IllegalStateException("Текущий пользователь не аутентифицирован через JWT");
    }
}
