# Plan Integral de Integración y Despliegue de Culqi 🚀

**Proyecto:** MercadoLink B2B  
**Versión:** 1.0  
**Fecha:** Julio 2026  
**Status:** Plan de Implementación  

---

## 📋 Resumen Ejecutivo

Este documento presenta un plan mejorado y completo para migrar de Izipay a **Culqi** como pasarela de pagos principal, implementando:

- ✅ Integración real con API de Culqi (no mock)
- ✅ Webhooks robustos con reintentos automáticos
- ✅ Soporte para múltiples métodos de pago (tarjetas, billeteras digitales)
- ✅ Reconciliación de transacciones
- ✅ Seguridad con firmas criptográficas
- ✅ Auditoría completa de transacciones
- ✅ Despliegue en producción con entorno real
- ✅ Monitoreo y alertas de pagos

---

## 🎯 Objetivos

### Corto Plazo (Semana 1-2)
1. Implementar `CulqiService` con API real
2. Crear `CulqiWebhookController` robusto
3. Agregar persistencia de logs de transacciones
4. Configurar credenciales en entorno real

### Mediano Plazo (Semana 3-4)
1. Webhooks con reintentos y circuit breaker
2. Reconciliación automática de pagos
3. Dashboard de monitoreo
4. Tests de integración

### Largo Plazo (Semana 5-6)
1. Despliegue en staging y producción
2. Migración de transacciones históricas
3. Capacitación del equipo
4. Documentación completa

---

## 🏗️ Arquitectura Mejorada

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  CulqiCheckout.js → Culqi.js Library (1.0.1) → Payment Form    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ POST /api/v1/pagos/iniciar/{pedidoId}
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot 3.3)                     │
├──────────────────────────────────────────────────────────────────┤
│                    PagoController (REST)                         │
│  POST /iniciar    → CulqiService.createPaymentToken()          │
│  GET /{pedidoId}  → PagoService.consultarPago()                │
│  GET /reconcile   → PagoService.reconciliar()                  │
│  GET /logs        → LogTransaccionService.buscar()             │
└──────────────────┬───────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┬─────────────┐
        │                     │              │             │
        ▼                     ▼              ▼             ▼
   ┌─────────┐          ┌─────────┐   ┌──────────┐  ┌─────────┐
   │ CULQI   │          │   H2    │   │ AUDIT    │  │ CACHE   │
   │  API    │          │ DATABASE│   │  SERVICE │  │ (Redis) │
   │ (Real)  │          │         │   │          │  │         │
   └────┬────┘          └─────────┘   └──────────┘  └─────────┘
        │
        │ Response + Webhook
        │
        ▼
   ┌─────────────────────────────────┐
   │  Culqi Webhook Endpoint         │
   │  POST /api/v1/culqi/webhook     │
   │                                 │
   │  ✓ Validar firma + timestamp    │
   │  ✓ Procesar async (202 Accepted)│
   │  ✓ Actualizar estado pedido     │
   │  ✓ Enviar notificaciones        │
   │  ✓ Registrar audit trail        │
   └─────────────────────────────────┘
```

---

## 📦 Nuevas Dependencias (pom.xml)

```xml
<!-- HTTP Client para llamadas a Culqi API -->
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

<!-- Redis para caché de sesiones -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<!-- Micrometer para métricas de Culqi -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-core</artifactId>
</dependency>

<!-- Jackson para JSON avanzado -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>

<!-- Lombok para reducir boilerplate -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

---

## 🔧 Nuevos Componentes a Implementar

### 1. **CulqiService** (Mejorado)
- `createPaymentToken()` → Genera token de pago con Culqi API real
- `verifyWebhook()` → Valida firma digital de webhooks
- `getTransactionStatus()` → Consulta estado en tiempo real
- `refundTransaction()` → Procesa devoluciones
- `getAvailableMethods()` → Obtiene métodos de pago disponibles

### 2. **CulqiWebhookController** (Robusto)
- `webhook()` → Endpoint público para IPN de Culqi
- Validación de firma HMAC-SHA256
- Procesamiento asíncrono con reintentos
- Respuesta 202 Accepted inmediata
- Manejo de idempotencia con webhook ID

### 3. **CulqiTransactionLogger**
- Registro de cada transacción en BD
- Timestamps precisos
- Estados detallados
- IDs de correlación para trazabilidad

### 4. **WebhookRetryService**
- Reintentos automáticos (exponential backoff)
- Circuit breaker para fallos cascada
- Dead letter queue para análisis
- Alertas en fallos críticos

### 5. **CulqiReconciliationService**
- Sincronización periódica con API de Culqi
- Detección de transacciones no procesadas
- Reporte de discrepancias
- Auditoría de reconciliaciones

### 6. **CulqiDashboardController**
- Métrica de transacciones por estado
- Tasa de conversión
- Errores frecuentes
- Ingresos por período

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (Producción)

```bash
# Credentials Culqi
CULQI_API_KEY=sk_live_xxxxxxxxxxxxx          # Secret key (PROTEGER)
CULQI_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx       # Public key (frontend)
CULQI_WEBHOOK_SECRET=whsec_xxxxx             # Secret para firmar webhooks

# Entorno
CULQI_SANDBOX_MODE=false                     # Activar modo producción
CULQI_API_BASE_URL=https://api.culqi.com/v2  # URL real

# Seguridad
JWT_SECRET=base64-encoded-256-bit-key        # JWT token signing
WEBHOOK_SIGNATURE_ALGORITHM=HMAC_SHA256

# Reintentos y Timeouts
WEBHOOK_RETRY_MAX_ATTEMPTS=5
WEBHOOK_RETRY_BACKOFF_MS=1000
CULQI_API_TIMEOUT_MS=30000

# Monitoreo
ENABLE_TRANSACTION_AUDIT=true
ENABLE_WEBHOOK_METRICS=true
ALERT_EMAIL=pagos@aspropa.pe
```

### Archivo de Configuración (application-prod.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/mercadolink
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        jdbc:
          batch_size: 20
          fetch_size: 50

  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD}
    timeout: 60000ms

app:
  culqi:
    api-key: ${CULQI_API_KEY}
    public-key: ${CULQI_PUBLIC_KEY}
    webhook-secret: ${CULQI_WEBHOOK_SECRET}
    sandbox-mode: ${CULQI_SANDBOX_MODE:false}
    base-url: ${CULQI_API_BASE_URL:https://api.culqi.com/v2}
    request-timeout-ms: ${CULQI_API_TIMEOUT_MS:30000}
    
  webhook:
    retry:
      max-attempts: ${WEBHOOK_RETRY_MAX_ATTEMPTS:5}
      backoff-ms: ${WEBHOOK_RETRY_BACKOFF_MS:1000}
      max-backoff-ms: 300000
    
  audit:
    enabled: ${ENABLE_TRANSACTION_AUDIT:true}
    retention-days: 2555  # 7 años

resilience4j:
  circuitbreaker:
    instances:
      culqi-api:
        register-health-indicator: true
        failure-rate-threshold: 50
        slow-call-duration-threshold: 10000
        slow-call-rate-threshold: 50
        permitted-calls-in-half-open-state: 3
        automatic-transition-enabled: true
        wait-duration-in-open-state: 60000
        event-consumer-buffer-size: 10

logging:
  level:
    root: INFO
    pe.aspropa.mercadolink: INFO
    pe.aspropa.mercadolink.payment: DEBUG
    pe.aspropa.mercadolink.webhook: DEBUG
  file:
    name: logs/mercadolink.log
    max-size: 100MB
    max-history: 30
```

---

## 📝 Modelos de Datos Nuevos

### LogTransaccion

```java
@Entity
@Table(name = "log_transacciones", indexes = {
    @Index(name = "idx_order_id", columnList = "order_id"),
    @Index(name = "idx_culqi_txn_id", columnList = "culqi_transaction_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
public class LogTransaccion {
    @Id
    private String id;  // UUID
    
    @Column(nullable = false, unique = true)
    private String orderId;
    
    private String culqiTransactionId;
    private String culqiChargeId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estado;  // PENDIENTE, PROCESANDO, APROBADO, RECHAZADO, REEMBOLSADO
    
    @Column(nullable = false)
    private BigDecimal monto;
    
    @Column(nullable = false)
    private String moneda;  // PEN, USD
    
    private String metodoPago;  // VISA, AMEX, BILLETERA_DIGITAL, etc.
    
    @Lob
    private String requestPayload;  // JSON del request a Culqi
    
    @Lob
    private String responsePayload;  // JSON de respuesta de Culqi
    
    private String codigoError;
    private String mensajeError;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private LocalDateTime webhookReceivedAt;
    private int webhookRetryCount;
    
    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
}
```

### WebhookEvent

```java
@Entity
@Table(name = "webhook_events")
public class WebhookEvent {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String culqiEventId;
    
    @Enumerated(EnumType.STRING)
    private TipoEventoWebhook tipo;  // CHARGE.APPROVED, CHARGE.FAILED, etc.
    
    @Lob
    private String payload;
    
    private boolean processed;
    private boolean verified;
    
    @CreationTimestamp
    private LocalDateTime receivedAt;
    
    private LocalDateTime processedAt;
    
    private String processingError;
    private int retryCount;
}
```

### ConfiguracionCulqi

```java
@Entity
@Table(name = "configuracion_culqi")
public class ConfiguracionCulqi {
    @Id
    private String id;
    
    @Enumerated(EnumType.STRING)
    private Entorno entorno;  // SANDBOX, PRODUCCION
    
    @Column(nullable = false)
    private String apiKey;  // Encrypted
    
    @Column(nullable = false)
    private String publicKey;
    
    @Column(nullable = false)
    private String webhookSecret;  // Encrypted
    
    private String webhookUrl;
    
    private boolean activo;
    
    private LocalDateTime ultimaVerificacion;
    private boolean statusVerificado;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

---

## 🔄 Flujos de Negocio Detallados

### 1. Flujo de Inicio de Pago

```
CLIENTE
   │
   └──> POST /api/v1/pagos/iniciar/{pedidoId}
        ├─ Validar autenticación
        ├─ Obtener detalles del pedido
        ├─ Validar monto y moneda
        │
        ▼
   CulqiService.createPaymentToken()
        ├─ Generar UUID para transacción
        ├─ Construir payload para Culqi
        ├─ POST a https://api.culqi.com/v2/charges
        │  Headers: Authorization: Bearer sk_live_xxxxx
        │  Body:
        │  {
        │    "amount": 50000,
        │    "currency_code": "PEN",
        │    "description": "Pedido #123456",
        │    "order_id": "order-abc123",
        │    "client": {
        │      "email": "cliente@aspropa.pe",
        │      "first_name": "Juan",
        │      "last_name": "Pérez",
        │      "phone_number": "+51987654321"
        │    },
        │    "metadata": {
        │      "pedido_id": "123456",
        │      "usuario_id": "usr-789"
        │    }
        │  }
        ├─ Registrar request en LogTransaccion
        │
        ▼
   Culqi Response
        │
        ├─ Si éxito (200):
        │  ├─ Guardar LogTransaccion (PENDIENTE)
        │  ├─ Cachear en Redis (5 minutos)
        │  └─ Retornar {
        │       token: "tok_xxxxx",
        │       publicKey: "pk_live_xxxxx",
        │       orderId: "order-abc123"
        │     }
        │
        └─ Si error (400, 401, 500):
           ├─ Registrar error en LogTransaccion
           ├─ Retornar 400 Bad Request
           └─ Alertar por email (si error crítico)
```

### 2. Flujo de Webhook

```
Culqi (evento en servidor Culqi)
   │
   └──> POST https://tudominio.com/api/v1/culqi/webhook
        ├─ Headers contienen:
        │  X-Culqi-Signature: HMAC-SHA256(payload, secret)
        │  X-Culqi-Request-ID: Unique event ID
        │
        ├─ Body: {
        │    "id": "evt_xxxxx",
        │    "type": "charge.completed",
        │    "created_at": "2026-07-01T15:30:45Z",
        │    "data": {
        │      "id": "chrg_xxxxx",
        │      "amount": 50000,
        │      "currency_code": "PEN",
        │      "order_id": "order-abc123",
        │      "status": "completed",
        │      "fee": 1500,
        │      "net": 48500
        │    }
        │  }
        │
        ▼
   CulqiWebhookController.webhook()
        ├─ Validar firma: HMAC-SHA256(body, secret)
        ├─ Validar timestamp (±5 minutos)
        │
        ├─ Si no válido:
        │  └─ Retornar 401 Unauthorized
        │
        ├─ Si válido:
        │  ├─ Verificar idempotencia (X-Culqi-Request-ID)
        │  ├─ Guardar WebhookEvent (sin procesar)
        │  ├─ Retornar 202 Accepted INMEDIATAMENTE
        │  │  (Culqi requiere respuesta en <2 segundos)
        │  │
        │  └─ ASYNC: pagoService.procesarWebhookAsync()
```

### 3. Flujo de Procesamiento de Webhook (Asincrónico)

```
PagoService.procesarWebhookAsync(webhook)
   │
   ├─ Marcar WebhookEvent como "procesando"
   │
   ├─ Obtener LogTransaccion por orderId
   ├─ Obtener Pedido asociado
   │
   ├─ Según estado del webhook:
   │
   ├─ Si "charge.completed":
   │  ├─ Actualizar LogTransaccion → APROBADO
   │  ├─ Actualizar Pedido → PAGADO
   │  ├─ Liberar inventario
   │  ├─ Crear factura (si aplica)
   │  ├─ Enviar email de confirmación
   │  ├─ Registrar en auditoría
   │  └─ AuditoriaService.registrarPagoProcesado()
   │
   ├─ Si "charge.failed":
   │  ├─ Actualizar LogTransaccion → RECHAZADO
   │  ├─ Extraer motivo del error
   │  ├─ Actualizar Pedido → PAGO_FALLIDO
   │  ├─ Enviar email de rechazo (con detalles)
   │  └─ Liberar inventario (revert)
   │
   ├─ Si "charge.refunded":
   │  ├─ Actualizar LogTransaccion → REEMBOLSADO
   │  ├─ Actualizar Pedido → REEMBOLSADO
   │  └─ Registrar crédito a proveedor
   │
   ├─ Marcar WebhookEvent → processed = true
   │
   └─ En caso de error:
      ├─ Implementar reintentos (exponential backoff)
      ├─ Si falla después de N reintentos:
      │  ├─ Mover a dead-letter-queue
      │  ├─ Alertar por email
      │  └─ Registrar en alert logs
      └─ Circuit breaker activa si muchos fallos
```

### 4. Flujo de Reconciliación

```
CulqiReconciliationService.reconciliar()
   (Ejecutarse cada 1 hora en producción)
   │
   ├─ Obtener todas las transacciones sin procesar
   │  desde LogTransaccion (estado = PENDIENTE)
   │
   ├─ Para cada transacción:
   │  ├─ Llamar a Culqi API: GET /charges/{chargeId}
   │  │
   │  ├─ Comparar estado local vs remoto
   │  │
   │  ├─ Si mismatch:
   │  │  ├─ Registrar discrepancia
   │  │  ├─ Procesar como si fuera webhook nuevo
   │  │  └─ Enviar notificación
   │  │
   │  └─ Si más de 24h sin procesar:
   │     ├─ Marcar como TIMEOUT
   │     ├─ Alertar
   │     └─ Permitir reintentar pago
   │
   └─ Generar reporte de reconciliación
      ├─ Transacciones procesadas
      ├─ Discrepancias encontradas
      ├─ Ingresos verificados
      └─ Guardar en auditoría
```

---

## 🧪 Testing

### Tests Unitarios

```bash
# PagoService
- testInitiarPago_Success
- testInitiarPago_InvalidOrderId
- testInitiarPago_InsufficientInventory
- testProcesarWebhook_Aprobado
- testProcesarWebhook_Rechazado
- testProcesarWebhook_DuplicateEvent
- testReconciliar_DetectDiscrepancies

# CulqiService
- testCreatePaymentToken_Success
- testCreatePaymentToken_APIError
- testVerifyWebhook_ValidSignature
- testVerifyWebhook_InvalidSignature
- testVerifyWebhook_ExpiredTimestamp

# CulqiWebhookController
- testWebhook_ValidSignature_Returns202
- testWebhook_InvalidSignature_Returns401
- testWebhook_IdempotentProcessing
- testWebhook_ConcurrentRequests
```

### Tests de Integración

```bash
# Culqi API (Sandbox)
- testEndToEnd_FullPaymentFlow
- testEndToEnd_PaymentWithRefund
- testWebhook_ActualEventFromCulqi
- testReconciliation_WithSandboxData
```

---

## 📊 Métricas y Monitoreo

### KPIs a Monitorear

```
1. Tasa de Conversión de Pagos
   = (Pagos Aprobados / Pagos Iniciados) × 100
   Target: >95%

2. Tiempo Promedio de Procesamiento
   = Promedio(Timestamp Webhook - Timestamp Aprobación)
   Target: <5 segundos

3. Disponibilidad de API Culqi
   = (Requests Exitosos / Total Requests) × 100
   Target: >99.5%

4. Tasa de Errores de Webhook
   = (Webhooks con Error / Total Webhooks) × 100
   Target: <0.1%

5. Valor Medio de Transacción (AOV)
   = Monto Total / Número de Transacciones

6. Ingresos por Período
   = SUM(Monto * (1 - Tasa de Culqi))

7. Tasa de Devoluciones
   = (Refunds / Pagos Aprobados) × 100
   Target: <5%
```

### Alertas Configuradas

```yaml
alerts:
  - nombre: "Tasa de Error Alta"
    condicion: "error_rate > 5%"
    severidad: CRITICAL
    accion: "Email a pagos@aspropa.pe + PagerDuty"

  - nombre: "Webhook No Procesado"
    condicion: "webhook.processingTime > 30s"
    severidad: WARNING
    accion: "Email a Dev Team"

  - nombre: "API Culqi No Disponible"
    condicion: "culqi_api.availability < 99%"
    severidad: CRITICAL
    accion: "Inmediato escalamiento"

  - nombre: "Transacción Pendiente >1h"
    condicion: "transaction.age > 3600s AND status = PENDING"
    severidad: WARNING
    accion: "Iniciar investigación"
```

---

## 🚀 Plan de Despliegue

### Fase 1: Preparación (Semanas 1-2)

```
Semana 1:
- Day 1-2:  Obtener credenciales de Culqi sandbox
- Day 3-5:  Implementar CulqiService
- Day 6-7:  Implementar CulqiWebhookController
- Day 8-10: Tests unitarios
- Day 11-14: Validar con Culqi team

Semana 2:
- Day 1-3:  LogTransaccion + migrations
- Day 4-5:  WebhookRetryService
- Day 6-7:  Dashboard básico
- Day 8-10: Tests de integración
- Day 11-14: Documentación y QA
```

### Fase 2: Sandbox Testing (Semanas 3-4)

```
Semana 3:
- Desplegar en ambiente staging con Culqi sandbox
- Testing manual de flujos completos
- Tests de carga (100 transacciones/minuto)
- Validar webhooks en tiempo real

Semana 4:
- Testing de failures y edge cases
- Validar reintentos y circuit breaker
- Performance testing
- Security audit
```

### Fase 3: Producción (Semanas 5-6)

```
Semana 5:
- Obtener credenciales reales de Culqi
- Deployment a producción (Blue/Green)
- Monitoring intenso por 24h
- On-call team disponible

Semana 6:
- Migrar transacciones históricas de Izipay
- Validar reconciliación
- Documentación de runbooks
- Capacitación del equipo
```

---

## 📋 Checklist de Implementación

### Código Backend

- [ ] Crear `CulqiService.java`
- [ ] Crear `CulqiWebhookController.java`
- [ ] Crear `LogTransaccionRepository.java`
- [ ] Crear `WebhookEventRepository.java`
- [ ] Crear `WebhookRetryService.java`
- [ ] Crear `CulqiReconciliationService.java`
- [ ] Crear `CulqiDashboardController.java`
- [ ] Actualizar `PagoService.java`
- [ ] Actualizar `PagoController.java`
- [ ] Actualizar `application-prod.yml`
- [ ] Actualizar `pom.xml` con nuevas dependencias

### Modelos de Datos

- [ ] Crear migration para `log_transacciones`
- [ ] Crear migration para `webhook_events`
- [ ] Crear migration para `configuracion_culqi`
- [ ] Crear índices de BD
- [ ] Validar columnas encrypted

### Testing

- [ ] Tests unitarios (>80% cobertura)
- [ ] Tests de integración
- [ ] Tests de carga
- [ ] Security tests (OWASP Top 10)

### DevOps

- [ ] Actualizar Dockerfile
- [ ] Actualizar docker-compose.yml
- [ ] Crear aplicación Azure (App Service o Container Apps)
- [ ] Configurar Key Vault para secrets
- [ ] Configurar Application Insights
- [ ] Crear runbooks de respuesta a incidentes

### Documentación

- [ ] API documentation (Swagger)
- [ ] Guía de implementación para frontend
- [ ] Guía de troubleshooting
- [ ] Manual de operaciones
- [ ] Guía de seguridad

### Validaciones Finales

- [ ] Culqi team review
- [ ] Security audit completo
- [ ] Load testing (1000 tps)
- [ ] Disaster recovery testing
- [ ] Compliance audit (PCI-DSS)

---

## 🛡️ Consideraciones de Seguridad

### 1. Protección de Credenciales

```
❌ NUNCA usar credenciales en código
❌ NUNCA loguear credenciales completas
❌ NUNCA enviar credenciales por email

✅ Usar Azure Key Vault
✅ Usar variables de entorno cifradas
✅ Usar encrypted columns en BD
✅ Auditar acceso a credenciales
```

### 2. Validación de Webhooks

```java
// Verificar 3 capas
1. Validar firma HMAC-SHA256
2. Validar timestamp (±5 minutos)
3. Validar idempotencia (webhook ID único)
```

### 3. Rate Limiting

```yaml
# Proteger endpoints públicos
POST /api/v1/culqi/webhook: unlimited (Culqi whitelist IP)
POST /api/v1/pagos/iniciar: 10 por minuto por usuario
GET /api/v1/pagos/{orderId}: 30 por minuto por usuario
```

### 4. Encriptación

```
- En tránsito: TLS 1.3
- En BD: AES-256-GCM para credenciales
- En reposo: EDB encryption at rest
```

### 5. Auditoría

```
- Log de TODOS los requests/responses de Culqi
- Log de TODOS los webhooks procesados
- Log de acceso a credenciales
- Retención: Mínimo 7 años
```

---

## 🔌 Integración Frontend

### React Hook para Culqi

```javascript
// src/hooks/useCulqiPayment.js
import { useState } from 'react';
import { initiatePay, consultarPago } from '../api';

export const useCulqiPayment = (pedidoId) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const iniciar = async () => {
    try {
      setLoading(true);
      const response = await initiatePay(pedidoId);
      setPaymentData(response);

      // Cargar librería de Culqi
      const script = document.createElement('script');
      script.src = 'https://checkout.culqi.com/js/v3';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // Inicializar Culqi con token
        window.Culqi.publicKey = response.publicKey;
        window.Culqi.settings({
          title: 'MercadoLink',
          currency: 'PEN',
          amount: response.monto * 100,
          orderId: response.orderId,
          email: userEmail,
          metadata: {
            pedido_id: pedidoId
          }
        });
      };
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const consultar = async () => {
    return await consultarPago(pedidoId);
  };

  return {
    iniciar,
    consultar,
    paymentData,
    loading,
    error
  };
};
```

---

## 📞 Soporte y Recursos

### Documentación Oficial
- [Culqi API Docs](https://culqi.com/docs/api)
- [Culqi Webhooks](https://culqi.com/docs/webhooks)
- [Culqi Security](https://culqi.com/docs/security)

### Contacts
- **Culqi Support**: soporte@culqi.com
- **Culqi API Team**: api@culqi.com
- **MercadoLink Team**: pagos@aspropa.pe

### Escalamiento
1. Contact: pagos@aspropa.pe
2. Nivel 2: Lead Dev (Leo759142)
3. Nivel 3: CTO / Arquitectura

---

## 📈 Próximos Pasos

1. **Inmediato**: Revisar este plan con el equipo
2. **Día 1-2**: Obtener credenciales sandbox de Culqi
3. **Día 3**: Comenzar implementación de `CulqiService`
4. **Semana 1**: Completar core implementation
5. **Semana 2-3**: Testing exhaustivo
6. **Semana 4**: Deploy a sandbox público
7. **Semana 5-6**: Producción

---

**Documento Creado:** Julio 2026  
**Versión:** 1.0  
**Estado:** Listo para Implementación  
**Aprobación Pendiente:** ✋

