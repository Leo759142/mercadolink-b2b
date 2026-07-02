package pe.aspropa.mercadolink.dto;

import java.math.BigDecimal;
import java.util.List;

public class ProductoResponse {
    private String id;
    private String codigo;
    private String descripcion;
    private String unidadMedida;
    private BigDecimal precioReferencia;
    private boolean activo;
    private List<String> etiquetas;
    private String proveedorNombre;

    public ProductoResponse() {}

    public ProductoResponse(String id, String codigo, String descripcion, String unidadMedida,
                           BigDecimal precioReferencia, boolean activo, List<String> etiquetas, String proveedorNombre) {
        this.id = id;
        this.codigo = codigo;
        this.descripcion = descripcion;
        this.unidadMedida = unidadMedida;
        this.precioReferencia = precioReferencia;
        this.activo = activo;
        this.etiquetas = etiquetas;
        this.proveedorNombre = proveedorNombre;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String unidadMedida) { this.unidadMedida = unidadMedida; }
    public BigDecimal getPrecioReferencia() { return precioReferencia; }
    public void setPrecioReferencia(BigDecimal precioReferencia) { this.precioReferencia = precioReferencia; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public List<String> getEtiquetas() { return etiquetas; }
    public void setEtiquetas(List<String> etiquetas) { this.etiquetas = etiquetas; }
    public String getProveedorNombre() { return proveedorNombre; }
    public void setProveedorNombre(String proveedorNombre) { this.proveedorNombre = proveedorNombre; }
}