# Plan Expres - Metodo de Pago Unificado

## 1. Estado actual

- `PagoService.iniciarPago()` solo soporta Izipay.
- `CulqiWebhookController` crea sesiones Culqi sin crear `Pago`.
- Dos flujos distintos que convergen en webhook.

## 2. Propuesta

Crear `PaymentService` con metodo `iniciarPago(pedidoId, gateway)`.

```java
public class PaymentService {
    public Pago iniciarPago(String pedidoId, Gateway gateway) {
        Pedido pedido = pedidoService.obtener(pedidoId);
        validarEstadoPago(pedido);
        Pago pago = pagoRepository.findByPedidoId(pedidoId)
                .orElseGet(() -> crearPago(pedido));
        String session = gatewayFactory.get(gateway).createSession(pago);
        pago.setGateway(gateway.name());
        pago.setGatewayOrderId(extraerGatewayOrderId(session));
        return pagoRepository.save(pago);
    }
}
```

## 3. Gateways

- `IZIPAY`: usa `IzipayService` existente.
- `CULQI`: usa `CulqiService` existente.

Ambos exponen:
- `createSession(Pago pago)` -> `PaymentSession`
- `validateWebhook(payload, signature)` -> boolean
- `name()` -> String

## 4. Frontend

- Un solo componente `Checkout` que recibe `gateway` y `orderId`.
- Renderiza formulario Culqi o redirige a Izipay segun config.
- En simulacion, usa modo deterministico sin tocar backend real.

## 5. Beneficios

- Un solo endpoint para pagos: `/api/v1/pagos/iniciar/{pedidoId}?gateway=CULQI`
- Webhook unificado en `PagoService`
- Facil agregar nuevos gateways sin tocar controladores
