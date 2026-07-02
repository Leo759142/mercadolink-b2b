package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "producto_tags", uniqueConstraints = {
        @UniqueConstraint(name = "uk_producto_tag", columnNames = {"producto_id", "tag_id"})
})
public class ProductoTag {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(nullable = false)
    private Integer orden = 0;

    public ProductoTag() {}

    public ProductoTag(Producto producto, Tag tag, Integer orden) {
        this.producto = producto;
        this.tag = tag;
        this.orden = orden;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Tag getTag() { return tag; }
    public void setTag(Tag tag) { this.tag = tag; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
}
