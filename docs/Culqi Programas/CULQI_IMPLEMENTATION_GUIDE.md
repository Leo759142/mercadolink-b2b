# Guía Técnica de Implementación - Culqi Integration

## Parte 1: Configuración y Setup

### 1.1 Actualizar pom.xml

Agregar después de `spring-security-test`:

```xml
<!-- HTTP Client para Culqi API -->
<dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.3.1</version>
</dependency>

<!-- Resilience4j para reintentos y circuit breaker -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.1.0</version>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-circuitbreaker</artifactId>
    <version>2.1.0</version>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-retry</artifactId>
    <version>2.1.0</version>
</dependency>

<!-- Redis para caché -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- Micrometer -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-core</artifactId>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### 1.2 Crear application-culqi-sandbox.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:file:./data/mercadolink-sandbox;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
  
  redis:
    host: localhost
    port: 6379

app:
  culqi:
    api-key: sk_test_xxxxxxxxxxxxx  # Test key from Culqi
    public-key: pk_test_xxxxxxxxxxxxx
    webhook-secret: whsec_test_xxxxx
    sandbox-mode: true
    base-url: https://api.culqi.com/v2
    request-timeout-ms: 30000
  
  webhook:
    retry:
      max-attempts: 5
      backoff-ms: 1000
      max-backoff-ms: 60000

logging:
  level:
    pe.aspropa.mercadolink.payment: DEBUG
```

---

## Parte 2: Modelos de Datos

### 2.1 Crear LogTransaccion.java

Ubicación: `src/main/java/pe/aspropa/mercadolink/domain/LogTransaccion.java`

```java
package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "log_transacciones", indexes = {
    @Index(name = "idx_order_id", columnList = "order_id", unique = true),
    @Index(name = "idx_culqi_txn_id", columnList = "culqi_transaction_id"),
    @Index(name = "idx_estado", columnList = "estado"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogTransaccion {
    
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();
    
    @Column(nullable = false, unique = true, length = 50)
    private String orderId;
    
    @Column(length = 50)
    private String culqiTransactionId;
    
    @Column(length = 50)
    private String culqiChargeId;
    
    @Column(length = 50)
    private String culqiOrderId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPago estado;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal monto;
    
    @Column(nullable = false, length = 3)
    private String moneda = "PEN";
    
    @Column(length = 50)
    private String metodoPago;  // VISA, AMEX, BILLETERA_DIGITAL, etc.
    
    @Column(length = 50)
    private String marcaTarjeta;  // visa, mastercard, amex
    
    @Column(length = 20)
    private String ultimosCuatroDigitos;
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String requestPayload;  // JSON completo del request
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String responsePayload;  // JSON completo de respuesta
    
    @Column(length = 10)
    private String codigoError;
    
    @Column(length = 500)
    private String mensajeError;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    private LocalDateTime webhookReceivedAt;
    private Integer webhookRetryCount = 0;
    
    @Column(length = 50)
    private String correlationId;  // Para trazabilidad
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
    
    // ========================
    // Métodos Auxiliares
    // ========================
    
    public void marcarAprobado(String culqiChargeId) {
        this.culqiChargeId = culqiChargeId;
        this.estado = EstadoPago.APROBADO;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void marcarRechazado(String codigo, String mensaje) {
        this.estado = EstadoPago.RECHAZADO;
        this.codigoError = codigo;
        this.mensajeError = mensaje;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void marcarProcesando() {
        this.estado = EstadoPago.PROCESANDO;
        this.updatedAt = LocalDateTime.now();
    }
}

// Enum para estados
public enum EstadoPago {
    PENDIENTE,
    PROCESANDO,
    APROBADO,
    RECHAZADO,
    REEMBOLSADO,
    TIMEOUT,
    ERROR
}
```

### 2.2 Crear WebhookEvent.java

```java
package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_events", indexes = {
    @Index(name = "idx_culqi_event_id", columnList = "culqi_event_id", unique = true),
    @Index(name = "idx_tipo", columnList = "tipo"),
    @Index(name = "idx_processed", columnList = "processed")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookEvent {
    
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();
    
    @Column(nullable = false, unique = true, length = 50)
    private String culqiEventId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoEventoWebhook tipo;
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String payload;
    
    private boolean processed = false;
    private boolean verified = false;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime receivedAt;
    
    private LocalDateTime processedAt;
    
    @Column(length = 500)
    private String processingError;
    
    private Integer retryCount = 0;
    
    @Column(length = 36)
    private String correlationId;
    
    public void marcarProcesado(LocalDateTime ahora) {
        this.processed = true;
        this.processedAt = ahora;
    }
    
    public void marcarError(String error) {
        this.processingError = error;
        this.retryCount++;
    }
}

public enum TipoEventoWebhook {
    CHARGE_COMPLETED,
    CHARGE_FAILED,
    CHARGE_REFUNDED,
    CHARGE_PENDING,
    CHARGE_AUTHORIZED,
    UNKNOWN
    
    ;
    
    public static TipoEventoWebhook fromCulqi(String culqiType) {
        return switch (culqiType) {
            case "charge.completed" -> CHARGE_COMPLETED;
            case "charge.failed" -> CHARGE_FAILED;
            case "charge.refunded" -> CHARGE_REFUNDED;
            case "charge.pending" -> CHARGE_PENDING;
            case "charge.authorized" -> CHARGE_AUTHORIZED;
            default -> UNKNOWN;
        };
    }
}
```

### 2.3 Crear ConfiguracionCulqi.java

```java
package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "configuracion_culqi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionCulqi {
    
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Entorno entorno;
    
    @Column(nullable = false, length = 100)
    private String apiKey;  // Encrypted
    
    @Column(nullable = false, length = 100)
    private String publicKey;
    
    @Column(nullable = false, length = 100)
    private String webhookSecret;  // Encrypted
    
    @Column(length = 500)
    private String webhookUrl;
    
    private boolean activo = true;
    
    private LocalDateTime ultimaVerificacion;
    private boolean statusVerificado = false;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

public enum Entorno {
    SANDBOX,
    PRODUCCION
}
```

---

## Parte 3: Servicios Principales

### 3.1 Crear CulqiService.java

```java
package pe.aspropa.mercadolink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import pe.aspropa.mercadolink.domain.EstadoPago;
import pe.aspropa.mercadolink.domain.LogTransaccion;
import pe.aspropa.mercadolink.exception.BusinessException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class CulqiService {
    
    private final String apiKey;
    private final String publicKey;
    private final String webhookSecret;
    private final String baseUrl;
    private final boolean sandboxMode;
    private final long requestTimeoutMs;
    private final ObjectMapper objectMapper;
    
    private HttpClient httpClient;
    
    public CulqiService(
            @Value("${app.culqi.api-key}") String apiKey,
            @Value("${app.culqi.public-key}") String publicKey,
            @Value("${app.culqi.webhook-secret}") String webhookSecret,
            @Value("${app.culqi.base-url}") String baseUrl,
            @Value("${app.culqi.sandbox-mode:true}") boolean sandboxMode,
            @Value("${app.culqi.request-timeout-ms:30000}") long requestTimeoutMs,
            ObjectMapper objectMapper) {
        
        this.apiKey = apiKey;
        this.publicKey = publicKey;
        this.webhookSecret = webhookSecret;
        this.baseUrl = baseUrl;
        this.sandboxMode = sandboxMode;
        this.requestTimeoutMs = requestTimeoutMs;
        this.objectMapper = objectMapper;
    }
    
    @PostConstruct
    public void init() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(requestTimeoutMs))
                .build();
    }
    
    /**
     * Crea un token de pago en Culqi
     * Retorna el token para el frontend y el ID de transacción para backend
     */
    public PaymentTokenResponse createPaymentToken(
            String orderId,
            BigDecimal amount,
            String currency,
            String email,
            String firstName,
            String lastName) {
        
        try {
            log.info("Creando payment token para orderId={}, monto={} {}", 
                    orderId, amount, currency);
            
            // Convertir a centavos (Culqi trabaja en centavos)
            Long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();
            
            // Construir payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amountInCents);
            payload.put("currency_code", currency.toUpperCase());
            payload.put("email", email);
            payload.put("description", "Compra en MercadoLink");
            payload.put("order_id", orderId);
            
            // Client info
            Map<String, String> client = new HashMap<>();
            client.put("email", email);
            client.put("first_name", firstName);
            client.put("last_name", lastName);
            payload.put("client", client);
            
            // Metadata
            Map<String, String> metadata = new HashMap<>();
            metadata.put("order_id", orderId);
            metadata.put("source", "mercadolink-b2b");
            payload.put("metadata", metadata);
            
            String payloadJson = objectMapper.writeValueAsString(payload);
            
            // Hacer request a Culqi
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/charges"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
            
            log.debug("Culqi response status: {} body: {}", 
                    response.statusCode(), response.body());
            
            if (response.statusCode() >= 400) {
                throw new BusinessException("EX-CULQI-001",
                        "Error en Culqi API: " + response.body());
            }
            
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
            
            String chargeId = (String) data.get("id");
            String token = (String) data.get("token");  // Culqi envía token en response
            
            log.info("Payment token creado: chargeId={}, token={}", chargeId, token);
            
            return PaymentTokenResponse.builder()
                    .chargeId(chargeId)
                    .token(token != null ? token : "immediate-charge-" + chargeId)
                    .publicKey(publicKey)
                    .orderId(orderId)
                    .amountInCents(amountInCents)
                    .currency(currency)
                    .build();
            
        } catch (Exception e) {
            log.error("Error creando payment token: {}", e.getMessage(), e);
            throw new BusinessException("EX-CULQI-002",
                    "No se pudo crear token de pago: " + e.getMessage());
        }
    }
    
    /**
     * Obtiene el estado actual de una transacción en Culqi
     */
    public TransactionStatusResponse getTransactionStatus(String chargeId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/charges/" + chargeId))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();
            
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 400) {
                throw new BusinessException("EX-CULQI-003",
                        "Error consultando transacción en Culqi");
            }
            
            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            Map<String, Object> data = (Map<String, Object>) responseMap.get("data");
            
            String status = (String) data.get("status");
            EstadoPago estado = mapCulqiStatusToEstadoPago(status);
            
            return TransactionStatusResponse.builder()
                    .chargeId(chargeId)
                    .status(status)
                    .estado(estado)
                    .amount((Integer) data.get("amount"))
                    .build();
            
        } catch (Exception e) {
            log.error("Error consultando transacción {}: {}", chargeId, e.getMessage());
            throw new BusinessException("EX-CULQI-004",
                    "No se pudo consultar transacción");
        }
    }
    
    /**
     * Valida la firma HMAC-SHA256 de un webhook
     */
    public boolean isValidWebhookSignature(String payload, String signature) {
        try {
            String computedSignature = signPayload(payload);
            boolean isValid = computedSignature.equalsIgnoreCase(signature);
            
            if (!isValid) {
                log.warn("Webhook signature mismatch. Computed: {}, Received: {}",
                        computedSignature, signature);
            }
            
            return isValid;
        } catch (Exception e) {
            log.error("Error validando firma de webhook: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Genera firma HMAC-SHA256 para payload
     */
    public String signPayload(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));
            
            byte[] hashBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error firmando payload", e);
        }
    }
    
    /**
     * Procesa un refund
     */
    public void refundTransaction(String chargeId, BigDecimal amount) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("charge_id", chargeId);
            if (amount != null) {
                payload.put("amount", amount.multiply(BigDecimal.valueOf(100)).longValue());
            }
            
            String payloadJson = objectMapper.writeValueAsString(payload);
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/refunds"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                    .build();
            
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 400) {
                throw new BusinessException("EX-CULQI-005",
                        "Error procesando refund en Culqi");
            }
            
            log.info("Refund procesado para charge: {}", chargeId);
            
        } catch (Exception e) {
            log.error("Error en refund: {}", e.getMessage());
            throw new BusinessException("EX-CULQI-006",
                    "No se pudo procesar refund");
        }
    }
    
    // ========================
    // Helper Methods
    // ========================
    
    private EstadoPago mapCulqiStatusToEstadoPago(String culqiStatus) {
        return switch (culqiStatus) {
            case "completed" -> EstadoPago.APROBADO;
            case "pending" -> EstadoPago.PROCESANDO;
            case "failed" -> EstadoPago.RECHAZADO;
            case "refunded" -> EstadoPago.REEMBOLSADO;
            default -> EstadoPago.PENDIENTE;
        };
    }
    
    public boolean isSandboxMode() {
        return sandboxMode;
    }
    
    public String getPublicKey() {
        return publicKey;
    }
    
    // ========================
    // DTOs
    // ========================
    
    @lombok.Data
    @lombok.Builder
    public static class PaymentTokenResponse {
        private String chargeId;
        private String token;
        private String publicKey;
        private String orderId;
        private Long amountInCents;
        private String currency;
    }
    
    @lombok.Data
    @lombok.Builder
    public static class TransactionStatusResponse {
        private String chargeId;
        private String status;
        private EstadoPago estado;
        private Integer amount;
    }
}
```

### 3.2 Crear WebhookRetryService.java

```java
package pe.aspropa.mercadolink.service;

import io.github.resilience4j.core.registry.EntryAddedEvent;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.aspropa.mercadolink.domain.WebhookEvent;
import pe.aspropa.mercadolink.repository.WebhookEventRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.function.Function;

@Slf4j
@Service
public class WebhookRetryService {
    
    private final WebhookEventRepository webhookEventRepository;
    private final PagoService pagoService;
    private final RetryRegistry retryRegistry;
    
    @Value("${app.webhook.retry.max-attempts:5}")
    private int maxAttempts;
    
    @Value("${app.webhook.retry.backoff-ms:1000}")
    private long backoffMs;
    
    @Value("${app.webhook.retry.max-backoff-ms:300000}")
    private long maxBackoffMs;
    
    public WebhookRetryService(
            WebhookEventRepository webhookEventRepository,
            PagoService pagoService,
            RetryRegistry retryRegistry) {
        this.webhookEventRepository = webhookEventRepository;
        this.pagoService = pagoService;
        this.retryRegistry = retryRegistry;
    }
    
    /**
     * Procesa un webhook con reintentos automáticos
     */
    public void processWithRetry(WebhookEvent event, Function<WebhookEvent, Void> processor) {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(maxAttempts)
                .waitDuration(Duration.ofMillis(backoffMs))
                .intervalFunction(io.github.resilience4j.core.IntervalFunction
                        .ofExponentialBackoff(backoffMs, 2))
                .retryOnException(e -> !(e instanceof IllegalArgumentException))
                .build();
        
        Retry retry = Retry.of("webhook-" + event.getId(), config);
        
        retry.getEventPublisher()
                .onSuccess(event1 -> {
                    log.info("Webhook procesado exitosamente: {}", event.getCulqiEventId());
                    event.marcarProcesado(LocalDateTime.now());
                    webhookEventRepository.save(event);
                })
                .onError(event1 -> {
                    log.error("Webhook falló después de {} intentos: {}",
                            event1.getNumberOfAttempts(), event.getCulqiEventId());
                    event.marcarError(event1.getLastThrowable().getMessage());
                    webhookEventRepository.save(event);
                    
                    // Alertar si muchos fallos
                    if (event.getRetryCount() >= maxAttempts) {
                        alertarFalloWebhook(event);
                    }
                });
        
        try {
            Retry.decorateFunction(retry, processor).apply(event);
        } catch (Exception e) {
            log.error("Error procesando webhook con reintentos: {}", e.getMessage());
        }
    }
    
    private void alertarFalloWebhook(WebhookEvent event) {
        log.error("ALERTA: Webhook {} falló múltiples veces. Requeiere intervención manual",
                event.getCulqiEventId());
        // Aquí implementar alertas (email, Slack, etc.)
    }
}
```

---

## Parte 4: Controladores

### 4.1 Crear CulqiWebhookController.java

```java
package pe.aspropa.mercadolink.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.dto.CulqiWebhookRequest;
import pe.aspropa.mercadolink.domain.WebhookEvent;
import pe.aspropa.mercadolink.domain.TipoEventoWebhook;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.WebhookEventRepository;
import pe.aspropa.mercadolink.service.CulqiService;
import pe.aspropa.mercadolink.service.PagoService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/culqi")
@Tag(name = "Culqi", description = "Webhooks y endpoints públicos de Culqi")
public class CulqiWebhookController {
    
    private final CulqiService culqiService;
    private final PagoService pagoService;
    private final WebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;
    
    public CulqiWebhookController(
            CulqiService culqiService,
            PagoService pagoService,
            WebhookEventRepository webhookEventRepository,
            ObjectMapper objectMapper) {
        this.culqiService = culqiService;
        this.pagoService = pagoService;
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
    }
    
    @PostMapping("/webhook")
    @Operation(summary = "Recibe webhooks de Culqi; responde inmediatamente con 202 Accepted")
    public ResponseEntity<Map<String, Object>> webhook(
            @RequestBody String rawPayload,
            @RequestHeader(name = "X-Culqi-Signature") String signature,
            @RequestHeader(name = "X-Culqi-Request-ID") String culqiEventId,
            @RequestHeader(name = "X-Culqi-Delivery-ID", required = false) String deliveryId) {
        
        try {
            log.info("Webhook recibido de Culqi. EventID: {}", culqiEventId);
            
            // 1. VALIDAR FIRMA inmediatamente
            if (!culqiService.isValidWebhookSignature(rawPayload, signature)) {
                log.warn("Firma de webhook inválida. EventID: {}", culqiEventId);
                return ResponseEntity.status(401).body(Map.of(
                        "error", "INVALID_SIGNATURE",
                        "message", "Webhook signature validation failed"
                ));
            }
            
            // 2. PARSEAR PAYLOAD
            CulqiWebhookRequest request = objectMapper.readValue(rawPayload, CulqiWebhookRequest.class);
            
            // 3. VALIDAR TIMESTAMP (±5 minutos)
            if (!isValidTimestamp(request.getCreatedAt())) {
                log.warn("Timestamp de webhook fuera de rango. EventID: {}", culqiEventId);
                return ResponseEntity.status(401).body(Map.of(
                        "error", "INVALID_TIMESTAMP",
                        "message", "Webhook timestamp outside acceptable range"
                ));
            }
            
            // 4. VERIFICAR IDEMPOTENCIA
            if (webhookEventRepository.existsByCulqiEventId(culqiEventId)) {
                log.info("Webhook duplicado (ya procesado). EventID: {}", culqiEventId);
                return ResponseEntity.accepted().body(Map.of(
                        "status", "RECEIVED",
                        "message", "Webhook already processed",
                        "event_id", culqiEventId
                ));
            }
            
            // 5. GUARDAR EVENT (sin procesar aún)
            WebhookEvent event = WebhookEvent.builder()
                    .culqiEventId(culqiEventId)
                    .tipo(TipoEventoWebhook.fromCulqi(request.getType()))
                    .payload(rawPayload)
                    .verified(true)
                    .processed(false)
                    .receivedAt(LocalDateTime.now())
                    .retryCount(0)
                    .build();
            
            webhookEventRepository.save(event);
            
            // 6. RETORNAR 202 ACCEPTED INMEDIATAMENTE
            // (Culqi requiere respuesta en < 2 segundos)
            log.info("Webhook 202 Accepted. EventID: {}", culqiEventId);
            
            // 7. INICIAR PROCESAMIENTO ASYNC EN BACKGROUND
            pagoService.procesarWebhookAsync(event);
            
            return ResponseEntity.accepted().body(Map.of(
                    "status", "RECEIVED",
                    "event_id", culqiEventId,
                    "message", "Processing in background"
            ));
            
        } catch (Exception e) {
            log.error("Error en webhook handler: {}", e.getMessage(), e);
            return ResponseEntity.accepted().body(Map.of(
                    "status", "RECEIVED",
                    "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/firmar")
    @Operation(summary = "[SANDBOX ONLY] Genera firma HMAC válida para testing")
    public ResponseEntity<Map<String, String>> firmar(@RequestBody Map<String, String> body) {
        if (!culqiService.isSandboxMode()) {
            throw BusinessException.forbidden("EX-AUTH-002",
                    "Esta función solo está disponible en modo sandbox");
        }
        
        String payload = body.getOrDefault("payload", "");
        String signature = culqiService.signPayload(payload);
        
        return ResponseEntity.ok(Map.of(
                "payload", payload,
                "signature", signature
        ));
    }
    
    // ========================
    // Helper Methods
    // ========================
    
    private boolean isValidTimestamp(Long createdAtSeconds) {
        if (createdAtSeconds == null) {
            return false;
        }
        
        LocalDateTime culqiTime = LocalDateTime.ofEpochSecond(
                createdAtSeconds,
                0,
                ZoneId.systemDefault().getRules().getOffset(LocalDateTime.now())
        );
        
        LocalDateTime now = LocalDateTime.now();
        Duration diff = java.time.Duration.between(culqiTime, now);
        
        // Aceptar timestamps dentro de ±5 minutos
        return Math.abs(diff.toSeconds()) <= 300;
    }
}
```

---

## Parte 5: DTOs

### 5.1 Crear CulqiWebhookRequest.java

```java
package pe.aspropa.mercadolink.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CulqiWebhookRequest {
    
    @JsonProperty("id")
    private String id;  // Event ID
    
    @JsonProperty("type")
    private String type;  // charge.completed, charge.failed, etc.
    
    @JsonProperty("created_at")
    private Long createdAt;  // Unix timestamp
    
    @JsonProperty("data")
    private WebhookData data;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WebhookData {
        
        @JsonProperty("id")
        private String chargeId;
        
        @JsonProperty("object")
        private String object;  // "charge"
        
        @JsonProperty("amount")
        private Integer amount;  // En centavos
        
        @JsonProperty("currency_code")
        private String currencyCode;
        
        @JsonProperty("order_id")
        private String orderId;
        
        @JsonProperty("status")
        private String status;  // completed, failed, pending, refunded
        
        @JsonProperty("fee")
        private Integer fee;
        
        @JsonProperty("net")
        private Integer net;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("created_at")
        private Long createdAt;
        
        @JsonProperty("email")
        private String email;
        
        @JsonProperty("metadata")
        private java.util.Map<String, Object> metadata;
    }
}
```

---

## Parte 6: Repositories

### 6.1 Crear LogTransaccionRepository.java

```java
package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.aspropa.mercadolink.domain.LogTransaccion;
import pe.aspropa.mercadolink.domain.EstadoPago;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LogTransaccionRepository extends JpaRepository<LogTransaccion, String> {
    
    Optional<LogTransaccion> findByOrderId(String orderId);
    
    Optional<LogTransaccion> findByCulqiChargeId(String culqiChargeId);
    
    List<LogTransaccion> findByEstado(EstadoPago estado);
    
    List<LogTransaccion> findByEstadoAndCreatedAtAfter(EstadoPago estado, LocalDateTime desde);
    
    @Query("SELECT lt FROM LogTransaccion lt WHERE lt.estado = 'PENDIENTE' AND lt.createdAt < ?1")
    List<LogTransaccion> findTransactionsPendingMoreThan(LocalDateTime threshold);
    
    @Query("SELECT COUNT(lt) FROM LogTransaccion lt WHERE lt.estado = ?1 AND lt.createdAt >= ?2")
    Long countByEstadoAfter(EstadoPago estado, LocalDateTime desde);
}
```

### 6.2 Crear WebhookEventRepository.java

```java
package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.WebhookEvent;

import java.util.List;
import java.util.Optional;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, String> {
    
    Optional<WebhookEvent> findByCulqiEventId(String culqiEventId);
    
    boolean existsByCulqiEventId(String culqiEventId);
    
    List<WebhookEvent> findByProcessedFalseOrderByReceivedAtAsc();
    
    List<WebhookEvent> findByProcessedFalseAndRetryCountLessThan(Integer maxRetries);
}
```

---

Este es el código de base para la implementación. Continúa en los siguientes archivos...

