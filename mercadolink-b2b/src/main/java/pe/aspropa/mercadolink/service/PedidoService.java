package pe.aspropa.mercadolink.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.*;
import pe.aspropa.mercadolink.dto.CrearPedidoRequest;
import pe.aspropa.mercadolink.dto.ItemPedidoRequest;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.PedidoRepository;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.repository.PuestoRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de tarea para pedidos B2B.
 *
 * <p>Implementa la regla PED-001 (monto mínimo y cantidades mínimas) y orquesta
 * la reserva de stock en {@link InventarioService}. La clave de idempotencia
 * impide procesar dos veces el mismo pedido (regla EX-INV-004).
 */
@Service
public class PedidoService {

    private static final int CANTIDAD_TOTAL_MINIMA = 10;
    private static final BigDecimal MONTO_MINIMO = new BigDecimal("50.00");

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final PuestoRepository puestoRepository;
    private final InventarioService inventarioService;
    private final ActorService actorService;
    private final AuditoriaService auditoriaService;
    private final NotificacionService notificacionService;

    public PedidoService(PedidoRepository pedidoRepository,
                         ProductoRepository productoRepository,
                         PuestoRepository puestoRepository,
                         InventarioService inventarioService,
                         ActorService actorService,
                         AuditoriaService auditoriaService,
                         NotificacionService notificacionService) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.puestoRepository = puestoRepository;
        this.inventarioService = inventarioService;
        this.actorService = actorService;
        this.auditoriaService = auditoriaService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public Pedido crearPedido(String clienteId, String idempotencyKey, CrearPedidoRequest req) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = UUID.randomUUID().toString();
        }
        // Idempotencia: si la clave ya existe, devolvemos el pedido previo.
        var prev = pedidoRepository.findByIdempotencyKey(idempotencyKey);
        if (prev.isPresent()) {
            return prev.get();
        }

        Actor cliente = actorService.obtenerPorId(clienteId);
        if (cliente.getRol() != Rol.CLIENTE_MAYORISTA &&
                cliente.getRol() != Rol.VENDEDOR &&
                cliente.getRol() != Rol.ADMINISTRADOR) {
            throw BusinessException.forbidden("EX-AUTH-002",
                    "El rol " + cliente.getRol() + " no puede crear pedidos");
        }

        Pedido pedido = new Pedido();
        pedido.setIdempotencyKey(idempotencyKey);
        pedido.setCliente(cliente);
        pedido.setEstado(EstadoPedido.BORRADOR);
        pedido.setObservaciones(req.getObservaciones());

        int totalUnidades = 0;
        for (ItemPedidoRequest itemReq : req.getItems()) {
            Producto producto = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> BusinessException.notFound("CAT-001",
                            "Producto no encontrado: " + itemReq.getProductoId()));
            Puesto puesto = puestoRepository.findById(itemReq.getPuestoId())
                    .orElseThrow(() -> BusinessException.notFound("PUE-001",
                            "Puesto no encontrado: " + itemReq.getPuestoId()));
            if (!producto.isActivo()) {
                throw BusinessException.badRequest("CAT-001",
                        "Producto inactivo: " + producto.getCodigo());
            }
            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProducto(producto);
            item.setPuesto(puesto);
            item.setCantidad(itemReq.getCantidad());
            item.setPrecioUnitario(producto.getPrecioReferencia());
            pedido.getItems().add(item);
            totalUnidades += itemReq.getCantidad();
            // Reserva atómica (paso 1 de la saga).
            inventarioService.reservar(producto.getId(), puesto.getId(), itemReq.getCantidad());
        }

        pedido.recalcularTotal();

        if (totalUnidades < CANTIDAD_TOTAL_MINIMA ||
                pedido.getMontoTotal().compareTo(MONTO_MINIMO) < 0) {
            // Liberamos las reservas hechas (compensación parcial).
            req.getItems().forEach(i -> inventarioService.liberarReserva(
                    i.getProductoId(), i.getPuestoId(), i.getCantidad()));
            throw BusinessException.badRequest("PED-001",
                    "El pedido no cumple el mínimo de " + CANTIDAD_TOTAL_MINIMA +
                            " unidades o S/" + MONTO_MINIMO);
        }

        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        Pedido saved = pedidoRepository.save(pedido);

        auditoriaService.registrar(cliente.getId(), cliente.getRol().name(),
                "GestionPedidos", "CrearPedido", saved.getId(), "EXITO",
                idempotencyKey, "Pedido B2B creado con " + req.getItems().size() + " ítems");
        notificacionService.notificarPedidoCreado(cliente.getEmail(), saved.getId());
        return saved;
    }

    public Pedido obtenerPedido(String pedidoId) {
        return pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> BusinessException.notFound("PED-404",
                        "Pedido no encontrado: " + pedidoId));
    }

    public List<Pedido> listarPorCliente(String clienteId) {
        return pedidoRepository.findByClienteIdOrderByFechaCreacionDesc(clienteId);
    }

    @Transactional
    public Pedido cambiarEstado(String pedidoId, EstadoPedido nuevoEstado, String actorId) {
        Pedido pedido = obtenerPedido(pedidoId);
        EstadoPedido actual = pedido.getEstado();
        if (!transicionPermitida(actual, nuevoEstado)) {
            throw BusinessException.conflict("EX-ORD-002",
                    "Transición no permitida: " + actual + " -> " + nuevoEstado);
        }
        pedido.setEstado(nuevoEstado);
        auditoriaService.registrar(actorId, "SISTEMA", "GestionPedidos",
                "CambiarEstado", pedido.getId(), "EXITO", null,
                actual + " -> " + nuevoEstado);
        return pedido;
    }

    private boolean transicionPermitida(EstadoPedido from, EstadoPedido to) {
        return switch (from) {
            case BORRADOR -> to == EstadoPedido.PENDIENTE_PAGO || to == EstadoPedido.CANCELADO;
            case PENDIENTE_PAGO -> to == EstadoPedido.PAGADO || to == EstadoPedido.RECHAZADO
                    || to == EstadoPedido.CANCELADO;
            case PAGADO -> to == EstadoPedido.CONFIRMADO || to == EstadoPedido.EN_DISPUTA;
            case CONFIRMADO -> to == EstadoPedido.EN_DESPACHO || to == EstadoPedido.CANCELADO
                    || to == EstadoPedido.EN_DISPUTA;
            case EN_DESPACHO -> to == EstadoPedido.ENTREGADO || to == EstadoPedido.EN_DISPUTA;
            case ENTREGADO, CANCELADO, RECHAZADO -> false;
            case EN_DISPUTA -> to == EstadoPedido.ENTREGADO || to == EstadoPedido.CANCELADO;
        };
    }
}
