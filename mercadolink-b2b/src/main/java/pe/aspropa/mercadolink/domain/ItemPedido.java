package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/** Línea de pedido, asociada a un producto y un puesto. */
@Entity
@Table(name = "items_pedido")
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "proveedor"})
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "puesto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Puesto puesto;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    /** Estado del item individual (PENDIENTE, SURTIDO, ENTREGADO, RECHAZADO). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "VARCHAR(30) DEFAULT 'PENDIENTE'")
    private EstadoItem estadoItem = EstadoItem.PENDIENTE;

    /** Fecha/hora en que el proveedor confirmó surtimiento. */
    @Column(nullable = true)
    private Instant fechaSurtimiento;

    public enum EstadoItem {
        PENDIENTE,      // Esperando surtimiento
        SURTIDO,        // Proveedor ya envió
        ENTREGADO,      // Cliente recibió
        RECHAZADO       // No se pudo surtir
    }

    public ItemPedido() {}

    public BigDecimal subtotal() {
        if (precioUnitario == null) return BigDecimal.ZERO;
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Puesto getPuesto() { return puesto; }
    public void setPuesto(Puesto puesto) { this.puesto = puesto; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal p) { this.precioUnitario = p; }
    public EstadoItem getEstadoItem() { return estadoItem; }
    public void setEstadoItem(EstadoItem estadoItem) { this.estadoItem = estadoItem; }
    public Instant getFechaSurtimiento() { return fechaSurtimiento; }
    public void setFechaSurtimiento(Instant fechaSurtimiento) { this.fechaSurtimiento = fechaSurtimiento; }
}
