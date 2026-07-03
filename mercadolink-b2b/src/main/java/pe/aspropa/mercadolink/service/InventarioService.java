package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Inventario;
import pe.aspropa.mercadolink.domain.Producto;
import pe.aspropa.mercadolink.domain.Puesto;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.InventarioRepository;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.repository.PuestoRepository;

import java.time.Instant;
import java.util.List;

@Service
public class InventarioService {

    private static final Logger log = LoggerFactory.getLogger(InventarioService.class);

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final PuestoRepository puestoRepository;
    private final NotificacionService notificacionService;

    public InventarioService(InventarioRepository inventarioRepository,
                             ProductoRepository productoRepository,
                             PuestoRepository puestoRepository,
                             NotificacionService notificacionService) {
        this.inventarioRepository = inventarioRepository;
        this.productoRepository = productoRepository;
        this.puestoRepository = puestoRepository;
        this.notificacionService = notificacionService;
    }

    public List<Inventario> listarPorPuesto(String puestoId) {
        log.debug("[INVENTARIO] Listando inventario para puesto: {}", puestoId);
        return inventarioRepository.findByPuestoId(puestoId);
    }

    public Inventario obtener(String productoId, String puestoId) {
        log.debug("[INVENTARIO] Obteniendo inventario: productoId={}, puestoId={}", productoId, puestoId);
        return inventarioRepository.findByProductoIdAndPuestoId(productoId, puestoId)
                .orElseThrow(() -> BusinessException.notFound("CAT-001",
                        "No existe inventario para producto " + productoId +
                                " en puesto " + puestoId));
    }

    /** 
     * 🔑 CRÍTICO: Busca automáticamente el puesto con stock disponible.
     * Algoritmo: Prioriza puestos con más stock disponible.
     * 
     * @param productoId ID del producto
     * @param cantidadRequerida Cantidad necesaria
     * @return Inventario con stock suficiente
     * @throws BusinessException si no hay stock en ningún puesto
     */
    @Transactional(readOnly = true)
    public Inventario buscarInventarioDisponible(String productoId, int cantidadRequerida) {
        log.info("[INVENTARIO B2B] Buscando puesto con stock: productoId={}, cantidad={}", 
            productoId, cantidadRequerida);
        
        // Buscar todos los inventarios del producto, ordenados por disponibilidad DESC
        List<Inventario> inventarios = inventarioRepository.findByProductoId(productoId);
        
        if (inventarios.isEmpty()) {
            log.warn("[INVENTARIO B2B] Producto no tiene inventario en ningún puesto: {}", productoId);
            throw BusinessException.conflict("INV-005",
                    "Producto no disponible en mercado: " + productoId);
        }
        
        // Filtrar por stock disponible y ordenar por cantidad DESC
        var disponibles = inventarios.stream()
                .filter(inv -> inv.disponible() >= cantidadRequerida)
                .sorted((a, b) -> Integer.compare(b.disponible(), a.disponible()))
                .toList();
        
        if (disponibles.isEmpty()) {
            int totalDisponible = inventarios.stream()
                    .mapToInt(Inventario::disponible)
                    .sum();
            log.warn("[INVENTARIO B2B] Stock insuficiente en todos los puestos. Total: {}, Solicitado: {}", 
                totalDisponible, cantidadRequerida);
            throw BusinessException.conflict("INV-001",
                    "Stock insuficiente para producto. Disponible: " + totalDisponible + 
                    ", solicitado: " + cantidadRequerida);
        }
        
        Inventario seleccionado = disponibles.get(0);
        log.info("[INVENTARIO B2B] Puesto seleccionado: puestoId={}, disponible={}", 
            seleccionado.getPuesto().getId(), seleccionado.disponible());
        
        return seleccionado;
    }

    @Transactional
    public Inventario actualizarStock(String productoId, String puestoId,
                                      int cantidadActual, int cantidadMinima) {
        log.info("[INVENTARIO] Actualizando stock: productoId={}, puestoId={}, cantidad={}, min={}", 
            productoId, puestoId, cantidadActual, cantidadMinima);
        Inventario inv = inventarioRepository
                .findByProductoIdAndPuestoId(productoId, puestoId)
                .orElseGet(() -> nuevoInventario(productoId, puestoId));
        if (cantidadActual < 0) {
            throw BusinessException.badRequest("INV-002",
                    "La cantidad no puede ser negativa");
        }
        inv.setCantidadActual(cantidadActual);
        inv.setCantidadMinima(cantidadMinima);
        inv.setUltimaActualizacion(Instant.now());
        Inventario saved = inventarioRepository.save(inv);
        if (cantidadActual <= cantidadMinima) {
            notificacionService.notificarStockBajo("almacen@aspropa.pe",
                    inv.getProducto().getCodigo(), cantidadActual);
        }
        return saved;
    }

    @Transactional
    public void reservar(String productoId, String puestoId, int cantidad) {
        log.info("[INVENTARIO] Reservando stock: productoId={}, puestoId={}, cantidad={}", 
            productoId, puestoId, cantidad);
        Inventario inv = obtener(productoId, puestoId);
        log.debug("[INVENTARIO] Stock disponible: {} (actual: {}, reservado: {})", 
            inv.disponible(), inv.getCantidadActual(), inv.getCantidadReservada());
        if (inv.disponible() < cantidad) {
            log.warn("[INVENTARIO] Stock insuficiente! disponible={} solicitado={}", 
                inv.disponible(), cantidad);
            throw BusinessException.conflict("INV-001",
                    "Stock insuficiente para producto " + inv.getProducto().getCodigo() +
                            ". Disponible: " + inv.disponible() + ", solicitado: " + cantidad);
        }
        inv.setCantidadReservada(inv.getCantidadReservada() + cantidad);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
        log.info("[INVENTARIO] Reserva exitosa. Nueva reserva: {}", inv.getCantidadReservada());
    }

    @Transactional
    public void confirmarReserva(String productoId, String puestoId, int cantidad) {
        log.info("[INVENTARIO] Confirmando reserva: productoId={}, puestoId={}, cantidad={}", 
            productoId, puestoId, cantidad);
        Inventario inv = obtener(productoId, puestoId);
        if (inv.getCantidadReservada() < cantidad) {
            log.warn("[INVENTARIO] Reserva inconsistente! reservada={} confirmada={}", 
                inv.getCantidadReservada(), cantidad);
            throw BusinessException.conflict("INV-003",
                    "Reserva inconsistente para " + inv.getProducto().getCodigo());
        }
        inv.setCantidadReservada(inv.getCantidadReservada() - cantidad);
        inv.setCantidadActual(inv.getCantidadActual() - cantidad);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
        log.info("[INVENTARIO] Reserva confirmada. Stock actual: {}, reserva: {}", 
            inv.getCantidadActual(), inv.getCantidadReservada());
    }

    @Transactional
    public void liberarReserva(String productoId, String puestoId, int cantidad) {
        log.info("[INVENTARIO] Liberando reserva: productoId={}, puestoId={}, cantidad={}", 
            productoId, puestoId, cantidad);
        Inventario inv = obtener(productoId, puestoId);
        int nueva = Math.max(0, inv.getCantidadReservada() - cantidad);
        inv.setCantidadReservada(nueva);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
        log.info("[INVENTARIO] Reserva liberada. Nueva reserva: {}", nueva);
    }

    private Inventario nuevoInventario(String productoId, String puestoId) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> BusinessException.notFound("CAT-001",
                        "Producto no encontrado: " + productoId));
        Puesto puesto = puestoRepository.findById(puestoId)
                .orElseThrow(() -> BusinessException.notFound("PUE-001",
                        "Puesto no encontrado: " + puestoId));
        Inventario inv = new Inventario();
        inv.setProducto(producto);
        inv.setPuesto(puesto);
        log.info("[INVENTARIO] Creando nuevo registro de inventario: producto={}, puesto={}", 
            producto.getCodigo(), puesto.getId());
        return inv;
    }
}