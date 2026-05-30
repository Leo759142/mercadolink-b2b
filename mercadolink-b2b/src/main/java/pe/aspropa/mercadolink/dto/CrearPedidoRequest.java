package pe.aspropa.mercadolink.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CrearPedidoRequest {

    @NotEmpty
    @Valid
    private List<ItemPedidoRequest> items;

    @Size(max = 500)
    private String observaciones;

    public List<ItemPedidoRequest> getItems() { return items; }
    public void setItems(List<ItemPedidoRequest> items) { this.items = items; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String o) { this.observaciones = o; }
}
