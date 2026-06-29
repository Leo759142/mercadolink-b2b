package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "proveedor_categorias")
public class ProveedorCategoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "proveedor_id", nullable = false, length = 36)
    private String proveedorId;

    @Column(name = "categoria_id", nullable = false)
    private Integer categoriaId;

    @Column(name = "fecha_asignacion", nullable = false)
    private LocalDate fechaAsignacion = LocalDate.now();

    public ProveedorCategoria() {}

    public ProveedorCategoria(String proveedorId, Integer categoriaId) {
        this.proveedorId = proveedorId;
        this.categoriaId = categoriaId;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getProveedorId() { return proveedorId; }
    public void setProveedorId(String proveedorId) { this.proveedorId = proveedorId; }
    public Integer getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Integer categoriaId) { this.categoriaId = categoriaId; }
    public LocalDate getFechaAsignacion() { return fechaAsignacion; }
    public void setFechaAsignacion(LocalDate fechaAsignacion) { this.fechaAsignacion = fechaAsignacion; }
}
