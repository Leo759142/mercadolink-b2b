package pe.aspropa.mercadolink.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CrearRecepcionRequest {

    @NotBlank
    private String pedidoId;

    @NotBlank
    private String envioId;

    @NotBlank
    private String encargadoId;

    @NotBlank
    private String estadoRecepcion;

    @Size(max = 500)
    private String observaciones;

    @Valid
    private List<CrearRecepcionItemRequest> items;

    public String getPedidoId() { return pedidoId; }
    public void setPedidoId(String pedidoId) { this.pedidoId = pedidoId; }
    public String getEnvioId() { return envioId; }
    public void setEnvioId(String envioId) { this.envioId = envioId; }
    public String getEncargadoId() { return encargadoId; }
    public void setEncargadoId(String encargadoId) { this.encargadoId = encargadoId; }
    public String getEstadoRecepcion() { return estadoRecepcion; }
    public void setEstadoRecepcion(String estadoRecepcion) { this.estadoRecepcion = estadoRecepcion; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<CrearRecepcionItemRequest> getItems() { return items; }
    public void setItems(List<CrearRecepcionItemRequest> items) { this.items = items; }
}
