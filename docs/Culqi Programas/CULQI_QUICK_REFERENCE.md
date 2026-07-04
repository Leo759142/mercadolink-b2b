# 🎯 Quick Reference - Culqi Integration

## 📚 5 Documentos Clave

```
┌─────────────────────────────────────────────────────────────────┐
│                  DOCUMENTACIÓN CULQI COMPLETA                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 👔 EXECUTIVE SUMMARY (10 min read)                          │
│     └─ Para: CEO, Product, Decision Makers                     │
│     └─ Qué: Business case, timeline, ROI                       │
│     📄 Archivo: CULQI_EXECUTIVE_SUMMARY.md                     │
│                                                                 │
│  2. 📋 DEPLOYMENT PLAN (30-40 min read)                         │
│     └─ Para: Arquitectos, Tech Leads, PM                       │
│     └─ Qué: Arquitectura, flujos, especificaciones              │
│     📄 Archivo: CULQI_DEPLOYMENT_PLAN.md                       │
│                                                                 │
│  3. 💻 IMPLEMENTATION GUIDE (1-2 horas)                         │
│     └─ Para: Desarrolladores Backend                           │
│     └─ Qué: Código fuente, configuración, BD                   │
│     📄 Archivo: CULQI_IMPLEMENTATION_GUIDE.md                  │
│                                                                 │
│  4. 🧪 CONFIG & TESTING (1 hora)                               │
│     └─ Para: DevOps, QA, Developers                            │
│     └─ Qué: Setup, tests, troubleshooting                      │
│     📄 Archivo: CULQI_CONFIG_TESTING.md                        │
│                                                                 │
│  5. 🚨 OPERATIONS RUNBOOK (30 min referencia)                  │
│     └─ Para: SRE, On-call, Operations                          │
│     └─ Qué: Daily checks, incidents, procedures                │
│     📄 Archivo: CULQI_OPERATIONS_RUNBOOK.md                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Mapa de Lectura por Rol

```
                              ┌─────────────────────┐
                              │  EXECUTIVE SUMMARY  │
                              │   (Inicio siempre)  │
                              └─────────┬───────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
      ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
      │  EJECUTIVO   │            │  ARQUITECTO  │            │  DESARROLLADOR
      │   / PRODUCT  │            │  / TECH LEAD │            │     BACKEND
      └──────────────┘            └──────────────┘            └──────────────┘
            │                           │                           │
            └─────────┐                 ├─────────┐                 ├──────────┐
                      │                 │         │                 │          │
                      ▼                 ▼         ▼                 ▼          ▼
            ┌──────────────────┐   ┌────────────────────┐    ┌──────────────────┐
            │  DEPLOYMENT PLAN │   │ IMPLEMENTATION     │    │ CONFIG & TESTING │
            │  (Contexto)      │   │ GUIDE (Código)     │    │ (Setup)          │
            │                  │   │                    │    │                  │
            │ • Timeline       │   │ • Services         │    │ • Migrations BD  │
            │ • Business Case  │   │ • Controllers      │    │ • Tests          │
            │ • Resources      │   │ • DTOs             │    │ • Troubleshoot   │
            │ • Hitos          │   │ • Repositories     │    │ • Scripts        │
            │                  │   │ • Security         │    │                  │
            └──────────────────┘   └────────────────────┘    └──────────────────┘
                      │                    │                          │
                      ▼                    ▼                          ▼
                  Entender           Implementar                   Testear
                  el proyecto        el código                     & Deploy
```

---

## ⏱️ Timeline de Implementación

```
SEMANA 1-2: DESARROLLO CORE
├─ Día 1-3:  Setup & Credenciales
├─ Día 4-8:  Implementar Services
├─ Día 9-12: Implementar Controllers
└─ Día 13-14: Tests Unitarios

SEMANA 3: TESTING EXHAUSTIVO
├─ Día 1-3:  Tests de Integración
├─ Día 4-5:  Load Testing
└─ Día 6-7:  Security Review

SEMANA 4-5: STAGING
├─ Día 1-3:  Deploy a Staging
├─ Día 4-7:  Testing End-to-End
└─ Día 8-10: Performance Tuning

SEMANA 5-6: PRODUCCIÓN
├─ Día 1-2:  Credenciales Reales
├─ Día 3-4:  Blue/Green Deploy
└─ Día 5-10: Monitoring 24h

═══════════════════════════════════════════════════════════════
TOTAL: ~20-25 días laborales (~5 semanas)
═══════════════════════════════════════════════════════════════
```

---

## 🏗️ Arquitectura en Nutshell

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
│  CulqiCheckout.js → Culqi.js Library → Payment Form       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ POST /api/v1/pagos/iniciar/{pedidoId}
                        ▼
┌────────────────────────────────────────────────────────────┐
│                 BACKEND (Spring Boot 3.3)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PagoController                                       │  │
│  │ • POST /iniciar → CulqiService.createPaymentToken() │  │
│  │ • GET /{orderId} → Consultar estado                 │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                            │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │ CulqiService                                         │  │
│  │ • createPaymentToken() → Culqi API                  │  │
│  │ • verifyWebhookSignature() → Validar HMAC          │  │
│  │ • getTransactionStatus() → Consultar estado        │  │
│  │ • refundTransaction() → Procesar devoluciones      │  │
│  └──────────────┬─────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼────────────────────────────────────────┐  │
│  │ PagoService                                          │  │
│  │ • iniciarPago() → Crear transacción                 │  │
│  │ • procesarWebhookAsync() → Procesar en background  │  │
│  │ • reconciliar() → Sincronizar con Culqi API        │  │
│  └──────────────┬─────────────────────────────────────┘  │
│                 │                                          │
│  ┌──────────────▼────────────────────────────────────────┐  │
│  │ Webhook Processing                                   │  │
│  │ • WebhookRetryService → Reintentos exponenciales   │  │
│  │ • WebhookEvent → Registro de eventos               │  │
│  │ • Idempotencia → Deduplicación por event ID        │  │
│  └──────────────┬─────────────────────────────────────┘  │
│                 │                                          │
│      ┌──────────┴──────────┬─────────────┬──────────┐     │
│      │                     │             │          │     │
│      ▼                     ▼             ▼          ▼     │
│   ┌────────┐          ┌────────┐   ┌──────────┐  ┌─────┐ │
│   │ H2 DB  │          │ Redis  │   │ Audit    │  │ App │ │
│   │ (local)│          │ Cache  │   │ Service  │  │Insights
│   └────────┘          └────────┘   └──────────┘  └─────┘ │
└────────────────────────────────────────────────────────────┘
                        │
                        │ POST /webhook (IPN)
                        ▼
        ┌──────────────────────────────┐
        │  Culqi Payment Gateway       │
        │  (Real API, Sandbox/Prod)    │
        │  • Payment processing        │
        │  • Webhook delivery          │
        │  • Transaction recording     │
        └──────────────────────────────┘
```

---

## 📊 Estado Actual vs Objetivo

```
┌─────────────────────┬──────────────────────┬─────────────────────┐
│      Aspecto        │  ACTUAL (Izipay)     │  OBJETIVO (Culqi)   │
├─────────────────────┼──────────────────────┼─────────────────────┤
│ API Integration     │ Mock Sandbox Only    │ Real API ✓          │
│ Webhook Handling    │ Basic               │ Robusto + Reintentos│
│ Payment Methods     │ Limited             │ Múltiples ✓         │
│ Security           │ HMAC Basic          │ HMAC + Timestamps ✓ │
│ Audit Trail        │ Mínimo              │ Completo (7 años) ✓ │
│ Monitoring         │ Basic Logs          │ Métricas + Alerts ✓ │
│ Production Ready   │ ❌ No               │ ✅ Sí               │
│ Concurrency Tests  │ ❌ No               │ ✅ Sí (100+ tps)    │
│ Circuit Breaker    │ ❌ No               │ ✅ Sí (Resilience4j)│
│ Reconciliation     │ Manual              │ Automático ✓        │
│ Refunds            │ Manual              │ Automático ✓        │
└─────────────────────┴──────────────────────┴─────────────────────┘

Legend: ✓ Implementado | ❌ No implementado
```

---

## 🔑 Conceptos Clave (1 minuto cada)

### Webhook
```
Notificación HTTP que Culqi envía cuando pasa algo.
Ej: "Pago aprobado" → POST http://tuserver.com/webhook
IMPORTANTE: Responder en <2 segundos, procesar en background
```

### HMAC-SHA256
```
Firma criptográfica que valida que el webhook vino de Culqi.
Si no valida → 401 Unauthorized (rechazar)
```

### Idempotencia
```
Procesar el mismo evento 10 veces = mismo resultado.
Cómo: Usar webhook ID para deduplicar en BD.
```

### Reconciliación
```
Sincronizar con Culqi cada 1h para detectar eventos perdidos.
Si: Webhook no llegó → Consultar API de Culqi
```

### Reintentos
```
Si webhook falla: reintentar automáticamente
Estrategia: Exponential backoff (1s, 2s, 4s, 8s, 16s...)
```

---

## 🚀 3-Pasos Rápidos para Empezar

### Paso 1: Preparación (Día 1)
```bash
# 1. Leer documentación
cat CULQI_EXECUTIVE_SUMMARY.md         # 10 min
cat CULQI_DEPLOYMENT_PLAN.md           # 30 min

# 2. Obtener credenciales sandbox de Culqi
# Contactar: soporte@culqi.com

# 3. Setup repositorio
git checkout -b feature/culqi
cd mercadolink-b2b
```

### Paso 2: Implementación (Días 2-14)
```bash
# 1. Crear rama de trabajo
git checkout -b feature/culqi-core

# 2. Implementar servicios (según CULQI_IMPLEMENTATION_GUIDE.md)
touch src/main/java/pe/aspropa/mercadolink/service/CulqiService.java
touch src/main/java/pe/aspropa/mercadolink/service/WebhookRetryService.java
# ... etc

# 3. Crear tests (según CULQI_CONFIG_TESTING.md)
mvn test -Dtest=CulqiServiceTest
mvn test -Dtest=CulqiWebhookIntegrationTest

# 4. Commit
git add .
git commit -m "feat: Culqi integration core services"
git push origin feature/culqi-core
```

### Paso 3: Testing & Deploy (Días 15-25)
```bash
# 1. Testing exhaustivo
mvn clean test -DargLine="-Xmx1024m"  # Unit tests
mvn verify                             # Integration tests

# 2. Deploy a staging
azd deploy --environment staging

# 3. Monitoreo
az monitor metrics list --resource mercadolink-staging

# 4. Deploy a producción
azd deploy --environment production

# 5. Ongoing monitoring
./scripts/daily-health-check.sh
```

---

## 📋 Daily Operations Checklist

```
┌─ MAÑANA (9:00 AM) ─────────────────────┐
│ □ Health check de aplicación           │
│ □ Verificar no hay alertas pendientes  │
│ □ Revisar transacciones de ayer        │
│ □ Check: Log transacciones = Culqi API │
└────────────────────────────────────────┘

┌─ MEDIODÍA (12:00 PM) ──────────────────┐
│ □ Reconciliación horaria               │
│ □ Revisar webhooks pendientes          │
│ □ Check: Errores de webhook < 0.1%    │
│ □ Alertas: Ninguna crítica (rojo)      │
└────────────────────────────────────────┘

┌─ TARDE (5:00 PM) ──────────────────────┐
│ □ Reporte diario de transacciones      │
│ □ Tasa de conversión > 95%?            │
│ □ Revisar refunds procesados           │
│ □ Check: Performance P95 < 500ms       │
└────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting en 60 segundos

```
❓ PROBLEMA: Webhook signature fails

DIAGNÓSTICO:
$ curl -X GET http://localhost:8080/api/v1/culqi/debug/status

ACCIÓN RÁPIDA:
1. Verificar CULQI_WEBHOOK_SECRET en Azure Key Vault
2. Comparar con Dashboard de Culqi
3. Si no coincide → Actualizar en Key Vault
4. Reiniciar aplicación

⏱️ Tiempo esperado: 5-10 minutos
```

```
❓ PROBLEMA: Transacciones quedan en PENDIENTE por >1h

DIAGNÓSTICO:
$ psql -c "SELECT COUNT(*) FROM log_transacciones 
           WHERE estado='PENDIENTE' 
           AND updated_at < NOW() - INTERVAL '1h';"

ACCIÓN RÁPIDA:
1. Ejecutar reconciliación manual
2. Revisar logs de webhook_events
3. Si es error de BD → Escalar a DevOps
4. Si es error de Culqi → Esperar + retry

⏱️ Tiempo esperado: 10-15 minutos
```

```
❓ PROBLEMA: "Error 503 - Culqi API No Disponible"

DIAGNÓSTICO:
$ curl https://api.culqi.com/v2/merchant \
    -H "Authorization: Bearer $CULQI_API_KEY"

ACCIÓN RÁPIDA:
1. Verificar status.culqi.com
2. Si está down → Esperar recuperación
3. Si es problema nuestro → Revisar firewall
4. Activar "modo sin conexión" si aplica

⏱️ Tiempo esperado: 2-5 minutos (+ espera de Culqi)
```

---

## 💡 Pro Tips

### Tip 1: Testing Local Sin Credenciales
```bash
# Usar endpoint de test signature
curl -X POST http://localhost:8080/api/v1/culqi/firmar \
  -H "Content-Type: application/json" \
  -d '{"payload": "test"}' | jq '.signature'
```

### Tip 2: Debugging de Webhooks
```bash
# Ver último webhook recibido
SELECT * FROM webhook_events ORDER BY received_at DESC LIMIT 1;

# Ver retry count
SELECT culqi_event_id, retry_count, processing_error 
FROM webhook_events WHERE processed=false;
```

### Tip 3: Performance Baseline
```bash
# Verificar latencia de pago
SELECT 
  AVG(EXTRACT(EPOCH FROM (webhook_received_at - created_at))) as avg_seconds
FROM log_transacciones 
WHERE created_at > NOW() - INTERVAL '1 day';
```

### Tip 4: Alertas Custom
```yaml
# En application.yml
app:
  alerts:
    error-rate-threshold: 1.0          # % de errores
    pending-timeout-minutes: 60         # Si PENDIENTE >60m
    webhook-retry-max: 5               # Máx reintentos
```

---

## 📞 Emergency Contacts

```
🚨 CRITICAL ISSUE?

1st Call:   On-Call Developer
            (rotativo - en Slack #oncall)

2nd Call:   Payment Team Lead
            pagos@aspropa.pe
            +51 999-xxx-xxxx

3rd Call:   Culqi Support
            soporte@culqi.com
            +51 1-xxx-xxxx

4th Call:   CTO / Manager
            (si es down >30min)
```

---

## ✅ Pre-Launch Checklist

```
CÓDIGO
  □ Todas las clases creadas
  □ 80%+ test coverage
  □ Code review pasado
  □ No hay TODO comments

CONFIGURACIÓN
  □ Credenciales en Key Vault
  □ URLs correctas (sandbox vs prod)
  □ Timeouts configurados
  □ Logging nivel correcto

TESTING
  □ Unit tests: ALL PASS
  □ Integration tests: ALL PASS
  □ Load test (100+ tps): PASSED
  □ Security audit: PASSED

INFRAESTRUCTURA
  □ Docker image builds
  □ CI/CD pipeline funciona
  □ Monitoring dashboards listos
  □ Alertas configuradas

DOCUMENTACIÓN
  □ Runbook revisado
  □ Team capacitado
  □ Escalation clara
  □ On-call definido
```

---

## 🎓 Recursos de Aprendizaje

```
CULQI OFFICIAL
├─ API Docs: https://culqi.com/docs/api
├─ Webhooks: https://culqi.com/docs/webhooks
└─ Security: https://culqi.com/docs/security

SPRING BOOT
├─ Spring Boot 3.3: https://spring.io/projects/spring-boot
├─ Spring Security: https://spring.io/projects/spring-security
└─ Spring Data JPA: https://spring.io/projects/spring-data-jpa

HERRAMIENTAS
├─ Postman: https://www.postman.com/
├─ cURL: https://curl.se/
└─ Grafana: https://grafana.com/
```

---

**Quick Reference Card**  
**Versión:** 1.0 | Julio 2026  
**Úsalo con:** Los 5 documentos principales  
**Actualizado:** Julio 2026  

💡 *Tip: Imprime esto y pégalo en tu escritorio* 📌

