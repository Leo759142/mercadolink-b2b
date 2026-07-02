package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Servicio Culqi que soporta:
 * - Modo simulación: genera tokens y cargos ficticios para testing
 * - Modo real: delega a CulqiRealService cuando app.culqi.real-mode=true
 */
@Service
public class CulqiService {

    private static final Logger log = LoggerFactory.getLogger(CulqiService.class);

    private final CulqiRealService culqiRealService;
    private final String publicKey;
    private final String secretKey;
    private final boolean realMode;

    public CulqiService(CulqiRealService culqiRealService,
                        @Value("${app.culqi.public-key:culqi-demo-public}") String publicKey,
                        @Value("${app.culqi.secret-key:culqi-demo-secret}") String secretKey,
                        @Value("${app.culqi.real-mode:false}") boolean realMode) {
        this.culqiRealService = culqiRealService;
        this.publicKey = publicKey;
        this.secretKey = secretKey;
        this.realMode = realMode;
    }

    public TokenResponse createToken(String cardNumber, String expiryMonth, String expiryYear, String cvv) {
        if (realMode) {
            var realToken = culqiRealService.crearToken(cardNumber, cvv, expiryMonth, expiryYear);
            return new TokenResponse(realToken.tokenId(), realToken.brand());
        }
        String token = "tok-" + UUID.randomUUID();
        log.info("[CULQI SIMULADO] createToken -> token={}", token);
        return new TokenResponse(token, "visa", cardNumber.substring(0, 4));
    }

    public CargoResponse createCargo(String token, BigDecimal amount, String currency, String orderId) {
        if (realMode) {
            var realCargo = culqiRealService.crearCargo(token, amount, currency, orderId);
            return new CargoResponse(realCargo.cargoId(), realCargo.transactionId(), amount, currency,
                    mapEstado(realCargo.estado()), orderId);
        }
        String cargoId = "cargo-" + UUID.randomUUID();
        String transactionId = "tx-" + UUID.randomUUID();
        log.info("[CULQI SIMULADO] createCargo orderId={} amount={} {} -> cargoId={}", orderId, amount, currency, cargoId);
        return new CargoResponse(cargoId, transactionId, amount, currency, "PENDIENTE", orderId);
    }

    public boolean isValidSignature(String payload, String signature) {
        if (realMode) {
            return culqiRealService.validarFirmaWebhook(payload, signature);
        }
        return "valid-signature".equals(signature) || signature == null;
    }

    public String sign(String orderId, String transactionId, String status, String amount) {
        if (realMode) {
            return culqiRealService.sign(orderId, transactionId, status, amount);
        }
        return "valid-signature";
    }

    public SesionResponse createPaymentSession(String orderId, BigDecimal amount, String currency) {
        if (realMode) {
            var realSesion = culqiRealService.crearSesionPago(orderId, amount, currency, "Pedido B2B #" + orderId);
            return new SesionResponse(realSesion.chargeId(), culqiRealService.getApiKey(), orderId, amount, currency);
        }
        String sessionToken = "chq-session-" + UUID.randomUUID();
        log.info("[CULQI SIMULADO] createPaymentSession orderId={} monto={} {} -> {}", orderId, amount, currency, sessionToken);
        return new SesionResponse(sessionToken, publicKey, orderId, amount, currency);
    }

    private String mapEstado(String estadoCulqi) {
        return switch (estadoCulqi.toLowerCase()) {
            case "paid", "charge_successful" -> "APROBADO";
            case "pending" -> "PENDIENTE";
            case "failed", "charge_failed" -> "RECHAZADO";
            default -> "DESCONOCIDO";
        };
    }

    public String getPublicKey() { return realMode ? culqiRealService.getApiKey() : publicKey; }

    public CulqiResponse getStats() {
        return new CulqiResponse(publicKey, realMode, List.of("visa", "mastercard", "amex"));
    }

    public record TokenResponse(String tokenId, String brand, String lastFour) {
        public TokenResponse(String tokenId, String brand) {
            this(tokenId, brand, "****");
        }
    }
    public record CargoResponse(String cargoId, String transactionId, BigDecimal amount, String currency, String status, String orderId) {}
    public record SesionResponse(String sessionToken, String publicKey, String orderId, BigDecimal amount, String currency) {}
    public record CulqiResponse(String publicKey, boolean realMode, List<String> supportedBrands) {}
}