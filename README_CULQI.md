# 📚 Documentación Culqi Integration - Índice Maestro

## 🎯 Descripción General

Este directorio contiene la **documentación completa para la integración de Culqi en MercadoLink B2B**, incluyendo:

- ✅ Plan de despliegue estratégico
- ✅ Guía técnica de implementación  
- ✅ Configuración y testing
- ✅ Runbook de operaciones
- ✅ Resumen ejecutivo

**Estado:** 🟢 Listo para Implementación  
**Versión:** 1.0  
**Fecha:** Julio 2026  

---

## 📄 Documentos Principales

### 1. **CULQI_EXECUTIVE_SUMMARY.md** ⭐ (Empieza aquí)
**Audiencia:** Ejecutivos, Product Managers, Decision Makers  
**Duración de lectura:** 10-15 minutos

**Contenido:**
- Estado actual vs objetivo
- Beneficios de la migración
- Estimación de recursos y timeline
- Hitos principales
- ROI y business impact
- Contactos y escalación

**Cuándo leer:**
- Necesitas entender el "big picture"
- Necesitas reportar al CEO/CTO
- Necesitas aprobar el presupuesto

---

### 2. **CULQI_DEPLOYMENT_PLAN.md** 📋 (Plan Maestro)
**Audiencia:** Arquitectos, Tech Leads, Project Managers  
**Duración de lectura:** 30-40 minutos

**Contenido:**
- Resumen ejecutivo
- Objetivos por fase
- Arquitectura mejorada (diagramas)
- Nuevas dependencias (Maven)
- Componentes a implementar
- Modelos de datos (JPA entities)
- Flujos de negocio detallados
- Testing strategy
- Métricas y monitoreo
- Plan de despliegue (6 semanas)
- Checklist de implementación
- Consideraciones de seguridad

**Cuándo leer:**
- Vas a diseñar la arquitectura
- Necesitas planificar el proyecto
- Necesitas entender los requisitos completamente

---

### 3. **CULQI_IMPLEMENTATION_GUIDE.md** 💻 (Guía Técnica)
**Audiencia:** Desarrolladores Backend  
**Duración de lectura:** 1-2 horas (implementación)

**Contenido:**
- Configuración del pom.xml
- Modelos de datos completos (LogTransaccion, WebhookEvent, ConfiguracionCulqi)
- Implementación de CulqiService
- Implementación de WebhookRetryService
- Controladores (CulqiWebhookController)
- DTOs (CulqiWebhookRequest)
- Repositorios (JpaRepository)

**Cuándo leer:**
- Estás implementando el código
- Necesitas una referencia técnica
- Necesitas entender cómo integrar Culqi

**Archivos a crear/modificar:**
```
✓ pom.xml
✓ src/main/java/.../service/CulqiService.java
✓ src/main/java/.../service/WebhookRetryService.java
✓ src/main/java/.../controller/CulqiWebhookController.java
✓ src/main/java/.../domain/LogTransaccion.java
✓ src/main/java/.../domain/WebhookEvent.java
✓ src/main/java/.../dto/CulqiWebhookRequest.java
✓ src/main/java/.../repository/LogTransaccionRepository.java
✓ src/main/java/.../repository/WebhookEventRepository.java
```

---

### 4. **CULQI_CONFIG_TESTING.md** 🧪 (Configuración y Testing)
**Audiencia:** DevOps, QA Engineers, Developers  
**Duración de lectura:** 1 hora (setup) + testing

**Contenido:**
- Migrations de Flyway (BD)
- Índices para performance
- EncryptionService para credenciales
- SecurityConfig updates
- Tests unitarios (CulqiServiceTest)
- Tests de integración (CulqiWebhookIntegrationTest)
- Load tests (100 eventos concurrentes)
- Scripts de testing manual (bash + curl)
- Postman collection
- Métricas Micrometer
- Troubleshooting common issues

**Cuándo leer:**
- Vas a configurar la BD
- Vas a escribir tests
- Vas a hacer debugging
- Necesitas scripts de testing manual

**Acciones:**
```bash
# 1. Crear migraciones
src/main/resources/db/migration/V003__create_log_transacciones.sql

# 2. Crear servicios de seguridad
src/main/java/.../security/EncryptionService.java

# 3. Ejecutar tests
mvn test -Dtest=CulqiServiceTest
mvn test -Dtest=CulqiWebhookIntegrationTest

# 4. Load testing
mvn test -Dtest=LoadTestCulqiWebhook

# 5. Testing manual
scripts/test-culqi-webhook.sh
```

---

### 5. **CULQI_OPERATIONS_RUNBOOK.md** 🚨 (Operaciones)
**Audiencia:** DevOps, SRE, Operations Team  
**Duración de lectura:** 30 minutos (referencia rápida)

**Contenido:**
- Health checks diarios
- Procedimientos de reconciliación
- Troubleshooting por problema
- Procedimientos para incidentes críticos
- Procedimiento de refunds
- Auditoría y reportes
- Escalation tree
- Scripts bash listos para copiar/pegar

**Cuándo leer:**
- Estás en on-call
- Hay un problema en producción
- Necesitas verificar health
- Necesitas procesar un refund

**Acciones Rápidas:**
```bash
# Health check
./scripts/daily-health-check.sh

# Troubleshooting
./scripts/troubleshoot-webhooks.sh

# Refund
./scripts/refund.sh order-123 500

# Reportes
./scripts/monthly-compliance-report.sh "2026-07"
```

---

## 🗂️ Estructura de Archivos

```
mercadolink-b2b/
│
├── 📚 DOCUMENTACIÓN CULQI (Este directorio)
│   ├── CULQI_EXECUTIVE_SUMMARY.md         ← Empieza aquí
│   ├── CULQI_DEPLOYMENT_PLAN.md           ← Plan maestro
│   ├── CULQI_IMPLEMENTATION_GUIDE.md      ← Guía técnica
│   ├── CULQI_CONFIG_TESTING.md            ← Setup y testing
│   ├── CULQI_OPERATIONS_RUNBOOK.md        ← Operaciones
│   └── README.md (este archivo)
│
├── 📦 CÓDIGO BACKEND (a crear/modificar)
│   └── src/main/java/pe/aspropa/mercadolink/
│       ├── service/
│       │   ├── CulqiService.java          ← API integration
│       │   ├── WebhookRetryService.java   ← Reintentos
│       │   ├── CulqiReconciliationService.java ← Reconciliación
│       │   └── CulqiMetricsService.java   ← Métricas
│       ├── controller/
│       │   ├── CulqiWebhookController.java ← Webhooks
│       │   └── CulqiDashboardController.java ← Dashboard
│       ├── domain/
│       │   ├── LogTransaccion.java
│       │   ├── WebhookEvent.java
│       │   └── ConfiguracionCulqi.java
│       ├── dto/
│       │   └── CulqiWebhookRequest.java
│       ├── repository/
│       │   ├── LogTransaccionRepository.java
│       │   └── WebhookEventRepository.java
│       └── security/
│           └── EncryptionService.java
│
├── 🗄️ CONFIGURACIÓN
│   ├── pom.xml                            ← Dependencias Maven
│   ├── src/main/resources/
│   │   ├── application.yml                ← Config base
│   │   ├── application-culqi-sandbox.yml  ← Sandbox
│   │   └── application-prod.yml           ← Producción
│   └── src/main/resources/db/migration/
│       └── V003__create_log_transacciones.sql
│
├── 🧪 TESTING
│   ├── src/test/java/.../CulqiServiceTest.java
│   ├── src/test/java/.../CulqiWebhookIntegrationTest.java
│   └── src/test/java/.../LoadTestCulqiWebhook.java
│
└── 📊 SCRIPTS
    └── scripts/
        ├── test-culqi-webhook.sh          ← Testing manual
        ├── daily-health-check.sh          ← Health check
        ├── troubleshoot-webhooks.sh       ← Debugging
        ├── refund.sh                      ← Procesar refund
        └── monthly-compliance-report.sh   ← Reportes
```

---

## 🚀 Quick Start (5 minutos)

### Para Entender Rápidamente (10 min)
```
1. Lee: CULQI_EXECUTIVE_SUMMARY.md (Resumen ejecutivo)
2. Ve: Diagrama de arquitectura en CULQI_DEPLOYMENT_PLAN.md
3. Entend: Flujos de negocio en CULQI_DEPLOYMENT_PLAN.md
```

### Para Implementar (20-25 días)
```
Semana 1: CULQI_IMPLEMENTATION_GUIDE.md
Semana 2: CULQI_CONFIG_TESTING.md + coding
Semana 3: Testing exhaustivo
Semana 4: Preparar producción
Semana 5-6: Deploy y monitoreo
```

### Para Operar (On-call)
```
1. Lee: CULQI_OPERATIONS_RUNBOOK.md (completo)
2. Guarda: Los scripts bash en PATH
3. Consulta: Sección de troubleshooting cuando hay problemas
```

---

## 📋 Checklist de Lectura Recomendada

### Por Rol

**👔 Ejecutivos / Product Managers**
- [ ] CULQI_EXECUTIVE_SUMMARY.md (completo)
- [ ] CULQI_DEPLOYMENT_PLAN.md (Resumen ejecutivo + Arquitectura)

**🏗️ Arquitectos / Tech Leads**
- [ ] CULQI_DEPLOYMENT_PLAN.md (completo)
- [ ] CULQI_IMPLEMENTATION_GUIDE.md (Partes 1-5)
- [ ] CULQI_CONFIG_TESTING.md (Partes 7-8)

**💻 Desarrolladores Backend**
- [ ] CULQI_IMPLEMENTATION_GUIDE.md (completo)
- [ ] CULQI_CONFIG_TESTING.md (completo)
- [ ] CULQI_OPERATIONS_RUNBOOK.md (referencia)

**🔧 DevOps / SRE**
- [ ] CULQI_DEPLOYMENT_PLAN.md (Despliegue)
- [ ] CULQI_CONFIG_TESTING.md (Configuración)
- [ ] CULQI_OPERATIONS_RUNBOOK.md (completo)
- [ ] Scripts en `scripts/` directory

**🧪 QA / Testing**
- [ ] CULQI_IMPLEMENTATION_GUIDE.md (Testing)
- [ ] CULQI_CONFIG_TESTING.md (completo)
- [ ] CULQI_OPERATIONS_RUNBOOK.md (Troubleshooting)

---

## 🔑 Conceptos Clave a Entender

### 1. **Webhooks**
Los webhooks son notificaciones HTTP que Culqi envía a tu servidor cuando ocurre un evento (pago aprobado, rechazado, etc.).

**Puntos críticos:**
- ✅ Procesar INMEDIATAMENTE (< 2 segundos)
- ✅ Validar firma HMAC-SHA256
- ✅ Retornar 202 Accepted
- ✅ Procesar en background async
- ✅ Idempotencia (mismo evento puede llegar 2+ veces)

### 2. **Reconciliación**
Sincronización periódica con Culqi API para detectar transacciones que el webhook no procesó.

**Cuándo es necesaria:**
- Webhook se perdió
- Webhook llegó pero falló el procesamiento
- Timeout esperando webhook

### 3. **Reintentos**
Si un webhook falla, reintentar automáticamente con exponential backoff.

**Configuración:**
- Max intentos: 5
- Backoff inicial: 1 segundo
- Backoff máximo: 300 segundos

### 4. **Idempotencia**
Procesar el mismo webhook múltiples veces debe dar el mismo resultado.

**Implementación:**
- Usar webhook ID (culqi_event_id) para deduplicar
- Verificar en BD si ya fue procesado
- Si ya procesado, retornar 202 OK

---

## 🔐 Seguridad - Puntos Críticos

```
🔴 NUNCA:
- Hardcodear credenciales en código
- Loguear credenciales completas
- Confiar en headers sin validar
- Procesar webhook sin validar firma

✅ SIEMPRE:
- Usar Azure Key Vault para credenciales
- Validar HMAC-SHA256
- Validar timestamp (±5 min)
- Procesar en < 2 segundos
- Mantener audit trail (7 años)
- Usar HTTPS/TLS 1.3
```

---

## 📊 Métricas Importantes

Monitorear diariamente:

| Métrica | Target | Alerta |
|---------|--------|--------|
| Tasa de Conversión | >95% | <90% |
| Tiempo de Procesamiento | <5s | >10s |
| Disponibilidad API | >99.5% | <99% |
| Error Rate Webhooks | <0.1% | >1% |
| Transacciones Pendientes | <5 | >20 |

---

## 🆘 Problemas Frecuentes

| Problema | Referencia |
|----------|-----------|
| Webhook signature fails | CULQI_CONFIG_TESTING.md → Troubleshooting |
| Transacciones quedan PENDIENTE | CULQI_OPERATIONS_RUNBOOK.md → Problema: Pendiente |
| Tasa alta de errores | CULQI_OPERATIONS_RUNBOOK.md → Problema: High Error Rate |
| API no disponible | CULQI_OPERATIONS_RUNBOOK.md → Incidentes Críticos |
| Necesito hacer refund | CULQI_OPERATIONS_RUNBOOK.md → Refunds |

---

## 📞 Contactos

| Función | Contacto | Email |
|---------|----------|-------|
| Culqi Support | Equipo Culqi | soporte@culqi.com |
| Culqi API Team | Equipo Culqi | api@culqi.com |
| MercadoLink Pagos | Team | pagos@aspropa.pe |
| On-Call Developer | (rotativo) | oncall@aspropa.pe |
| DevOps Lead | (asignado) | devops@aspropa.pe |

---

## 🔗 Enlaces Útiles

### Documentación Oficial
- [Culqi API Docs](https://culqi.com/docs/api)
- [Culqi Webhooks](https://culqi.com/docs/webhooks)
- [Culqi Security](https://culqi.com/docs/security)

### Herramientas Internas
- [GitHub Repo](https://github.com/Leo759142/mercadolink-b2b)
- [Azure Portal](https://portal.azure.com)
- [Grafana Dashboard](https://grafana.aspropa.pe/mercadolink)

### Testing
- [Postman Collection](./postman-culqi-collection.json)
- [cURL Scripts](./scripts/)

---

## 📈 Estadísticas de Documentación

| Métrica | Valor |
|---------|-------|
| Total de documentos | 5 |
| Páginas de documentación | ~100 |
| Líneas de código de ejemplo | ~2,000 |
| Tests incluidos | 5+ |
| Scripts bash | 6 |
| Diagramas | 3 |
| Horas de lectura (full) | 4-5 horas |
| Horas de implementación | 20-25 días |

---

## ✅ Checklist Final Pre-Implementación

- [ ] Leo entendió el plan completo (EXEC_SUMMARY)
- [ ] Arquitecto aprobó el diseño (DEPLOYMENT_PLAN)
- [ ] Desarrolladores leyeron IMPLEMENTATION_GUIDE
- [ ] DevOps leyeron OPERATIONS_RUNBOOK
- [ ] QA leyeron CONFIG_TESTING
- [ ] Credenciales Culqi sandbox obtenidas
- [ ] Equipo capacitado
- [ ] Presupuesto aprobado
- [ ] Timeline confirmado

---

## 🎯 Próximos Pasos

### Inmediato (Esta semana)
```
1. Leer CULQI_EXECUTIVE_SUMMARY.md
2. Leer CULQI_DEPLOYMENT_PLAN.md (Resumen + Arquitectura)
3. Agendar kickoff meeting
4. Obtener credenciales Culqi sandbox
```

### Corto Plazo (Semana 1-2)
```
1. Implementar CulqiService.java
2. Implementar CulqiWebhookController.java
3. Crear modelos de datos
4. Escribir tests unitarios
```

### Mediano Plazo (Semana 3-4)
```
1. Testing exhaustivo
2. Load testing
3. Security review
4. Deploy a staging
```

### Largo Plazo (Semana 5-6)
```
1. Credenciales producción
2. Deploy a producción
3. Monitoreo 24h
4. Migración de datos históricos
```

---

## 📝 Versionado de Documentación

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Julio 2026 | Documento inicial |

**Próxima revisión:** Octubre 2026

---

## 📄 Licencia y Confidencialidad

Esta documentación es **CONFIDENCIAL** y de uso exclusivo de MercadoLink / Aspropa.

Contiene:
- Secretos técnicos de integración
- Procedimientos de operación
- Información sensible de pagos
- Credenciales (cifradas)

**Distribución:** Solo al equipo autorizado  
**Retención:** Mínimo 2 años  
**Acceso:** Controlado por Azure Key Vault  

---

**Documento Maestro**  
**Versión:** 1.0  
**Fecha:** Julio 2026  
**Estado:** 🟢 LISTO PARA IMPLEMENTACIÓN  
**Mantenido por:** Leo759142 + Team  

---

*Última actualización: Julio 2026*  
*Para actualizaciones, contactar: pagos@aspropa.pe*

