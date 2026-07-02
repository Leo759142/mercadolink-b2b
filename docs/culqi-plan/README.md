# Indice - Plan Expres Culqi

- `arquitectura.md` - Problemas actuales y arquitectura objetivo
- `modelo-relacional.md` - Cambios en tablas y migracion
- `metodo-pago.md` - Servicio unificado de pagos
- `simulacion.md` - Simulacion backend y frontend
- `produccion.md` - Checklist y rollout

Resumen:
- Unificar Izipay y Culqi en `PaymentService`.
- Crear `Pago` siempre al iniciar sesion.
- Webhook con HMAC-SHA256.
- Simulacion backend pura.
- Produccion en 7 dias.
