package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Servicio de utilidad para integración con Izipay. En modo sandbox simula
 * la creación del formToken; en cualquier modo valida la firma HMAC-SHA256
 * de los webhooks/IPN (sección 3.3.2 - Aspectos transversales).
 *
 * <p>Para integrar la API real, basta sustituir {@link #createPaymentSession}
 * por una llamada HTTP a {@code /api-payment/V4/Charge/CreatePayment}
 * usando el {@code public-key} y devolver el {@code formToken} real.
 */
@Service
public class IzipayService {

    private static final Logger log = LoggerFactory.getLogger(IzipayService.class);

    private final String baseUrl;
    private final String publicKey;
    private final String hmacSecret;
    private final boolean sandboxMode;

    public IzipayService(@Value("${app.izipay.base-url}") String baseUrl,
                         @Value("${app.izipay.public-key}") String publicKey,
                         @Value("${app.izipay.hmac-secret}") String hmacSecret,
                         @Value("${app.izipay.sandbox-mode}") boolean sandboxMode) {
        this.baseUrl = baseUrl;
        this.publicKey = publicKey;
        this.hmacSecret = hmacSecret;
        this.sandboxMode = sandboxMode;
    }

    /**
     * Crea una sesión de pago contra Izipay. En sandbox devuelve un formToken
     * simulado para que el frontend pueda continuar el flujo de pruebas.
     */
    public PaymentSession createPaymentSession(String orderId, BigDecimal amount, String currency) {
        if (sandboxMode) {
            String fakeToken = "fake-token-" + UUID.randomUUID();
            log.info("[IZIPAY sandbox] createPaymentSession orderId={} amount={} {} -> {}",
                    orderId, amount, currency, fakeToken);
            return new PaymentSession(fakeToken, publicKey);
        }
        // En producción: HttpClient hacia baseUrl con auth básica.
        throw new UnsupportedOperationException(
                "Modo producción todavía no configurado. Defina app.izipay.sandbox-mode=true para pruebas.");
    }

    /** Valida la firma HMAC-SHA256 enviada en el webhook. */
    public boolean isValidSignature(String orderId, String transactionId, String status,
                                    String amount, String signature) {
        try {
            String payload = orderId + "|" + transactionId + "|" + status + "|" + amount;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expectedHex = HexFormat.of().formatHex(expected);
            return expectedHex.equalsIgnoreCase(signature);
        } catch (Exception ex) {
            log.warn("Error validando firma Izipay: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Helper de pruebas para construir una firma HMAC válida.
     * Útil cuando se quiere ejercitar el webhook desde Postman.
     */
    public String sign(String orderId, String transactionId, String status, String amount) {
        try {
            String payload = orderId + "|" + transactionId + "|" + status + "|" + amount;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el payload", ex);
        }
    }

    public boolean isSandboxMode() { return sandboxMode; }
    public String getBaseUrl() { return baseUrl; }

    /** Resultado de iniciar una sesión de pago. */
    public record PaymentSession(String formToken, String publicKey) {}
}
