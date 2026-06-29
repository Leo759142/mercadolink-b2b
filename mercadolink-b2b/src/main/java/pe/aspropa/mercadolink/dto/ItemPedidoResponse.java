package pe.aspropa.mercadolink.dto;

import java.math.BigDecimal;

/** DTO para items de pedido con información del cliente y proveedor. */
public class ItemPedidoResponse {
    private Long id;
    private String productoId;
    private String productoDescripcion;
    private String productoCodigo;
    private String puestoId;
    private String puestoNombre;
    private int cantidad;
    private BigDecimal precioUnitario;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getProductoDescripcion() { return productoDescripcion; }
    public void setProductoDescripcion(String productoDescripcion) { this.productoDescripcion = productoDescripcion; }
    public String getProductoCodigo() { return productoCodigo; }
    public void setProductoCodigo(String productoCodigo) { this.productoCodigo = productoCodigo; }
    public String getPuestoId() { return puestoId; }
    public void setPuestoId(String puestoId) { this.puestoId = puestoId; }
    public String getPuestoNombre() { return puestoNombre; }
    public void setPuestoNombre(String puestoNombre) { this.puestoNombre = puestoNombre; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
    public BigDecimal getSubtotal() {
        return precioUnitario != null ? precioUnitario.multiply(BigDecimal.valueOf(cantidad)) : BigDecimal.ZERO;
    }
}