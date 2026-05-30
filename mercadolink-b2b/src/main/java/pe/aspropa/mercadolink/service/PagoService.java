package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.*;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.PagoRepository;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Servicio de tarea para pagos. Coordina la creación de sesiones de pago en
 * Izipay y procesa los webhooks/IPN de forma asíncrona para no bloquear al
 * cliente que envía la notificación (sección 3.3.2 - estados).
 */
@Service
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);

    private final PagoRepository pagoRepository;
    private final PedidoService pedidoService;
    private final InventarioService inventarioService;
    private final IzipayService izipayService;
    private final AuditoriaService auditoriaService;
    private final NotificacionService notificacionService;

    public PagoService(PagoRepository pagoRepository,
                       PedidoService pedidoService,
                       InventarioService inventarioService,
                       IzipayService izipayService,
                       AuditoriaService auditoriaService,
                       NotificacionService notificacionService) {
        this.pagoRepository = pagoRepository;
        this.pedidoService = pedidoService;
        this.inventarioService = inventarioService;
        this.izipayService = izipayService;
        this.auditoriaService = auditoriaService;
        this.notificacionService = notificacionService;
    }

    /** Crea la sesión de pago contra Izipay y devuelve el formToken. */
    @Transactional
    public IniciarPagoResult iniciarPago(String pedidoId, String actorId) {
        Pedido pedido = pedidoService.obtenerPedido(pedidoId);
        if (pedido.getEstado() != EstadoPedido.PENDIENTE_PAGO) {
            throw BusinessException.conflict("EX-ORD-002",
                    "El pedido no está en estado PENDIENTE_PAGO (actual=" + pedido.getEstado() + ")");
        }
        // Reusamos pago anterior si lo hubiera (idempotencia EX-INV-004).
        Pago pago = pagoRepository.findByPedidoId(pedidoId).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setOrderId("ORD-" + UUID.randomUUID());
            nuevo.setPedido(pedido);
            nuevo.setMonto(pedido.getMontoTotal());
            nuevo.setEstado(EstadoPago.CREADO);
            return nuevo;
        });
        var session = izipayService.createPaymentSession(
                pago.getOrderId(), pedido.getMontoTotal(), "PEN");
        pago.setFormToken(session.formToken());
        pago.setEstado(EstadoPago.PENDIENTE);
        Pago saved = pagoRepository.save(pago);

        auditoriaService.registrar(actorId, "SISTEMA", "ProcesamientoPagos",
                "IniciarPago", pedido.getId(), "EXITO", saved.getOrderId(),
                "FormToken generado");
        return new IniciarPagoResult(saved.getOrderId(), session.formToken(),
                session.publicKey(), pedido.getMontoTotal());
    }

    /**
     * Procesa el webhook/IPN de Izipay de forma asíncrona.
     * Devuelve un Future para que el controlador pueda responder 202 Accepted
     * inmediatamente al pasarela, cumpliendo el contrato de respuesta rápida.
     *
     * <p>El método combina {@code @Async} y {@code @Transactional} sobre el
     * mismo punto de entrada para evitar la auto-invocación que rompería la
     * transactionalidad (los dos advisors de Spring se encadenan).
     */
    @Async("asyncExecutor")
    @Transactional
    public CompletableFuture<Void> procesarWebhookAsync(String orderId, String transactionId,
                                                        String status, String amount) {
        try {
            procesarWebhook(orderId, transactionId, status, amount);
        } catch (Exception ex) {
            log.error("Error procesando webhook orderId={}: {}", orderId, ex.getMessage(), ex);
        }
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Versión sincrónica (también utilizable por tests). Si se invoca desde
     * {@link #procesarWebhookAsync}, hereda la misma transacción porque ambas
     * comparten el proxy de Spring.
     */
    @Transactional
    public void procesarWebhook(String orderId, String transactionId,
                                String status, String amount) {
        Pago pago = pagoRepository.findByOrderId(orderId)
                .orElseThrow(() -> BusinessException.notFound("PAY-404",
                        "No se encontró pago para orderId=" + orderId));

        // Idempotencia: si ya está finalizado, ignoramos.
        if (pago.getEstado() == EstadoPago.APROBADO ||
                pago.getEstado() == EstadoPago.RECHAZADO) {
            log.info("Webhook duplicado para orderId={}, estado={}", orderId, pago.getEstado());
            return;
        }

        BigDecimal montoRecibido = new BigDecimal(amount);
        if (pago.getMonto().compareTo(montoRecibido) != 0) {
            pago.setEstado(EstadoPago.EN_CONCILIACION);
            pagoRepository.save(pago);
            auditoriaService.registrar(null, "SISTEMA", "ProcesamientoPagos",
                    "WebhookMontoNoCoincide", pago.getPedido().getId(), "ERROR",
                    orderId, "Esperado=" + pago.getMonto() + " recibido=" + montoRecibido);
            return;
        }

        Pedido pedido = pago.getPedido();
        if ("APROBADO".equalsIgnoreCase(status)) {
            pago.setEstado(EstadoPago.APROBADO);
            pago.setTransactionId(transactionId);
            pagoRepository.save(pago);

            // Commit del saga: convertimos la reserva en stock real.
            pedido.getItems().forEach(it -> inventarioService.confirmarReserva(
                    it.getProducto().getId(), it.getPuesto().getId(), it.getCantidad()));
            pedido.setEstado(EstadoPedido.PAGADO);

            auditoriaService.registrar(pedido.getCliente().getId(),
                    pedido.getCliente().getRol().name(), "ProcesamientoPagos",
                    "PagoAprobado", pedido.getId(), "EXITO", orderId, null);
            notificacionService.notificarPagoAprobado(pedido.getCliente().getEmail(),
                    pedido.getId(), orderId);
        } else {
            pago.setEstado(EstadoPago.RECHAZADO);
            pagoRepository.save(pago);

            // Rollback del saga: liberamos las reservas.
            pedido.getItems().forEach(it -> inventarioService.liberarReserva(
                    it.getProducto().getId(), it.getPuesto().getId(), it.getCantidad()));
            pedido.setEstado(EstadoPedido.RECHAZADO);

            auditoriaService.registrar(pedido.getCliente().getId(),
                    pedido.getCliente().getRol().name(), "ProcesamientoPagos",
                    "PagoRechazado", pedido.getId(), "ERROR", orderId, null);
            notificacionService.notificarPagoRechazado(pedido.getCliente().getEmail(),
                    pedido.getId(), orderId);
        }
    }

    public Pago obtenerPorOrderId(String orderId) {
        return pagoRepository.findByOrderId(orderId)
                .orElseThrow(() -> BusinessException.notFound("PAY-404",
                        "Pago no encontrado: " + orderId));
    }

    /** Resultado de iniciar un pago: lo que el frontend necesita para abrir Izipay. */
    public record IniciarPagoResult(String orderId, String formToken,
                                    String publicKey, BigDecimal monto) {}
}
