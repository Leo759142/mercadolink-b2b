package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * Integración real con la API de Culqi.
 * Soporta creación de tokens, cargos y sesiones de pago.
 */
@Service
public class CulqiRealService {

    private static final Logger log = LoggerFactory.getLogger(CulqiRealService.class);
    private static final String CULQI_API_URL = "https://api.culqi.com/v2";

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String privateKey;
    private final boolean enabled;

    public CulqiRealService(RestTemplateBuilder builder,
                            @Value("${app.culqi.api-key:}") String apiKey,
                            @Value("${app.culqi.private-key:}") String privateKey,
                            @Value("${app.culqi.enabled:false}") boolean enabled) {
        this.restTemplate = builder.rootUri(CULQI_API_URL).build();
        this.apiKey = apiKey;
        this.privateKey = privateKey;
        this.enabled = enabled;
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        return headers;
    }

    /**
     * Crea un token de tarjeta en Culqi.
     */
    public TokenResponse crearToken(String numeroTarjeta, String cvv, String expMes, String expAno) {
        if (!enabled) {
            throw new IllegalStateException("Culqi no está habilitado. Configure app.culqi.enabled=true");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("card_number", numeroTarjeta);
        body.put("cvv", cvv);
        body.put("expiration_month", expMes);
        body.put("expiration_year", expAno);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authHeaders());

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity("/tokens", req, Map.class);
            Map<String, Object> data = resp.getBody();
            if (data == null || !data.containsKey("id")) {
                throw new IllegalStateException("Respuesta inválida de Culqi al crear token");
            }
            String tokenId = (String) data.get("id");
            String brand = (String) ((Map) data.get("card")).get("brand");
            return new TokenResponse(tokenId, brand);
        } catch (RestClientException ex) {
            log.error("Error creando token Culqi: {}", ex.getMessage());
            throw new IllegalStateException("Error al crear token de pago", ex);
        }
    }

    /**
     * Crea un cargo (cargo) en Culqi.
     */
    public CargoResponse crearCargo(String tokenId, BigDecimal monto, String moneda, String orderId) {
        if (!enabled) {
            throw new IllegalStateException("Culqi no está habilitado");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("amount", monto.multiply(BigDecimal.valueOf(100)).longValue()); // Culqi usa céntimos
        body.put("currency_code", moneda);
        body.put("token_id", tokenId);
        body.put("metadata", Map.of("orderId", orderId));

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authHeaders());

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity("/charges", req, Map.class);
            Map<String, Object> data = resp.getBody();
            if (data == null) {
                throw new IllegalStateException("Respuesta inválida de Culqi al crear cargo");
            }

            String cargoId = (String) data.get("id");
            String estado = (String) data.get("state");
            String txId = (String) data.get("reference_code");

            return new CargoResponse(cargoId, txId, monto, moneda, estado, orderId);
        } catch (RestClientException ex) {
            log.error("Error creando cargo Culqi: {}", ex.getMessage());
            throw new IllegalStateException("Error al procesar pago", ex);
        }
    }

    /**
     * Crea una sesión de pago para checkout de Culqi.
     */
    public SesionResponse crearSesionPago(String orderId, BigDecimal monto, String moneda, String descripcion) {
        if (!enabled) {
            throw new IllegalStateException("Culqi no está habilitado");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("amount", monto.multiply(BigDecimal.valueOf(100)).longValue());
        body.put("currency_code", moneda);
        body.put("order_id", orderId);
        body.put("description", descripcion);
        body.put("metadata", Map.of("orderId", orderId));

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, authHeaders());

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity("/charges", req, Map.class);
            Map<String, Object> data = resp.getBody();

            String chargeId = (String) data.get("id");
            return new SesionResponse(chargeId, apiKey, orderId, monto, moneda,
                    "https://checkout.culqi.com/" + chargeId);
        } catch (RestClientException ex) {
            log.error("Error creando sesión Culqi: {}", ex.getMessage());
            throw new IllegalStateException("Error al crear sesión de pago", ex);
        }
    }

/**
      * Valida la firma del webhook de Culqi.
      */
    public boolean validarFirmaWebhook(String payload, String signature) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA256");
            String expected = Base64.getEncoder().encodeToString(
                    md.digest(privateKey.getBytes(StandardCharsets.UTF_8)));
            return expected.equals(signature);
        } catch (Exception ex) {
            log.warn("Error validando firma: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Genera firma para testing (similar a Izipay).
     */
    public String sign(String orderId, String transactionId, String status, String amount) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA256");
            String payload = orderId + "|" + transactionId + "|" + status + "|" + amount;
            return Base64.getEncoder().encodeToString(
                    md.digest(privateKey.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo firmar el payload", ex);
        }
    }

    public boolean isEnabled() { return enabled; }
    public String getApiKey() { return apiKey; }

    public record TokenResponse(String tokenId, String brand) {}
    public record CargoResponse(String cargoId, String transactionId, BigDecimal monto,
                                 String moneda, String estado, String orderId) {}
    public record SesionResponse(String chargeId, String publicKey, String orderId,
                                  BigDecimal monto, String moneda, String checkoutUrl) {}
}