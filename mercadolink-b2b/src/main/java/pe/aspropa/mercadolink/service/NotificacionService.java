package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import pe.aspropa.mercadolink.domain.Notificacion;
import pe.aspropa.mercadolink.repository.NotificacionRepository;

import java.time.Instant;

@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);
    private final NotificacionRepository repository;

    public NotificacionService(NotificacionRepository repository) {
        this.repository = repository;
    }

    @Async("asyncExecutor")
    public void notificarPedidoCreado(String actorEmail, String pedidoId) {
        guardar("PEDIDO", "Pedido creado", "Pedido " + pedidoId + " creado para " + actorEmail);
        log.info("[NOTIFICACION] Pedido {} creado para {}", pedidoId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarPagoAprobado(String actorEmail, String pedidoId, String orderId) {
        guardar("PAGO", "Pago aprobado", "Pago APROBADO pedido=" + pedidoId + " orderId=" + orderId + " actor=" + actorEmail);
        log.info("[NOTIFICACION] Pago APROBADO pedido={} orderId={} actor={}", pedidoId, orderId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarPagoRechazado(String actorEmail, String pedidoId, String orderId) {
        guardar("PAGO", "Pago rechazado", "Pago RECHAZADO pedido=" + pedidoId + " orderId=" + orderId + " actor=" + actorEmail);
        log.info("[NOTIFICACION] Pago RECHAZADO pedido={} orderId={} actor={}", pedidoId, orderId, actorEmail);
    }

    @Async("asyncExecutor")
    public void notificarStockBajo(String vendedorEmail, String productoCodigo, int stock) {
        guardar("STOCK", "Stock bajo", "Stock bajo de " + productoCodigo + " (" + stock + " u) vendedor=" + vendedorEmail);
        log.info("[NOTIFICACION] Stock bajo de {} ({} u) vendedor={}", productoCodigo, stock, vendedorEmail);
    }

    private void guardar(String tipo, String titulo, String mensaje) {
        try {
            Notificacion n = new Notificacion();
            n.setTipo(tipo);
            n.setTitulo(titulo);
            n.setMensaje(mensaje);
            n.setLeida(false);
            n.setCreadaEn(Instant.now());
            repository.save(n);
        } catch (Exception e) {
            log.warn("No se pudo guardar notificacion en BD", e);
        }
    }
}
