package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PedidoService {

    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
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
        log.info("[PEDIDO] Iniciando crearPedido: clienteId={}, idempotencyKey={}", clienteId, idempotencyKey);
        
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            idempotencyKey = UUID.randomUUID().toString();
            log.info("[PEDIDO] Generado nueva idempotencyKey: {}", idempotencyKey);
        }
        
        var prev = pedidoRepository.findByIdempotencyKey(idempotencyKey);
        if (prev.isPresent()) {
            log.info("[PEDIDO] Pedido existente encontrado para idempotencyKey={}", idempotencyKey);
            return prev.get();
        }

        Actor cliente = actorService.obtenerPorId(clienteId);
        log.info("[PEDIDO] Cliente encontrado: id={}, rol={}", clienteId, cliente.getRol());
        
        if (cliente.getRol() != Rol.CLIENTE_MAYORISTA &&
                cliente.getRol() != Rol.VENDEDOR &&
                cliente.getRol() != Rol.ADMINISTRADOR) {
            log.warn("[PEDIDO] Rol no autorizado para crear pedidos: {}", cliente.getRol());
            throw BusinessException.forbidden("EX-AUTH-002",
                    "El rol " + cliente.getRol() + " no puede crear pedidos");
        }

        Pedido pedido = new Pedido();
        pedido.setIdempotencyKey(idempotencyKey);
        pedido.setCliente(cliente);
        pedido.setEstado(EstadoPedido.BORRADOR);
        pedido.setObservaciones(req.getObservaciones());

        List<ItemPedido> itemsProcesados = new ArrayList<>();
        int totalUnidades = 0;
        
        for (ItemPedidoRequest itemReq : req.getItems()) {
            log.debug("[PEDIDO] Procesando item: productoId={}, puestoId={}, cantidad={}",
                itemReq.getProductoId(), itemReq.getPuestoId(), itemReq.getCantidad());

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
            itemsProcesados.add(item);
        }

        for (ItemPedido item : itemsProcesados) {
            pedido.getItems().add(item);
            totalUnidades += item.getCantidad();
            log.info("[PEDIDO] Reservando stock: producto={}, puesto={}, cantidad={}",
                item.getProducto().getCodigo(), item.getPuesto().getId(), item.getCantidad());
        }

        int itemsReservados = 0;
        try {
            for (ItemPedido item : itemsProcesados) {
                inventarioService.reservar(item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad());
                itemsReservados++;
            }
        } catch (BusinessException e) {
            log.warn("[PEDIDO] Error reservando stock, liberando {} reservas previas", itemsReservados);
            for (int i = 0; i < itemsReservados; i++) {
                ItemPedido item = itemsProcesados.get(i);
                inventarioService.liberarReserva(item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad());
            }
            throw e;
        }

        pedido.recalcularTotal();

        log.info("[PEDIDO] Validando mínimos: unidades={}, monto={}", totalUnidades, pedido.getMontoTotal());
        if (totalUnidades < CANTIDAD_TOTAL_MINIMA ||
                pedido.getMontoTotal().compareTo(MONTO_MINIMO) < 0) {
            log.warn("[PEDIDO] Pedido no cumple mínimos. Unidades: {} (min {}), Monto: {} (min {})", 
                totalUnidades, CANTIDAD_TOTAL_MINIMA, pedido.getMontoTotal(), MONTO_MINIMO);
            itemsProcesados.forEach(item -> inventarioService.liberarReserva(
                    item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad()));
            throw BusinessException.badRequest("PED-001",
                    "El pedido no cumple el mínimo de " + CANTIDAD_TOTAL_MINIMA +
                            " unidades o S/" + MONTO_MINIMO);
        }

        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        Pedido saved = pedidoRepository.save(pedido);
        log.info("[PEDIDO] Pedido guardado: id={}, estado={}, monto={}, items={}", 
            saved.getId(), saved.getEstado(), saved.getMontoTotal(), saved.getItems().size());

        auditoriaService.registrar(cliente.getId(), cliente.getRol().name(),
                "GestionPedidos", "CrearPedido", saved.getId(), "EXITO",
                idempotencyKey, "Pedido B2B creado con " + saved.getItems().size() + " ítems");
        notificacionService.notificarPedidoCreado(cliente.getEmail(), saved.getId());
        return saved;
    }

    public Pedido obtenerPedido(String pedidoId) {
        log.debug("[PEDIDO] Obteniendo pedido: id={}", pedidoId);
        return pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> BusinessException.notFound("PED-404",
                        "Pedido no encontrado: " + pedidoId));
    }

    public List<Pedido> listarPorCliente(String clienteId) {
        log.debug("[PEDIDO] Listando pedidos para cliente: {}", clienteId);
        return pedidoRepository.findByClienteIdOrderByFechaCreacionDesc(clienteId);
    }

    public List<Pedido> listarPorProveedor(String proveedorId) {
        log.debug("[PEDIDO] Listando pedidos para proveedor: {}", proveedorId);
        return pedidoRepository.findByProveedorId(proveedorId);
    }

    @Transactional
    public Pedido cambiarEstado(String pedidoId, EstadoPedido nuevoEstado, String actorId) {
        log.info("[PEDIDO] Cambiando estado: id={}, de={} a={}", pedidoId, null, nuevoEstado);
        Pedido pedido = obtenerPedido(pedidoId);
        EstadoPedido actual = pedido.getEstado();
        log.info("[PEDIDO] Estado actual: {}", actual);
        
        if (!transicionPermitida(actual, nuevoEstado)) {
            log.warn("[PEDIDO] Transición no permitida: {} -> {}", actual, nuevoEstado);
            throw BusinessException.conflict("EX-ORD-002",
                    "Transición no permitida: " + actual + " -> " + nuevoEstado);
        }
        pedido.setEstado(nuevoEstado);
        auditoriaService.registrar(actorId, "SISTEMA", "GestionPedidos",
                "CambiarEstado", pedido.getId(), "EXITO", null,
                actual + " -> " + nuevoEstado);
        log.info("[PEDIDO] Estado cambiado exitosamente: id={}, nuevoEstado={}", pedidoId, nuevoEstado);
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