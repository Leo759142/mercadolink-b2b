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
        
        // 🔑 REFACTOR B2B: Sistema elige puesto automáticamente (no cliente)
        for (ItemPedidoRequest itemReq : req.getItems()) {
            log.debug("[PEDIDO B2B] Procesando item: productoId={}, cantidad={} (SIN puestoId)", 
                itemReq.getProductoId(), itemReq.getCantidad());

            // 1. Validar producto
            Producto producto = productoRepository.findById(itemReq.getProductoId())
                    .orElseThrow(() -> BusinessException.notFound("CAT-001",
                            "Producto no encontrado: " + itemReq.getProductoId()));
            
            if (!producto.isActivo()) {
                throw BusinessException.badRequest("CAT-002",
                        "Producto inactivo: " + producto.getCodigo());
            }

            // 2. 🎯 BUSCAR AUTOMÁTICAMENTE puesto con stock disponible
            Inventario inventarioElegido = inventarioService.buscarInventarioDisponible(
                    itemReq.getProductoId(), 
                    itemReq.getCantidad()
            );
            Puesto puestoElegido = inventarioElegido.getPuesto();
            
            log.info("[PEDIDO B2B] Sistema eligió: puesto={}, disponible={}",
                puestoElegido.getId(), inventarioElegido.disponible());

            // 3. Crear item con puesto elegido por el sistema
            ItemPedido item = new ItemPedido();
            item.setPedido(pedido);
            item.setProducto(producto);
            item.setPuesto(puestoElegido);
            item.setCantidad(itemReq.getCantidad());
            item.setPrecioUnitario(producto.getPrecioReferencia());
            item.setEstadoItem(ItemPedido.EstadoItem.PENDIENTE);
            itemsProcesados.add(item);
        }

        for (ItemPedido item : itemsProcesados) {
            pedido.getItems().add(item);
            totalUnidades += item.getCantidad();
            log.info("[PEDIDO B2B] Reservando stock: producto={}, puesto={}, cantidad={}",
                item.getProducto().getCodigo(), item.getPuesto().getId(), item.getCantidad());
        }

        int itemsReservados = 0;
        try {
            for (ItemPedido item : itemsProcesados) {
                inventarioService.reservar(item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad());
                itemsReservados++;
            }
        } catch (BusinessException e) {
            log.warn("[PEDIDO B2B] Error reservando stock, liberando {} reservas previas", itemsReservados);
            for (int i = 0; i < itemsReservados; i++) {
                ItemPedido item = itemsProcesados.get(i);
                inventarioService.liberarReserva(item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad());
            }
            throw e;
        }

        pedido.recalcularTotal();

        log.info("[PEDIDO B2B] Validando mínimos: unidades={}, monto={}", totalUnidades, pedido.getMontoTotal());
        if (totalUnidades < CANTIDAD_TOTAL_MINIMA ||
                pedido.getMontoTotal().compareTo(MONTO_MINIMO) < 0) {
            log.warn("[PEDIDO B2B] Pedido no cumple mínimos. Unidades: {} (min {}), Monto: {} (min {})", 
                totalUnidades, CANTIDAD_TOTAL_MINIMA, pedido.getMontoTotal(), MONTO_MINIMO);
            itemsProcesados.forEach(item -> inventarioService.liberarReserva(
                    item.getProducto().getId(), item.getPuesto().getId(), item.getCantidad()));
            throw BusinessException.badRequest("PED-001",
                    "El pedido no cumple el mínimo de " + CANTIDAD_TOTAL_MINIMA +
                            " unidades o S/" + MONTO_MINIMO);
        }

        pedido.setEstado(EstadoPedido.PENDIENTE_PAGO);
        Pedido saved = pedidoRepository.save(pedido);
        log.info("[PEDIDO B2B] Pedido guardado: id={}, estado={}, monto={}, items={}, puestos diferentes={}", 
            saved.getId(), saved.getEstado(), saved.getMontoTotal(), saved.getItems().size(),
            saved.getItems().stream().map(i -> i.getPuesto().getId()).distinct().count());

        auditoriaService.registrar(cliente.getId(), cliente.getRol().name(),
                "GestionPedidos", "CrearPedido", saved.getId(), "EXITO",
                idempotencyKey, "Pedido B2B creado con " + saved.getItems().size() + " ítems, sistema eligió puestos");
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

    @Transactional
    public Pedido surtirItem(String pedidoId, Long itemId, String proveedorActorId) {
        log.info("[PEDIDO] Surtiendo item: pedidoId={}, itemId={}, proveedorId={}",
            pedidoId, itemId, proveedorActorId);
        Pedido pedido = obtenerPedido(pedidoId);

        ItemPedido item = pedido.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> BusinessException.notFound("PED-405",
                        "Item no encontrado en el pedido: " + itemId));

        Actor proveedorProducto = item.getProducto().getProveedor();
        if (proveedorProducto == null || !proveedorProducto.getId().equals(proveedorActorId)) {
            log.warn("[PEDIDO] Proveedor {} intentó surtir item {} que no le pertenece",
                proveedorActorId, itemId);
            throw BusinessException.forbidden("EX-AUTH-003",
                    "El item no pertenece a productos de este proveedor");
        }

        if (item.getEstadoItem() != ItemPedido.EstadoItem.PENDIENTE) {
            log.warn("[PEDIDO] Item no está PENDIENTE, estado actual={}", item.getEstadoItem());
            throw BusinessException.conflict("EX-ORD-003",
                    "El item no está en estado PENDIENTE (actual: " + item.getEstadoItem() + ")");
        }

        item.setEstadoItem(ItemPedido.EstadoItem.SURTIDO);
        item.setFechaSurtimiento(java.time.Instant.now());

        auditoriaService.registrar(proveedorActorId, "PROVEEDOR", "GestionPedidos",
                "SurtirItem", pedido.getId(), "EXITO", null,
                "Item " + itemId + " marcado como SURTIDO");

        Pedido saved = pedidoRepository.save(pedido);
        log.info("[PEDIDO] Item surtido exitosamente: pedidoId={}, itemId={}", pedidoId, itemId);
        return saved;
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