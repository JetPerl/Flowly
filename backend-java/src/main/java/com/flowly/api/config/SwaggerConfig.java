package com.flowly.api.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.OAuthFlow;
import io.swagger.v3.oas.annotations.security.OAuthFlows;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Flowly Finance API",
                description = "API для управления личными финансами",
                version = "1.0.0"
        ),
        security = @SecurityRequirement(name = "keycloak_oauth")
)
@SecurityScheme(
        name = "keycloak_oauth",
        type = SecuritySchemeType.OAUTH2,
        flows = @OAuthFlows(
                password = @OAuthFlow(
                        tokenUrl = "http://localhost:8180/realms/flowly/protocol/openid-connect/token",
                        refreshUrl = "http://localhost:8180/realms/flowly/protocol/openid-connect/token"
                )
        )
)
public class SwaggerConfig {
}
