package pe.aspropa.mercadolink.service;

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

/**
 * Servicio de entidad para el inventario. Aplica las reglas INV-001 a INV-005:
 * stock no negativo, reserva atómica via @Version, y validación previa para
 * evitar el conflicto INV-003.
 */
@Service
public class InventarioService {

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
        return inventarioRepository.findByPuestoId(puestoId);
    }

    public Inventario obtener(String productoId, String puestoId) {
        return inventarioRepository.findByProductoIdAndPuestoId(productoId, puestoId)
                .orElseThrow(() -> BusinessException.notFound("CAT-001",
                        "No existe inventario para producto " + productoId +
                                " en puesto " + puestoId));
    }

    @Transactional
    public Inventario actualizarStock(String productoId, String puestoId,
                                      int cantidadActual, int cantidadMinima) {
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

    /** Reserva atómica de stock; usada por la saga de pedido (sección 3.4.4). */
    @Transactional
    public void reservar(String productoId, String puestoId, int cantidad) {
        Inventario inv = obtener(productoId, puestoId);
        if (inv.disponible() < cantidad) {
            throw BusinessException.conflict("INV-001",
                    "Stock insuficiente para producto " + inv.getProducto().getCodigo() +
                            ". Disponible: " + inv.disponible() + ", solicitado: " + cantidad);
        }
        inv.setCantidadReservada(inv.getCantidadReservada() + cantidad);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
    }

    /** Confirma la reserva: descuenta del stock real (paso commit del saga). */
    @Transactional
    public void confirmarReserva(String productoId, String puestoId, int cantidad) {
        Inventario inv = obtener(productoId, puestoId);
        if (inv.getCantidadReservada() < cantidad) {
            throw BusinessException.conflict("INV-003",
                    "Reserva inconsistente para " + inv.getProducto().getCodigo());
        }
        inv.setCantidadReservada(inv.getCantidadReservada() - cantidad);
        inv.setCantidadActual(inv.getCantidadActual() - cantidad);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
    }

    /** Libera la reserva en caso de fallo del pago (paso rollback del saga). */
    @Transactional
    public void liberarReserva(String productoId, String puestoId, int cantidad) {
        Inventario inv = obtener(productoId, puestoId);
        int nueva = Math.max(0, inv.getCantidadReservada() - cantidad);
        inv.setCantidadReservada(nueva);
        inv.setUltimaActualizacion(Instant.now());
        inventarioRepository.save(inv);
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
        return inv;
    }
}
