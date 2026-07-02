package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload simplificado del webhook que Culqi enviaría al confirmar un pago.
 * En producción validaría la firma con Content-Signature header.
 */
public class CulqiWebhookRequest {

    @NotBlank
    private String orderId;

    @NotBlank
    private String chargeId;

    @NotBlank
    private String transactionId;

    @NotBlank
    private String status;

    @NotBlank
    private String amount;

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getChargeId() { return chargeId; }
    public void setChargeId(String chargeId) { this.chargeId = chargeId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }
}