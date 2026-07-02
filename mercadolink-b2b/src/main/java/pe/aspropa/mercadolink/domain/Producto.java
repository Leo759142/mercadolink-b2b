package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
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

    @Column(length = 500)
    private String etiquetas;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<ProductoTag> tags = new HashSet<>();

    public Producto() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String d) { this.descripcion = d; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String u) { this.unidadMedida = u; }
    public BigDecimal getPrecioReferencia() { return precioReferencia; }
    public void setPrecioReferencia(BigDecimal p) { this.precioReferencia = p; }
    public Actor getProveedor() { return proveedor; }
    public void setProveedor(Actor proveedor) { this.proveedor = proveedor; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public String getEtiquetas() { return etiquetas; }
    public void setEtiquetas(String etiquetas) { this.etiquetas = etiquetas; }
    public Set<ProductoTag> getTags() { return tags; }
    public void setTags(Set<ProductoTag> tags) { this.tags = tags; }

    public void addTag(Tag tag, int orden) {
        ProductoTag pt = new ProductoTag(this, tag, orden);
        tags.add(pt);
    }

    public void removeTag(Tag tag) {
        tags.removeIf(pt -> pt.getTag().equals(tag));
    }

    public java.util.List<String> getTagNombres() {
        return tags.stream()
                .sorted((a, b) -> a.getOrden().compareTo(b.getOrden()))
                .map(pt -> pt.getTag().getNombre())
                .toList();
    }
}
