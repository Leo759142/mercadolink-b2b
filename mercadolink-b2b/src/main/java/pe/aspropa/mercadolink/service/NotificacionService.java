package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Notificaciones asíncronas. En producción enviaría emails/SMS/webhooks;
 * aquí simplemente registra en log para no introducir dependencias externas.
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    @Async("asyncExecutor")
    public void notificarPedidoCreado(String actorEmail, String pedidoId) {
        log.info("[NOTIFICACION] Pedido {} creado para {}", pedidoId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarPagoAprobado(String actorEmail, String pedidoId, String orderId) {
        log.info("[NOTIFICACION] Pago APROBADO pedido={} orderId={} actor={}",
                pedidoId, orderId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarPagoRechazado(String actorEmail, String pedidoId, String orderId) {
        log.info("[NOTIFICACION] Pago RECHAZADO pedido={} orderId={} actor={}",
                pedidoId, orderId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarStockBajo(String vendedorEmail, String productoCodigo, int stock) {
        log.info("[NOTIFICACION] Stock bajo de {} ({} u) vendedor={}",
                productoCodigo, stock, vendedorEmail);
    }
}
