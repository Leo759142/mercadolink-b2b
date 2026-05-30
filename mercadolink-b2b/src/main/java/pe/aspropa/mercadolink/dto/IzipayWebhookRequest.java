package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload simplificado del IPN/Webhook que Izipay enviaría al confirmar un pago.
 * En producción incluiría más campos y firma HMAC; aquí se valida la firma
 * con HMAC-SHA256 sobre {@code orderId|transactionId|status|amount}.
 */
public class IzipayWebhookRequest {

    @NotBlank
    private String orderId;

    @NotBlank
    private String transactionId;

    /** APROBADO o RECHAZADO. */
    @NotBlank
    private String status;

    @NotBlank
    private String amount;

    @NotBlank
    private String signature;

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String t) { this.transactionId = t; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }
    public String getSignature() { return signature; }
    public void setSignature(String s) { this.signature = s; }
}
