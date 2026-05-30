package pe.aspropa.mercadolink.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "Endpoints de salud y bienvenida")
public class HealthController {

    @GetMapping
    @Operation(summary = "Endpoint raíz API")
    public Map<String, Object> root() {
        return Map.of(
                "service", "MercadoLink B2B API",
                "version", "1.0.0",
                "docs", "/swagger-ui.html",
                "h2", "/h2-console",
                "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/health")
    @Operation(summary = "Health check liviano")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}