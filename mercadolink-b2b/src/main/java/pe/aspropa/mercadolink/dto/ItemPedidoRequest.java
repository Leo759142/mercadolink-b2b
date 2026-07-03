package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** DTO para crear items de pedido B2B.
 *  IMPORTANTE: El cliente NO especifica puesto.
 *  El sistema busca automáticamente el puesto con stock disponible.
 */
public class ItemPedidoRequest {
    @NotBlank
    private String productoId;
    
    @NotNull @Min(1)
    private Integer cantidad;

    public String getProductoId() { return productoId; }
    public void setProductoId(String productoId) { this.productoId = productoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}
