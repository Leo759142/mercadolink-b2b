# Plan Expres - Simulacion Culqi

## 1. Problema actual

- Frontend llama a `/api/v1/culqi/iniciar/{pedidoId}` y luego POST a `/api/v1/culqi/webhook` manualmente.
- Order IDs pueden divergir entre backend y frontend.
- No hay timeouts ni validaciones de monto en simulacion.

## 2. Propuesta

### 2.1 Simulacion backend pura

Nuevo endpoint:
```
POST /api/v1/pagos/simulacion/culqi
Body: { pedidoId, monto, moneda = "PEN" }
```

Valida:
- Pedido existe y esta en `PENDIENTE_PAGO`
- No hay `Pago` duplicado para el pedido
- Monto > 0

Crea:
- `Pago` con estado `PENDIENTE`
- `PagoIntento` con estado `APROBADO`
- Registra webhook simulado con payload generado

Retorna:
```json
{
  "pagoId": "uuid",
  "estado": "PENDIENTE",
  "simulacion": {
    "resultado": "APROBADO",
    "orderId": "ORD-xxx",
    "transactionId": "txn-sim-xxx"
  }
}
```

### 2.2 Simulacion frontend

- Quitar POST manual a webhook desde frontend.
- Usar `/api/v1/pagos/simulacion/culqi` como flujo completo.
- Mostrar estado real desde backend.

## 3. Implementacion exprés

### Backend
```java
@PostMapping("/simulacion/culqi")
public PagoSimulacionResponse simularCulqi(@RequestBody SimulacionRequest req) {
    Pedido pedido = pedidoService.obtener(req.pedidoId());
    validarPago(pedido);
    Pago pago = crearPago(pedido, Gateway.CULQI);
    PagoIntento intento = registrarIntento(pago, "APROBADO", "SIMULADO", null);
    pago.setEstado(EstadoPago.APROBADO);
    pago.setTransactionId("txn-sim-" + UUID.randomUUID());
    pagoRepository.save(pago);
    return new PagoSimulacionResponse(pago, intento);
}
```

### Frontend
```js
const simularPago = async (pedidoId, monto) => {
  const { data } = await paymentsAPI.simularCulqi({ pedidoId, monto });
  if (data.simulacion.resultado === 'APROBADO') {
    toast.success('Pago aprobado');
    navigate('/pedidos');
  }
};
```
