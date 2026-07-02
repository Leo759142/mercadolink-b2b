# Runbook de Operaciones - Culqi Integration

## 🚨 Tabla de Contenidos

1. [Inicialización](#inicialización)
2. [Procedimientos Diarios](#procedimientos-diarios)
3. [Troubleshooting](#troubleshooting)
4. [Incidentes Críticos](#incidentes-críticos)
5. [Refunds y Reembolsos](#refunds-y-reembolsos)
6. [Auditoría y Reportes](#auditoría-y-reportes)

---

## 🔧 Inicialización

### Pre-requisitos
- [ ] Acceso a Azure Portal
- [ ] Acceso a Azure Key Vault
- [ ] Acceso a Application Insights
- [ ] Acceso a Grafana/Dashboard
- [ ] Credenciales de Culqi (sandbox y producción)

### Verificación Inicial Diaria

```bash
#!/bin/bash
# 1. Verificar que la aplicación está corriendo
curl -s http://localhost:8080/actuator/health | jq .

# 2. Verificar conectividad a Culqi
curl -s -H "Authorization: Bearer sk_test_xxxxx" \
  https://api.culqi.com/v2/merchant | jq .

# 3. Verificar logs de la última hora
az webapp log tail --resource-group mercadolink-rg \
  --name mercadolink-prod | tail -50

# 4. Verificar métricas clave
az monitor metrics list --resource mercadolink-prod \
  --metric culqi.webhook.received --statistics Average

# 5. Verificar alertas activas
az monitor metrics alert list --resource-group mercadolink-rg
```

---

## 📋 Procedimientos Diarios

### 1. Health Check Matutino (9:00 AM)

```bash
#!/bin/bash

echo "=== HEALTH CHECK $(date) ==="

# Check 1: Application Health
echo "1. Application Health..."
HEALTH=$(curl -s http://localhost:8080/actuator/health | jq -r '.status')
if [ "$HEALTH" != "UP" ]; then
  echo "⚠️  WARNING: Application health is $HEALTH"
  # Alertar
else
  echo "✓ Application is UP"
fi

# Check 2: Database Connectivity
echo "2. Database Connectivity..."
DB_HEALTH=$(curl -s http://localhost:8080/actuator/health/db | jq -r '.status')
if [ "$DB_HEALTH" != "UP" ]; then
  echo "🔴 CRITICAL: Database is DOWN"
  exit 1
else
  echo "✓ Database is UP"
fi

# Check 3: Culqi API
echo "3. Culqi API Connectivity..."
CULQI_TEST=$(curl -s -H "Authorization: Bearer $CULQI_API_KEY" \
  https://api.culqi.com/v2/merchant)
if echo "$CULQI_TEST" | grep -q "error"; then
  echo "⚠️  WARNING: Culqi API error"
else
  echo "✓ Culqi API is available"
fi

# Check 4: Recent Transactions
echo "4. Recent Transactions..."
RECENT=$(curl -s http://localhost:8080/api/v1/pagos/stats/recent | jq '.count')
echo "✓ Processed $RECENT transactions in last hour"

# Check 5: Pending Webhooks
echo "5. Pending Webhooks..."
PENDING=$(psql -h $DB_HOST -U $DB_USER -d mercadolink \
  -c "SELECT COUNT(*) FROM webhook_events WHERE processed = false;" | tail -1)
if [ "$PENDING" -gt "10" ]; then
  echo "⚠️  WARNING: $PENDING webhooks pending"
else
  echo "✓ Only $PENDING webhooks pending"
fi

echo "=== HEALTH CHECK COMPLETE ==="
```

### 2. Reconciliación Horaria

```bash
#!/bin/bash

echo "=== HOURLY RECONCILIATION $(date) ==="

# Ejecutar reconciliación
curl -X POST http://localhost:8080/api/v1/culqi/reconcile \
  -H "Authorization: Bearer $SYSTEM_TOKEN" \
  -H "Content-Type: application/json"

echo "Reconciliation initiated"

# Esperar 5 minutos y verificar resultados
sleep 300

# Verificar discrepancias
DISCREPANCIES=$(psql -h $DB_HOST -U $DB_USER -d mercadolink \
  -c "SELECT COUNT(*) FROM log_transacciones 
      WHERE estado = 'PENDIENTE' 
      AND updated_at < NOW() - INTERVAL '2 hours';" | tail -1)

if [ "$DISCREPANCIES" -gt "0" ]; then
  echo "⚠️  WARNING: Found $DISCREPANCIES transactions pending for >2h"
  # Alertar al team
fi

echo "=== RECONCILIATION COMPLETE ==="
```

### 3. Reporte Diario de Transacciones (5:00 PM)

```bash
#!/bin/bash

echo "=== DAILY TRANSACTION REPORT $(date) ==="

# Query: Estadísticas del día
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  DATE(created_at) as fecha,
  estado,
  COUNT(*) as total_transacciones,
  SUM(monto) as monto_total,
  AVG(monto) as monto_promedio,
  MIN(monto) as monto_minimo,
  MAX(monto) as monto_maximo
FROM log_transacciones
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY DATE(created_at), estado
ORDER BY estado;
" | mail -s "Daily Transaction Report" pagos@aspropa.pe

echo "Report sent"
```

---

## 🔍 Troubleshooting

### Problema: Webhook signature validation fails

**Síntomas:**
```
[ERROR] Webhook signature mismatch. EventID: evt_xxx
[HTTP] 401 Unauthorized
```

**Diagnóstico:**
```bash
# 1. Verificar que el secret está correcto
echo -n "whsec_xxxxxxxxx" | wc -c
# Debería tener ~20+ caracteres

# 2. Verificar que el payload es exacto (sin espacios)
curl -X GET "http://localhost:8080/api/v1/culqi/debug/last-webhook" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.payload' | wc -c

# 3. Prueba con firma generada localmente
PAYLOAD='{"test":"payload"}'
SIGNATURE=$(echo -n "$PAYLOAD" | \
  openssl dgst -sha256 -hmac "$CULQI_WEBHOOK_SECRET" | cut -d ' ' -f2)

curl -X POST "http://localhost:8080/api/v1/culqi/webhook" \
  -H "X-Culqi-Signature: $SIGNATURE" \
  -H "X-Culqi-Request-ID: test-123" \
  -d "$PAYLOAD"
```

**Solución:**
1. Validar que `CULQI_WEBHOOK_SECRET` en Key Vault es igual a Culqi Dashboard
2. Re-generar secret en Culqi Dashboard si es necesario
3. Actualizar en Key Vault
4. Reiniciar aplicación

---

### Problema: Transacciones quedan en estado PENDIENTE

**Síntomas:**
```
- Cliente pagó pero estado sigue PENDIENTE
- Inventario no se libera
- Email de confirmación no enviado
```

**Diagnóstico:**
```bash
# 1. Verificar LogTransaccion
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT id, order_id, estado, webhook_received_at, updated_at
FROM log_transacciones
WHERE estado = 'PENDIENTE'
ORDER BY created_at DESC
LIMIT 10;
"

# 2. Verificar WebhookEvent asociado
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT id, culqi_event_id, tipo, processed, retry_count, processing_error
FROM webhook_events
WHERE processed = false
LIMIT 10;
"

# 3. Verificar logs de aplicación
az webapp log tail --resource-group mercadolink-rg \
  --name mercadolink-prod | grep "webhook\|payment"
```

**Soluciones Posibles:**

#### Opción A: Webhook nunca llegó
```bash
# 1. Verificar en Culqi Dashboard → Webhooks
# Buscar si el evento está en el log de Culqi

# 2. Si no aparece, re-procesar desde Culqi
# (Contactar con Culqi support)
```

#### Opción B: Webhook llegó pero falló el procesamiento
```bash
# 1. Revisar error en webhook_events.processing_error
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT processing_error FROM webhook_events
WHERE culqi_event_id = 'evt_xxxxx';
"

# 2. Procesar manualmente
curl -X POST "http://localhost:8080/api/v1/culqi/webhook/replay" \
  -H "Authorization: Bearer $SYSTEM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhook_id":"webhook-uuid-here"}'
```

#### Opción C: Reconciliación
```bash
# 1. Ejecutar reconciliación
curl -X POST "http://localhost:8080/api/v1/culqi/reconcile" \
  -H "Authorization: Bearer $SYSTEM_TOKEN"

# 2. Esto consultará Culqi API por el estado actual
# 3. Si está APROBADO en Culqi, actualizará localmente
```

---

### Problema: Tasa alta de errores de webhook

**Síntomas:**
```
- Métricas: culqi.webhook.error > 5%
- Muchos reintentos (retry_count >= 3)
- Clientes reportan problemas de pagos
```

**Diagnóstico:**
```bash
# 1. Ver distribución de errores
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  processing_error,
  COUNT(*) as count
FROM webhook_events
WHERE processed = false
GROUP BY processing_error
ORDER BY count DESC
LIMIT 10;
"

# 2. Ver errores en logs de aplicación
az webapp log tail --resource-group mercadolink-rg \
  --name mercadolink-prod --filter "ERROR\|Exception" | tail -100

# 3. Ver métricas de performance
az monitor metrics list --resource mercadolink-prod \
  --metric culqi.payment.processing.time \
  --statistics Average,Maximum
```

**Soluciones Comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| `NullPointerException` | Payload malformado | Validar schema del webhook |
| `Database connection timeout` | Pool exhauste | Aumentar connection pool |
| `Timeout to Culqi API` | API lenta/down | Esperar a recuperación |
| `OutOfMemory` | Leak de memoria | Reiniciar app + investigation |

---

### Problema: API de Culqi no disponible

**Síntomas:**
```
[ERROR] Connection timeout to Culqi API
[ERROR] 503 Service Unavailable from Culqi
```

**Verificación:**
```bash
# 1. Probar conectividad
curl -v https://api.culqi.com/v2/merchant \
  -H "Authorization: Bearer sk_test_xxxxx"

# 2. Verificar status de Culqi
curl https://status.culqi.com/api/v2/status

# 3. Verificar firewall rules en Azure
az network nsg rule list --resource-group mercadolink-rg \
  --nsg-name mercadolink-nsg
```

**Plan de Contingencia:**
```
1. Activar modo "sin-conexión" (si está implementado)
2. Mostrar mensaje de mantenimiento al usuario
3. Almacenar pagos en queue (retry cuando Culqi vuelva)
4. Enviar notificación al equipo de operations
5. Contactar a Culqi support
6. Esperar recuperación y procesar queue
```

---

## 🚨 Incidentes Críticos

### Nivel 1: Página de pagos completamente caída

**Tiempo de Respuesta:** < 15 minutos

```bash
#!/bin/bash

# 1. EVALUAR (2 min)
echo "Step 1: Evaluating..."
STATUS=$(curl -s http://localhost:8080/actuator/health | jq -r '.status')
if [ "$STATUS" = "UP" ]; then
  echo "App is running but endpoint may be broken"
else
  echo "App is down"
fi

# 2. NOTIFICAR (1 min)
echo "Step 2: Notifying..."
slack -c "#incidents" "🚨 CRITICAL: Payment page is down"
pagerduty trigger "Payment Service Down" --urgency high

# 3. INVESTIGAR (5 min)
echo "Step 3: Investigating..."
az webapp log tail --resource-group mercadolink-rg \
  --name mercadolink-prod --follow

# 4. ACTUAR (5 min)
# Si falla por código:
az webapp up --name mercadolink-prod --resource-group mercadolink-rg

# Si falla por DB:
az postgres server show --name mercadolink-db --resource-group mercadolink-rg

# Si falla por Culqi:
# Esperar recuperación + retry

# 5. COMUNICAR (1 min)
slack -c "#incidents" "🔄 Investigating payment outage. Users see: [error message]"
```

### Nivel 2: Muchos webhooks fallando

**Tiempo de Respuesta:** < 30 minutos

```bash
#!/bin/bash

# 1. Quantificar problema
FAILED_COUNT=$(psql -h $DB_HOST -U $DB_USER -d mercadolink \
  -c "SELECT COUNT(*) FROM webhook_events 
      WHERE processed = false AND retry_count >= 3;" | tail -1)

echo "Failed webhooks: $FAILED_COUNT"

if [ "$FAILED_COUNT" -lt "10" ]; then
  # Es normal, dejar reintentos
  exit 0
elif [ "$FAILED_COUNT" -lt "100" ]; then
  # Warning
  slack -c "#payments" "⚠️  WARNING: $FAILED_COUNT failed webhooks"
else
  # Critical
  slack -c "#incidents" "🚨 CRITICAL: $FAILED_COUNT failed webhooks"
  pagerduty trigger "Webhook Processing Failure"
fi

# 2. Investigar causa común
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT processing_error, COUNT(*) as count
FROM webhook_events
WHERE processed = false
GROUP BY processing_error
ORDER BY count DESC;
"

# 3. Si es error de base de datos:
# Revisar logs de PostgreSQL
az postgres server-logs list --resource-group mercadolink-rg \
  --server-name mercadolink-db

# 4. Si es timeout a Culqi:
# Esperar y aumentar timeout
app:
  culqi:
    request-timeout-ms: 45000  # Aumentar de 30000

# 5. Reprocessar fallidos (después de fix)
curl -X POST "http://localhost:8080/api/v1/culqi/webhook/replay-failed" \
  -H "Authorization: Bearer $SYSTEM_TOKEN"
```

### Nivel 3: Fraude / Transacciones Sospechosas

**Tiempo de Respuesta:** < 5 minutos (alertar) + análisis

```bash
#!/bin/bash

echo "🚨 SUSPICIOUS TRANSACTION DETECTED"

# 1. Bloquear transacciones nuevas (si es necesario)
# UPDATE configuracion_culqi SET activo = false WHERE entorno = 'PRODUCCION';

# 2. Extraer información de transacciones sospechosas
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  lt.id, lt.order_id, lt.monto, lt.created_at,
  lt.request_payload, lt.response_payload
FROM log_transacciones lt
WHERE lt.monto > 100000  -- Transacciones grandes
  AND lt.created_at > NOW() - INTERVAL '1 hour'
ORDER BY lt.monto DESC;
" > /tmp/suspicious_transactions.csv

# 3. Notificar a seguridad
slack -c "#security" "🚨 Suspicious transaction detected"
mail -s "ALERT: Suspicious Transactions" security@aspropa.pe \
  < /tmp/suspicious_transactions.csv

# 4. Analizar patrones
# ¿Mismo usuario haciendo múltiples transacciones?
# ¿Misma tarjeta desde diferentes IPs?
# ¿Montos anormales?

# 5. Escalar a equipo de fraude
pagerduty trigger "Potential Fraud Alert" --urgency critical
```

---

## 💰 Refunds y Reembolsos

### Procedimiento de Refund

```bash
#!/bin/bash

# Parámetros
ORDER_ID=$1
AMOUNT=$2  # En soles. Si está vacío, refund total

if [ -z "$ORDER_ID" ]; then
  echo "Usage: ./refund.sh <order_id> [amount]"
  exit 1
fi

# 1. Verificar transacción existe
CHARGE_ID=$(psql -h $DB_HOST -U $DB_USER -d mercadolink \
  -c "SELECT culqi_charge_id FROM log_transacciones 
      WHERE order_id = '$ORDER_ID';" | tail -1)

if [ -z "$CHARGE_ID" ]; then
  echo "ERROR: Transaction not found"
  exit 1
fi

echo "Refunding transaction: ORDER_ID=$ORDER_ID, CHARGE_ID=$CHARGE_ID"

# 2. Solicitar aprobación
read -p "Amount to refund (empty for full): " AMOUNT
read -p "Reason for refund: " REASON
read -p "Approved by (name): " APPROVED_BY

# 3. Registrar intención de refund
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
INSERT INTO refund_requests (order_id, amount, reason, approved_by, status, created_at)
VALUES ('$ORDER_ID', '$AMOUNT', '$REASON', '$APPROVED_BY', 'PENDING', NOW());
"

# 4. Procesar refund en Culqi
curl -X POST https://api.culqi.com/v2/refunds \
  -H "Authorization: Bearer $CULQI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"charge_id\": \"$CHARGE_ID\",
    \"amount\": \"$AMOUNT\"
  }" > /tmp/refund_response.json

# 5. Verificar respuesta
REFUND_ID=$(jq -r '.data.id' /tmp/refund_response.json)
REFUND_STATUS=$(jq -r '.data.status' /tmp/refund_response.json)

if [ "$REFUND_STATUS" = "completed" ]; then
  echo "✓ Refund processed successfully: $REFUND_ID"
  
  # 6. Actualizar en BD
  psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
  UPDATE log_transacciones
  SET estado = 'REEMBOLSADO'
  WHERE order_id = '$ORDER_ID';
  "
  
  # 7. Notificar al cliente
  CUSTOMER_EMAIL=$(psql -h $DB_HOST -U $DB_USER -d mercadolink \
    -c "SELECT p.email FROM pedidos p 
        WHERE p.id = (SELECT pedido_id FROM log_transacciones 
                     WHERE order_id = '$ORDER_ID');" | tail -1)
  
  mail -s "Refund Processed" $CUSTOMER_EMAIL << EOF
Your refund has been processed successfully.
Amount: $AMOUNT soles
Refund ID: $REFUND_ID
The amount will appear in your account within 5-7 business days.
EOF
  
else
  echo "ERROR: Refund failed with status $REFUND_STATUS"
  cat /tmp/refund_response.json
  exit 1
fi

echo "Refund complete"
```

---

## 📊 Auditoría y Reportes

### Reporte Mensual de Compliance

```bash
#!/bin/bash

MONTH=$1  # Ej: "2026-07"

echo "=== MONTHLY COMPLIANCE REPORT: $MONTH ==="

# 1. Transacciones procesadas
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  COUNT(*) as total_transactions,
  SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN estado = 'RECHAZADO' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN estado = 'REEMBOLSADO' THEN 1 ELSE 0 END) as refunded,
  SUM(monto) as total_amount
FROM log_transacciones
WHERE created_at >= '$MONTH-01' AND created_at < DATE_ADD('$MONTH-01', INTERVAL 1 MONTH);
"

# 2. Eventos de webhook
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  tipo,
  COUNT(*) as count,
  SUM(CASE WHEN processed = true THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN processed = false THEN 1 ELSE 0 END) as failed
FROM webhook_events
WHERE received_at >= '$MONTH-01' AND received_at < DATE_ADD('$MONTH-01', INTERVAL 1 MONTH)
GROUP BY tipo;
"

# 3. Tasa de conversión
psql -h $DB_HOST -U $DB_USER -d mercadolink -c "
SELECT 
  ROUND(
    (SUM(CASE WHEN estado = 'APROBADO' THEN 1 ELSE 0 END) * 100.0) /
    COUNT(*), 2) as conversion_rate_percent
FROM log_transacciones
WHERE created_at >= '$MONTH-01' AND created_at < DATE_ADD('$MONTH-01', INTERVAL 1 MONTH);
"

# 4. Exportar a CSV para auditoría
psql -h $DB_HOST -U $DB_USER -d mercadolink \
  -c "\COPY (
    SELECT id, order_id, culqi_charge_id, monto, moneda, estado, 
           created_at, updated_at, webhook_received_at
    FROM log_transacciones
    WHERE created_at >= '$MONTH-01' AND created_at < DATE_ADD('$MONTH-01', INTERVAL 1 MONTH)
  ) TO '/tmp/transactions_$MONTH.csv' WITH CSV HEADER"

echo "Report exported to: /tmp/transactions_$MONTH.csv"

# 5. Enviar a auditoría
mail -s "Monthly Compliance Report - $MONTH" audit@aspropa.pe \
  -a "/tmp/transactions_$MONTH.csv"
```

---

## 📞 Escalation Tree

```
Level 1: Developer On-Call
├─ Responde en 15 min
├─ Investiga problema
└─ Si no puede resolver → Escalate

Level 2: Payment Team Lead
├─ Responde en 30 min
├─ Coordina con Culqi
└─ Si crítico → Escalate

Level 3: Engineering Manager
├─ Responde en 1 hora
├─ Autoriza acciones extremas
└─ Comunica a stakeholders

Level 4: CTO
├─ Responde en 2 horas
├─ Toma decisiones arquitectónicas
└─ Escala a C-level si es necesario
```

---

**Última Actualización:** Julio 2026  
**Versión:** 1.0  
**Próxima Revisión:** Octubre 2026

