package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Pedido B2B con clave de idempotencia y ítems multi-puesto. */
@Entity
@Table(name = "pedidos",
        uniqueConstraints = @UniqueConstraint(name = "uk_pedido_idempotency",
                columnNames = "idempotency_key"))
public class Pedido {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "puesto"})
    private Actor cliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPedido estado = EstadoPedido.BORRADOR;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal montoTotal = BigDecimal.ZERO;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemPedido> items = new ArrayList<>();

    @Column(nullable = false)
    private Instant fechaCreacion = Instant.now();

    @Column
    private Instant fechaActualizacion;

    @Column(length = 500)
    private String observaciones;

    public Pedido() {}

    public void recalcularTotal() {
        this.montoTotal = items.stream()
                .map(ItemPedido::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String k) { this.idempotencyKey = k; }
    public Actor getCliente() { return cliente; }
    public void setCliente(Actor cliente) { this.cliente = cliente; }
    public EstadoPedido getEstado() { return estado; }
    public void setEstado(EstadoPedido e) { this.estado = e; this.fechaActualizacion = Instant.now(); }
    public BigDecimal getMontoTotal() { return montoTotal; }
    public void setMontoTotal(BigDecimal m) { this.montoTotal = m; }
    public List<ItemPedido> getItems() { return items; }
    public void setItems(List<ItemPedido> items) { this.items = items; }
    public Instant getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(Instant f) { this.fechaCreacion = f; }
    public Instant getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(Instant f) { this.fechaActualizacion = f; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String o) { this.observaciones = o; }
}
