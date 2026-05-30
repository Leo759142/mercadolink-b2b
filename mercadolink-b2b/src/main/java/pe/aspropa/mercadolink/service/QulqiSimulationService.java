package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Servicio simulado para Qulqi que es la pasarela de pagos alternativa aplicable para nuestro sandbox.
 * En modo demo devuelve respuestas simuladas para pruebas sin conectar
 * a la API real. Facilita testing end-to-end del flujo de pagos.
 */
@Service
public class QulqiSimulationService {

    private static final Logger log = LoggerFactory.getLogger(QulqiSimulationService.class);

    /**
     * Simula la creación de una sesión de pago en Qulqi.
     * Devuelve un token ficticio y datos de sesión.
     */
    public QulqiSession createPaymentSession(String orderId, BigDecimal amount, String currency) {
        String sessionToken = "qulqi-token-" + UUID.randomUUID();
        String merchantId = "DEMO-ASPROPA-001";
        
        log.info("[QULQI SIMULADO] createPaymentSession orderId={} monto={} {} -> sessionToken={}",
                orderId, amount, currency, sessionToken);
        
        return new QulqiSession(
            sessionToken,
            merchantId,
            orderId,
            amount,
            currency,
            "https://demo.qulqi.pe/checkout/" + sessionToken
        );
    }

    /**
     * Simula la validación de una transacción completada.
     * En producción verificaría con el API real de Qulqi.
     */
    public boolean validateTransaction(String sessionToken, String transactionId, String status) {
        log.info("[QULQI SIMULADO] validateTransaction sessionToken={} txId={} status={}",
                sessionToken, transactionId, status);
        // En demo: aceptar estados conocidos
        return "COMPLETADO".equalsIgnoreCase(status) || 
               "APROBADO".equalsIgnoreCase(status);
    }

    /**
     * Registro de sesión de pago Qulqi con detalles de checkout.
     */
    public record QulqiSession(
        String sessionToken,
        String merchantId,
        String orderId,
        BigDecimal amount,
        String currency,
        String checkoutUrl
    ) {}
}
