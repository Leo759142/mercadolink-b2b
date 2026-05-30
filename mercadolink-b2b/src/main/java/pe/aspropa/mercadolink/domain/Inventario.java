package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Stock por puesto y producto. Soporta reserva provisional para sagas
 * compensatorias (sección 3.4.4) usando una columna explícita reservado.
 */
@Entity
@Table(name = "inventario",
        uniqueConstraints = @UniqueConstraint(columnNames = {"producto_id", "puesto_id"}))
public class Inventario {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "proveedor"})
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "puesto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Puesto puesto;

    @Column(nullable = false)
    private int cantidadActual;

    @Column(nullable = false)
    private int cantidadReservada = 0;

    @Column(nullable = false)
    private int cantidadMinima = 0;

    /** Optimistic locking para evitar el conflicto INV-003. */
    @Version
    private Long version;

    @Column(nullable = false)
    private Instant ultimaActualizacion = Instant.now();

    public Inventario() {}

    public int disponible() { return cantidadActual - cantidadReservada; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Puesto getPuesto() { return puesto; }
    public void setPuesto(Puesto puesto) { this.puesto = puesto; }
    public int getCantidadActual() { return cantidadActual; }
    public void setCantidadActual(int c) { this.cantidadActual = c; }
    public int getCantidadReservada() { return cantidadReservada; }
    public void setCantidadReservada(int c) { this.cantidadReservada = c; }
    public int getCantidadMinima() { return cantidadMinima; }
    public void setCantidadMinima(int c) { this.cantidadMinima = c; }
    public Long getVersion() { return version; }
    public void setVersion(Long v) { this.version = v; }
    public Instant getUltimaActualizacion() { return ultimaActualizacion; }
    public void setUltimaActualizacion(Instant u) { this.ultimaActualizacion = u; }
}
