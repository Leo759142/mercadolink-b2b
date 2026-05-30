package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ItemPedidoRequest {
    @NotBlank
    private String productoId;
    @NotBlank
    private String puestoId;
    @NotNull @Min(1)
    private Integer cantidad;

    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public String getPuestoId() { return puestoId; }
    public void setPuestoId(String puestoId) { this.puestoId = puestoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}
