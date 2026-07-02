# Guía de Configuración y Testing - Culqi Integration

## Parte 7: Configuración de Bases de Datos

### 7.1 Migration Flyway para LogTransaccion

**Archivo:** `src/main/resources/db/migration/V003__create_log_transacciones.sql`

```sql
-- Crear tabla log_transacciones
CREATE TABLE log_transacciones (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    culqi_transaction_id VARCHAR(50),
    culqi_charge_id VARCHAR(50),
    culqi_order_id VARCHAR(50),
    estado VARCHAR(20) NOT NULL,
    monto DECIMAL(19, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    metodo_pago VARCHAR(50),
    marca_tarjeta VARCHAR(50),
    ultimos_cuatro_digitos VARCHAR(20),
    request_payload TEXT,
    response_payload TEXT,
    codigo_error VARCHAR(10),
    mensaje_error VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    webhook_received_at TIMESTAMP,
    webhook_retry_count INT DEFAULT 0,
    correlation_id VARCHAR(50),
    pedido_id BIGINT,
    
    CONSTRAINT fk_log_transacciones_pedido 
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    
    CONSTRAINT idx_order_id UNIQUE (order_id),
    INDEX idx_culqi_txn_id (culqi_transaction_id),
    INDEX idx_estado (estado),
    INDEX idx_created_at (created_at),
    INDEX idx_webhook_retry (webhook_retry_count),
    INDEX idx_created_estado (created_at, estado)
);

-- Crear tabla webhook_events
CREATE TABLE webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    culqi_event_id VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL,
    payload LONGTEXT,
    processed BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    processing_error VARCHAR(500),
    retry_count INT DEFAULT 0,
    correlation_id VARCHAR(36),
    
    INDEX idx_culqi_event_id (culqi_event_id),
    INDEX idx_tipo (tipo),
    INDEX idx_processed (processed),
    INDEX idx_received_at (received_at)
);

-- Crear tabla configuracion_culqi
CREATE TABLE configuracion_culqi (
    id VARCHAR(36) PRIMARY KEY,
    entorno VARCHAR(20) NOT NULL,
    api_key VARCHAR(100) NOT NULL,
    public_key VARCHAR(100) NOT NULL,
    webhook_secret VARCHAR(100) NOT NULL,
    webhook_url VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE,
    ultima_verificacion TIMESTAMP,
    status_verificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    UNIQUE INDEX idx_entorno (entorno),
    INDEX idx_activo (activo)
);

-- Crear tabla para auditoría de webhooks
CREATE TABLE webhook_audit (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    procesado_en_ms INT,
    error_detalle TEXT,
    attempt_number INT,
    created_at TIMESTAMP NOT NULL,
    
    INDEX idx_event_id (event_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### 7.2 Índices Adicionales para Performance

```sql
-- Índices para consultas frecuentes
CREATE INDEX idx_lt_estado_created ON log_transacciones(estado, created_at DESC);
CREATE INDEX idx_lt_pedido_estado ON log_transacciones(pedido_id, estado);
CREATE INDEX idx_lt_correlacion ON log_transacciones(correlation_id);

-- Índices para webhooks
CREATE INDEX idx_we_tipo_processed ON webhook_events(tipo, processed);
CREATE INDEX idx_we_retry_count ON webhook_events(retry_count, processed);

-- Índices para auditoría
CREATE INDEX idx_wa_event_attempt ON webhook_audit(event_id, attempt_number);
```

---

## Parte 8: Configuración de Seguridad

### 8.1 Encryption Service

**Archivo:** `src/main/java/pe/aspropa/mercadolink/security/EncryptionService.java`

```java
package pe.aspropa.mercadolink.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Slf4j
@Service
public class EncryptionService {
    
    private final String encryptionKey;
    
    public EncryptionService(@Value("${app.encryption.key}") String encryptionKey) {
        this.encryptionKey = encryptionKey;
    }
    
    /**
     * Encripta una cadena sensible
     */
    public String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance("AES");
            SecretKey key = new SecretKeySpec(
                    encryptionKey.getBytes(0, 16),
                    0, 16,
                    "AES"
            );
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            log.error("Error encriptando dato: {}", e.getMessage());
            throw new RuntimeException("Encryption failed", e);
        }
    }
    
    /**
     * Desencripta una cadena
     */
    public String decrypt(String encryptedText) {
        try {
            Cipher cipher = Cipher.getInstance("AES");
            SecretKey key = new SecretKeySpec(
                    encryptionKey.getBytes(0, 16),
                    0, 16,
                    "AES"
            );
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            return new String(decryptedBytes);
        } catch (Exception e) {
            log.error("Error desencriptando dato: {}", e.getMessage());
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
```

### 8.2 SecurityConfig Updates

```java
// En SecurityConfig.java

@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf()
            .ignoringRequestMatchers("/api/v1/culqi/webhook")  // Webhooks no CSRF
            .and()
        .authorizeHttpRequests()
            .requestMatchers("/api/v1/culqi/webhook").permitAll()  // Público
            .requestMatchers("/api/v1/culqi/firmar").permitAll()   // Sandbox only
            .requestMatchers("/api/v1/pagos/**").authenticated()    // Protegido
            .anyRequest().authenticated()
            .and()
        .httpBasic()
            .and()
        .sessionManagement()
            .sessionFixationProtection(SessionFixationProtection.MIGRATE_SESSION);
    
    return http.build();
}
```

---

## Parte 9: Testing Completo

### 9.1 Test Unitarios - CulqiServiceTest.java

```java
package pe.aspropa.mercadolink.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.aspropa.mercadolink.exception.BusinessException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CulqiServiceTest {
    
    private CulqiService culqiService;
    private ObjectMapper objectMapper;
    
    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        culqiService = new CulqiService(
                "sk_test_xxxxx",
                "pk_test_xxxxx",
                "whsec_test_xxxxx",
                "https://api.culqi.com/v2",
                true,  // sandbox
                30000,
                objectMapper
        );
        culqiService.init();
    }
    
    @Test
    void testSignPayload() {
        String payload = "test-payload";
        String signature = culqiService.signPayload(payload);
        
        assertNotNull(signature);
        assertTrue(signature.length() > 0);
        assertTrue(signature.matches("[a-f0-9]+"));  // Hex format
    }
    
    @Test
    void testValidWebhookSignature() {
        String payload = "test-payload";
        String signature = culqiService.signPayload(payload);
        
        boolean isValid = culqiService.isValidWebhookSignature(payload, signature);
        assertTrue(isValid);
    }
    
    @Test
    void testInvalidWebhookSignature() {
        String payload = "test-payload";
        String wrongSignature = "invalid-signature";
        
        boolean isValid = culqiService.isValidWebhookSignature(payload, wrongSignature);
        assertFalse(isValid);
    }
    
    @Test
    void testIsSandboxMode() {
        assertTrue(culqiService.isSandboxMode());
    }
}
```

### 9.2 Test Integración - CulqiWebhookIntegrationTest.java

```java
package pe.aspropa.mercadolink.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import pe.aspropa.mercadolink.dto.CulqiWebhookRequest;
import pe.aspropa.mercadolink.service.CulqiService;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CulqiWebhookIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private CulqiService culqiService;
    
    @Test
    void testWebhookWithValidSignature() throws Exception {
        // Preparar payload
        CulqiWebhookRequest.WebhookData data = CulqiWebhookRequest.WebhookData.builder()
                .chargeId("chrg_test_123")
                .amount(50000)
                .currencyCode("PEN")
                .orderId("order-test-123")
                .status("completed")
                .build();
        
        CulqiWebhookRequest request = CulqiWebhookRequest.builder()
                .id("evt_test_123")
                .type("charge.completed")
                .createdAt(System.currentTimeMillis() / 1000)
                .data(data)
                .build();
        
        String payload = objectMapper.writeValueAsString(request);
        String signature = culqiService.signPayload(payload);
        
        // Ejecutar request
        mockMvc.perform(post("/api/v1/culqi/webhook")
                .contentType("application/json")
                .header("X-Culqi-Signature", signature)
                .header("X-Culqi-Request-ID", "evt_test_123")
                .header("X-Culqi-Delivery-ID", "delivery_123")
                .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("RECEIVED"))
                .andExpect(jsonPath("$.event_id").value("evt_test_123"));
    }
    
    @Test
    void testWebhookWithInvalidSignature() throws Exception {
        String payload = "{\"invalid\": \"payload\"}";
        String wrongSignature = "invalid_signature";
        
        mockMvc.perform(post("/api/v1/culqi/webhook")
                .contentType("application/json")
                .header("X-Culqi-Signature", wrongSignature)
                .header("X-Culqi-Request-ID", "evt_test_456")
                .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_SIGNATURE"));
    }
    
    @Test
    void testWebhookIdempotency() throws Exception {
        // Primera llamada - debe aceptarse
        CulqiWebhookRequest request = createTestWebhook("evt_dup_123", "charge.completed");
        String payload = objectMapper.writeValueAsString(request);
        String signature = culqiService.signPayload(payload);
        
        mockMvc.perform(post("/api/v1/culqi/webhook")
                .contentType("application/json")
                .header("X-Culqi-Signature", signature)
                .header("X-Culqi-Request-ID", "evt_dup_123")
                .content(payload))
                .andExpect(status().isAccepted());
        
        // Segunda llamada - debe detectar duplicado
        mockMvc.perform(post("/api/v1/culqi/webhook")
                .contentType("application/json")
                .header("X-Culqi-Signature", signature)
                .header("X-Culqi-Request-ID", "evt_dup_123")
                .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value(containsString("already processed")));
    }
    
    private CulqiWebhookRequest createTestWebhook(String eventId, String type) {
        CulqiWebhookRequest.WebhookData data = CulqiWebhookRequest.WebhookData.builder()
                .chargeId("chrg_" + eventId)
                .amount(50000)
                .currencyCode("PEN")
                .orderId("order-" + eventId)
                .status("completed")
                .createdAt(System.currentTimeMillis() / 1000)
                .build();
        
        return CulqiWebhookRequest.builder()
                .id(eventId)
                .type(type)
                .createdAt(System.currentTimeMillis() / 1000)
                .data(data)
                .build();
    }
}
```

### 9.3 Test Load - LoadTestCulqiWebhook.java

```java
package pe.aspropa.mercadolink.load;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import pe.aspropa.mercadolink.dto.CulqiWebhookRequest;
import pe.aspropa.mercadolink.service.CulqiService;

import java.util.concurrent.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LoadTestCulqiWebhook {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private CulqiService culqiService;
    
    @Test
    void testConcurrentWebhooks_100Events() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(100);
        
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < 100; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    CulqiWebhookRequest request = createTestWebhook("evt_load_" + index);
                    String payload = objectMapper.writeValueAsString(request);
                    String signature = culqiService.signPayload(payload);
                    
                    mockMvc.perform(post("/api/v1/culqi/webhook")
                            .contentType("application/json")
                            .header("X-Culqi-Signature", signature)
                            .header("X-Culqi-Request-ID", "evt_load_" + index)
                            .content(payload))
                            .andExpect(status().isAccepted());
                    
                } catch (Exception e) {
                    System.err.println("Error en webhook " + index + ": " + e.getMessage());
                } finally {
                    latch.countDown();
                }
            });
        }
        
        boolean completed = latch.await(60, TimeUnit.SECONDS);
        long duration = System.currentTimeMillis() - startTime;
        
        System.out.println("100 webhooks procesados en " + duration + "ms");
        System.out.println("Promedio: " + (duration / 100) + "ms por webhook");
        
        assert completed : "No todos los webhooks se completaron en el tiempo límite";
    }
    
    private CulqiWebhookRequest createTestWebhook(String eventId) {
        CulqiWebhookRequest.WebhookData data = CulqiWebhookRequest.WebhookData.builder()
                .chargeId("chrg_" + eventId)
                .amount(50000)
                .currencyCode("PEN")
                .orderId("order-" + eventId)
                .status("completed")
                .createdAt(System.currentTimeMillis() / 1000)
                .build();
        
        return CulqiWebhookRequest.builder()
                .id(eventId)
                .type("charge.completed")
                .createdAt(System.currentTimeMillis() / 1000)
                .data(data)
                .build();
    }
}
```

---

## Parte 10: Scripts de Testing Manual

### 10.1 Test Webhook con curl

**Archivo:** `scripts/test-culqi-webhook.sh`

```bash
#!/bin/bash

# Script para testear webhooks de Culqi con signatures válidas

API_URL="http://localhost:8080/api/v1/culqi"
WEBHOOK_SECRET="whsec_test_xxxxx"  # Del application-culqi-sandbox.yml

# Test 1: Webhook válido (charge.completed)
echo "=== Test 1: Valid Webhook (charge.completed) ==="

PAYLOAD='{
  "id": "evt_test_001",
  "type": "charge.completed",
  "created_at": '$(date +%s)',
  "data": {
    "id": "chrg_test_001",
    "amount": 50000,
    "currency_code": "PEN",
    "order_id": "order-test-001",
    "status": "completed",
    "fee": 1500,
    "net": 48500
  }
}'

# Generar firma (usando endpoint de helper en sandbox)
SIGNATURE=$(curl -s -X POST "$API_URL/firmar" \
  -H "Content-Type: application/json" \
  -d "{\"payload\": \"$PAYLOAD\"}" | jq -r '.signature')

echo "Payload: $PAYLOAD"
echo "Signature: $SIGNATURE"

# Enviar webhook
curl -X POST "$API_URL/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Culqi-Signature: $SIGNATURE" \
  -H "X-Culqi-Request-ID: evt_test_001" \
  -H "X-Culqi-Delivery-ID: del_001" \
  -d "$PAYLOAD" | jq .

echo ""
echo "=== Test 2: Invalid Signature ==="

# Mismo payload pero con firma inválida
curl -X POST "$API_URL/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Culqi-Signature: invalid_signature_xxxxxxx" \
  -H "X-Culqi-Request-ID: evt_test_002" \
  -d "$PAYLOAD" | jq .

echo ""
echo "=== Test 3: Webhook Charge Failed ==="

PAYLOAD_FAILED='{
  "id": "evt_test_003",
  "type": "charge.failed",
  "created_at": '$(date +%s)',
  "data": {
    "id": "chrg_test_003",
    "amount": 30000,
    "currency_code": "PEN",
    "order_id": "order-test-003",
    "status": "failed"
  }
}'

SIGNATURE=$(curl -s -X POST "$API_URL/firmar" \
  -H "Content-Type: application/json" \
  -d "{\"payload\": \"$PAYLOAD_FAILED\"}" | jq -r '.signature')

curl -X POST "$API_URL/webhook" \
  -H "Content-Type: application/json" \
  -H "X-Culqi-Signature: $SIGNATURE" \
  -H "X-Culqi-Request-ID: evt_test_003" \
  -d "$PAYLOAD_FAILED" | jq .

echo ""
echo "=== Tests completados ==="
```

### 10.2 Test Postman Collection

```json
{
  "info": {
    "name": "Culqi Payment Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Iniciar Pago",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"monto\": 500.00,\n  \"moneda\": \"PEN\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/pagos/iniciar/{{pedido_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "pagos", "iniciar", "{{pedido_id}}"]
        }
      }
    },
    {
      "name": "2. Generar Firma para Test",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"payload\": \"{{webhook_payload}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/culqi/firmar",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "culqi", "firmar"]
        }
      }
    },
    {
      "name": "3. Simular Webhook Charge Completed",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-Culqi-Signature",
            "value": "{{webhook_signature}}"
          },
          {
            "key": "X-Culqi-Request-ID",
            "value": "{{webhook_event_id}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"id\": \"evt_test_completed\",\n  \"type\": \"charge.completed\",\n  \"created_at\": {{current_timestamp}},\n  \"data\": {\n    \"id\": \"chrg_test_123\",\n    \"object\": \"charge\",\n    \"amount\": 50000,\n    \"currency_code\": \"PEN\",\n    \"order_id\": \"{{order_id}}\",\n    \"status\": \"completed\",\n    \"fee\": 1500,\n    \"net\": 48500,\n    \"email\": \"{{customer_email}}\"\n  }\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/culqi/webhook",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "culqi", "webhook"]
        }
      }
    },
    {
      "name": "4. Consultar Estado de Pago",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/pagos/{{order_id}}",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "pagos", "{{order_id}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080"
    },
    {
      "key": "jwt_token",
      "value": ""
    },
    {
      "key": "pedido_id",
      "value": "12345"
    },
    {
      "key": "order_id",
      "value": "order-test-001"
    },
    {
      "key": "customer_email",
      "value": "cliente@aspropa.pe"
    },
    {
      "key": "webhook_event_id",
      "value": "evt_test_{{$timestamp}}"
    },
    {
      "key": "current_timestamp",
      "value": "{{$timestamp}}"
    }
  ]
}
```

---

## Parte 11: Monitoreo y Observabilidad

### 11.1 Métricas Micrometer

```java
package pe.aspropa.mercadolink.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CulqiMetricsService {
    
    private final Counter paymentInitiatedCounter;
    private final Counter paymentApprovedCounter;
    private final Counter paymentFailedCounter;
    private final Counter webhookReceivedCounter;
    private final Counter webhookProcessedCounter;
    private final Counter webhookErrorCounter;
    private final Timer paymentProcessingTimer;
    
    public CulqiMetricsService(MeterRegistry meterRegistry) {
        this.paymentInitiatedCounter = Counter.builder("culqi.payment.initiated")
                .description("Total pagos iniciados")
                .register(meterRegistry);
        
        this.paymentApprovedCounter = Counter.builder("culqi.payment.approved")
                .description("Total pagos aprobados")
                .register(meterRegistry);
        
        this.paymentFailedCounter = Counter.builder("culqi.payment.failed")
                .description("Total pagos rechazados")
                .register(meterRegistry);
        
        this.webhookReceivedCounter = Counter.builder("culqi.webhook.received")
                .description("Total webhooks recibidos")
                .register(meterRegistry);
        
        this.webhookProcessedCounter = Counter.builder("culqi.webhook.processed")
                .description("Total webhooks procesados")
                .register(meterRegistry);
        
        this.webhookErrorCounter = Counter.builder("culqi.webhook.error")
                .description("Total errores en webhooks")
                .register(meterRegistry);
        
        this.paymentProcessingTimer = Timer.builder("culqi.payment.processing.time")
                .description("Tiempo de procesamiento de pagos (ms)")
                .register(meterRegistry);
    }
    
    public void recordPaymentInitiated() {
        paymentInitiatedCounter.increment();
    }
    
    public void recordPaymentApproved() {
        paymentApprovedCounter.increment();
    }
    
    public void recordPaymentFailed() {
        paymentFailedCounter.increment();
    }
    
    public void recordWebhookReceived() {
        webhookReceivedCounter.increment();
    }
    
    public void recordWebhookProcessed() {
        webhookProcessedCounter.increment();
    }
    
    public void recordWebhookError() {
        webhookErrorCounter.increment();
    }
    
    public void recordPaymentProcessingTime(long milliseconds) {
        paymentProcessingTimer.record(milliseconds, java.util.concurrent.TimeUnit.MILLISECONDS);
    }
}
```

---

## Parte 12: Guía de Troubleshooting

### Problema: Webhook signature validation fails

**Causa:** La firma no coincide  
**Solución:**
1. Verificar que `CULQI_WEBHOOK_SECRET` es idéntico en ambos lados
2. Verificar que el payload es exactamente el mismo (sin espacios extras)
3. Verificar que se usa HMAC-SHA256 (no SHA-1 ni SHA-512)

### Problema: Webhook timeout

**Causa:** Endpoint tarda más de 2 segundos  
**Solución:**
1. Retornar 202 Accepted inmediatamente
2. Procesar webhook en background thread
3. Usar `@Async` para procesamiento no-bloqueante

### Problema: Pagos quedan en estado PENDIENTE

**Causa:** Webhooks no procesados  
**Solución:**
1. Ejecutar reconciliación manual: `pagoService.reconciliar()`
2. Revisar logs de webhook_events (retry_count, processing_error)
3. Contactar a Culqi si el webhook nunca fue recibido

---

Este documento proporciona toda la base técnica para la implementación completa.

