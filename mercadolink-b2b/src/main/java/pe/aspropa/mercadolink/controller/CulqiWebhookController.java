package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.dto.CulqiWebhookRequest;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.service.CulqiService;
import pe.aspropa.mercadolink.service.PagoService;

import java.util.Map;

/**
 * Endpoints para Culqi - soporta modo simulación y real.
 */
@RestController
@RequestMapping("/api/v1/culqi")
@Tag(name = "Culqi", description = "Webhooks y helpers para integración Culqi")
public class CulqiWebhookController {

    private static final Logger log = LoggerFactory.getLogger(CulqiWebhookController.class);

    private final CulqiService culqiService;
    private final PagoService pagoService;

    public CulqiWebhookController(CulqiService culqiService, PagoService pagoService) {
        this.culqiService = culqiService;
        this.pagoService = pagoService;
    }

    @PostMapping("/webhook")
    @Operation(summary = "Recibe el webhook de Culqi; valida firma y procesa en background")
    public ResponseEntity<Map<String, String>> webhook(
            @RequestHeader(value = "Content-Signature", required = false) String signature,
            @Valid @RequestBody CulqiWebhookRequest req) {
        if (!culqiService.isValidSignature(req.getOrderId(), signature)) {
            log.warn("Webhook Culqi con firma inválida orderId={}", req.getOrderId());
            throw BusinessException.forbidden("EX-AUTH-002", "Firma inválida");
        }
        String estado = mapEstadoCulqi(req.getStatus());
        pagoService.procesarWebhookAsync(
                req.getOrderId(), req.getTransactionId(),
                estado, req.getAmount());
        return ResponseEntity.accepted().body(Map.of(
                "estado", "RECIBIDO",
                "orderId", req.getOrderId()));
    }

    @PostMapping("/iniciar/{pedidoId}")
    @Operation(summary = "Inicia un pago Culqi para un pedido (modo simulación o real)")
    public ResponseEntity<CulqiService.SesionResponse> iniciarPago(
            @PathVariable String pedidoId,
            @RequestParam String monto) {
        var sesion = culqiService.createPaymentSession(
                pedidoId, new java.math.BigDecimal(monto), "PEN");
        return ResponseEntity.ok(sesion);
    }

    @PostMapping("/firmar")
    @Operation(summary = "[SIMULADO] Genera una firma válida para probar el webhook")
    public Map<String, String> firmar(@RequestBody Map<String, String> body) {
        String signature = culqiService.sign(
                body.getOrDefault("orderId", ""),
                body.getOrDefault("transactionId", ""),
                body.getOrDefault("status", ""),
                body.getOrDefault("amount", ""));
        return Map.of("signature", signature, "publicKey", culqiService.getPublicKey());
    }

    @GetMapping("/config")
    @Operation(summary = "Obtiene configuración pública de Culqi (publicKey y modo)")
    public CulqiService.CulqiResponse getConfig() {
        return culqiService.getStats();
    }

    private String mapEstadoCulqi(String estado) {
        return switch (estado.toLowerCase()) {
            case "paid", "charge_successful", "aprobado" -> "APROBADO";
            case "pending" -> "PENDIENTE";
            case "failed", "charge_failed", "rechazado" -> "RECHAZADO";
            default -> "PENDIENTE";
        };
    }
}