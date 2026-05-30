package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

/** Producto del catálogo, publicado normalmente por un proveedor. */
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String descripcion;

    @Column(length = 60)
    private String categoria;

    @Column(nullable = false, length = 20)
    private String unidadMedida = "UNIDAD";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioReferencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "puesto"})
    private Actor proveedor;

    @Column(nullable = false)
    private boolean activo = true;

    public Producto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String d) { this.descripcion = d; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String c) { this.categoria = c; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String u) { this.unidadMedida = u; }
    public BigDecimal getPrecioReferencia() { return precioReferencia; }
    public void setPrecioReferencia(BigDecimal p) { this.precioReferencia = p; }
    public Actor getProveedor() { return proveedor; }
    public void setProveedor(Actor proveedor) { this.proveedor = proveedor; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
