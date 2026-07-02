# Plan Expres - Arquitectura Culqi

## 1. Problemas actuales detectados

| # | Problema | Severidad |
|---|---------|-----------|
| 1 | `/api/v1/culqi/iniciar` **no crea** registro `Pago`, solo genera sesión | Alta |
| 2 | Validación de webhook usa SHA256 plano; Culqi espera HMAC-SHA256 | Alta |
| 3 | Flujo Izipay y Culqi están desalineados: uno pasa por `PagoService`, el otro no | Alta |
| 4 | El frontend simula webhook manual, frágil | Media |
| 5 | Naming confuso: `Qulqi` vs `Culqi` | Media |
| 6 | Falta idempotencia robusta en webhook | Alta |
| 7 | No hay mapeo claro entre `gateway_order_id` e `internal_order_id` | Media |

## 2. Objetivo

Unificar pagos en un **gateway-agnostic** `PaymentService` que soporte:
- Izipay y Culqi como proveedores
- Simulación determinista en dev/test
- Webhook seguro con firma verificada
- Trazabilidad completa (estados, montos, intentos)

## 3. Arquitectura objetivo

```
Frontend
  │
  ▼
PagoController (unificado)
  │
  ▼
PaymentService (orquestador)
  │
  ├─ PaymentGatewayFactory
  │     ├─ IzipayGateway
  │     └─ CulqiGateway
  │
  ├─ PagoRepository (persistencia)
  ├─ PedidoService (estado del pedido)
  └─ InventarioService (reserva/confirmacion)
```

## 4. Cambios minimos sugeridos (paso 1)

1. Hacer que `/api/v1/culqi/iniciar/{pedidoId}` cree el `Pago` antes de crear la sesion Culqi.
2. Corregir `validarFirmaWebhook` por HMAC-SHA256.
3. Mover lógica comun de webhook a `PagoService`.
4. Agregar campo `gateway` en `Pago` (`IZIPAY` | `CULQI`).
5. Eliminar `/api/v1/pagos/simulacion/qulqi` o renombrar a Culqi.

## 5. Siguientes pasos

- Ver `modelo-relacional.md` para cambios en tablas.
- Ver `simulacion.md` para flujo de pruebas y simulacion estable.
