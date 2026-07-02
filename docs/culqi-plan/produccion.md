# Plan Expres - Produccion Culqi

## 1. Checklist pre-produccion

- [ ] Configurar `app.culqi.api-key` y `app.culqi.private-key` en vault/prod
- [ ] Cambiar `real-mode=true` solo despues de pruebas
- [ ] Verificar HMAC-SHA256 en webhook
- [ ] Habilitar logs de webhook sin datos sensibles
- [ ] Registrar dominio(s) autorizado(s) en Culqi dashboard
- [ ] Configurar webhook URL publica con HTTPS

## 2. Checklist tecnico

- [ ] Endpoint unificado `/api/v1/pagos/iniciar/{pedidoId}?gateway=CULQI`
- [ ] `Pago` con `gateway`, `gateway_order_id`, `intentos`
- [ ] Webhook con idempotencia y validacion de firma
- [ ] Reintentos automaticos solo para `PENDIENTE`
- [ ] Notificaciones al cliente y proveedor por estado

## 3. Rollout sugerido

| Dia | Accion |
|-----|--------|
| 1 | Unificar flujo en `PaymentService` (backend) |
| 2 | Migrar `/api/v1/culqi/iniciar` al nuevo flujo |
| 3 | Corregir webhook signature |
| 4 | Simulacion backend + frontend |
| 5 | Pruebas end-to-end en dev |
| 6 | Pruebas en staging con Culqi sandbox |
| 7 | Produccion: habilitar Culqi real |
