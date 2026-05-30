package pe.aspropa.mercadolink.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mercadolinkOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MercadoLink B2B API")
                        .version("1.0.0")
                        .description("API REST del sistema MercadoLink/Aspropa (proyecto SOA). " +
                                "Integra Izipay como pasarela de pagos y expone los servicios " +
                                "para vendedores, proveedores, clientes mayoristas y administradores.")
                        .license(new License().name("Academic use").url("https://aspropa.example/")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
