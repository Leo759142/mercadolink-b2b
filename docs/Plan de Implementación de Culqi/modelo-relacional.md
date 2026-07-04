# Plan Expres - Modelo Relacional Culqi

## 1. Tablas actuales involucradas

- `pedidos`
- `items_pedido`
- `pagos`
- `notificaciones`
- `actores`

## 2. Problemas actuales

- No hay trazabilidad del `gateway` usado.
- No hay registro de intentos de pago.
- No hay relacion clara entre `orderId` interno y `charge/session` externa.
- Webhook no registra payload crudo ni IP.

## 3. Cambios recomendados

### 3.1 Modificar `pagos`

| Campo | Tipo | Cambio |
|-------|------|--------|
| `gateway` | varchar(20) | Nuevo. `IZIPAY` o `CULQI` |
| `gateway_order_id` | varchar(120) | Nuevo. ID del cargo/sesion en Culqi/Izipay |
| `intentos` | int | Nuevo. Cantidad de reintentos de pago |
| `webhook_payload` | text | Nuevo. Payload crudo del webhook |
| `webhook_ip` | varchar(45) | Nuevo. IP origen del webhook |
| `ultimo_error` | varchar(500) | Nuevo. Mensaje de error del gateway |

### 3.2 Agregar `pago_intentos`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | bigint auto | PK |
| `pago_id` | uuid | FK a `pagos` |
| `fecha` | timestamp | Momento del intento |
| `estado` | varchar(20) | PENDIENTE, APROBADO, RECHAZADO |
| `codigo_respuesta` | varchar(50) | Codigo del gateway |
| `mensaje` | varchar(500) | Detalle del gateway |
| `ip_cliente` | varchar(45) | IP del cliente en checkout |

## 4. Indices recomendados

```sql
CREATE INDEX idx_pagos_order_id ON pagos(order_id);
CREATE INDEX idx_pagos_gateway_order_id ON pagos(gateway_order_id);
CREATE INDEX idx_pagos_pedido_id ON pagos(pedido_id);
CREATE INDEX idx_pago_intentos_pago_id ON pago_intentos(pago_id);
```

## 5. Migracion exprés (H2)

```sql
ALTER TABLE pagos ADD COLUMN gateway varchar(20);
ALTER TABLE pagos ADD COLUMN gateway_order_id varchar(120);
ALTER TABLE pagos ADD COLUMN intentos int DEFAULT 0;
ALTER TABLE pagos ADD COLUMN webhook_payload text;
ALTER TABLE pagos ADD COLUMN webhook_ip varchar(45);
ALTER TABLE pagos ADD COLUMN ultimo_error varchar(500);

CREATE TABLE pago_intentos (
    id bigint auto_increment PRIMARY KEY,
    pago_id uuid NOT NULL,
    fecha timestamp NOT NULL,
    estado varchar(20) NOT NULL,
    codigo_respuesta varchar(50),
    mensaje varchar(500),
    ip_cliente varchar(45)
);
```

## 6. Impacto

- Cambios minimos en esquema actual.
- No rompe tablas existentes.
- Permite multi-gateway sin migrar datos.
