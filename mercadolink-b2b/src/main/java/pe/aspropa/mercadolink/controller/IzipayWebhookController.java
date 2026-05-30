package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.dto.IzipayWebhookRequest;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.service.IzipayService;
import pe.aspropa.mercadolink.service.PagoService;

import java.util.Map;

/**
 * Endpoints públicos para Izipay.
 *
 * <p>{@code /webhook} es el receptor del IPN/Webhook. Valida la firma HMAC
 * antes de procesar el evento de forma asíncrona, de modo que la pasarela
 * recibe una respuesta 202 Accepted inmediata (cumple el contrato de SLA
 * típico de Izipay de responder en menos de 2 segundos).
 *
 * <p>{@code /firmar} es un helper SOLO PARA SANDBOX: dado un payload genera
 * la firma HMAC válida, útil para probar el webhook con curl/Postman sin
 * tener que reimplementar HMAC fuera del backend.
 */
@RestController
@RequestMapping("/api/v1/izipay")
@Tag(name = "Izipay", description = "Webhooks IPN de la pasarela Izipay (público)")
public class IzipayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(IzipayWebhookController.class);

    private final IzipayService izipayService;
    private final PagoService pagoService;

    public IzipayWebhookController(IzipayService izipayService, PagoService pagoService) {
        this.izipayService = izipayService;
        this.pagoService = pagoService;
    }

    @PostMapping("/webhook")
    @Operation(summary = "Recibe el IPN de Izipay; valida firma HMAC y procesa en background")
    public ResponseEntity<Map<String, String>> webhook(@Valid @RequestBody IzipayWebhookRequest req) {
        boolean valid = izipayService.isValidSignature(
                req.getOrderId(), req.getTransactionId(),
                req.getStatus(), req.getAmount(), req.getSignature());
        if (!valid) {
            log.warn("Webhook con firma inválida orderId={}", req.getOrderId());
            throw BusinessException.forbidden("EX-AUTH-002", "Firma HMAC inválida");
        }
        // Procesamiento asíncrono: respondemos 202 al instante.
        pagoService.procesarWebhookAsync(
                req.getOrderId(), req.getTransactionId(),
                req.getStatus(), req.getAmount());
        return ResponseEntity.accepted().body(Map.of(
                "estado", "RECIBIDO",
                "orderId", req.getOrderId()));
    }

    @PostMapping("/firmar")
    @Operation(summary = "[SANDBOX] Genera una firma HMAC válida para probar el webhook")
    public Map<String, String> firmar(@RequestBody Map<String, String> body) {
        if (!izipayService.isSandboxMode()) {
            throw BusinessException.forbidden("EX-AUTH-002",
                    "El helper de firma solo está disponible en modo sandbox");
        }
        String signature = izipayService.sign(
                body.getOrDefault("orderId", ""),
                body.getOrDefault("transactionId", ""),
                body.getOrDefault("status", ""),
                body.getOrDefault("amount", ""));
        return Map.of("signature", signature);
    }
}
