package pe.aspropa.mercadolink.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import pe.aspropa.mercadolink.domain.Pago;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.PagoService;
import pe.aspropa.mercadolink.service.QulqiSimulationService;

@RestController
@RequestMapping("/api/v1/pagos")
@Tag(name = "Pagos", description = "Integración con Izipay para procesar pagos B2B")
public class PagoController {

    private final PagoService pagoService;
    private final QulqiSimulationService qulqiService;

    public PagoController(PagoService pagoService, QulqiSimulationService qulqiService) {
        this.pagoService = pagoService;
        this.qulqiService = qulqiService;
    }

    @PostMapping("/iniciar/{pedidoId}")
    @Operation(summary = "Inicia una sesión de pago en Izipay y retorna el formToken")
    public ResponseEntity<PagoService.IniciarPagoResult> iniciar(
            @PathVariable String pedidoId,
            @AuthenticationPrincipal AuthenticatedActor principal) {
        return ResponseEntity.ok(pagoService.iniciarPago(pedidoId, principal.actorId()));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Consulta el estado del pago por orderId")
    public Pago consultar(@PathVariable String orderId) {
        return pagoService.obtenerPorOrderId(orderId);
    }

    @PostMapping("/simulacion/qulqi")
    @Operation(summary = "[SIMULADO] Retorna datos para testing con Qulqi mock")
    public ResponseEntity<QulqiSimulationService.QulqiSession> simularQulqi(
            @RequestParam String orderId,
            @RequestParam String monto) {
        java.math.BigDecimal amount = new java.math.BigDecimal(monto);
        QulqiSimulationService.QulqiSession session = qulqiService
            .createPaymentSession(orderId, amount, "PEN");
        return ResponseEntity.ok(session);
    }
}

