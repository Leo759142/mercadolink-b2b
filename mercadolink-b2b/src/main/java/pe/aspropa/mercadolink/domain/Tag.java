package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "tags", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tag_nombre", columnNames = "nombre")
})
public class Tag {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String slug;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(nullable = false, updatable = false)
    private Instant fechaRegistro = Instant.now();

    @OneToMany(mappedBy = "tag", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<ProductoTag> productoTags = new HashSet<>();

    public Tag() {}

    public Tag(String nombre) {
        this.nombre = nombre;
        this.slug = nombre.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Instant getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Instant fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public Set<ProductoTag> getProductoTags() { return productoTags; }
    public void setProductoTags(Set<ProductoTag> productoTags) { this.productoTags = productoTags; }
}
