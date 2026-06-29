package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class CrearEnvioRequest {

    @NotBlank
    private String pedidoId;

    @NotBlank
    private String proveedorId;

    @NotBlank
    private String transportista;

    @NotBlank
    @Size(max = 100)
    private String numeroGuia;

    @NotNull
    private Instant fechaDespacho;

    private java.time.LocalDate fechaEstimadaEntrega;

    @Size(max = 500)
    private String observaciones;

    public String getPedidoId() { return pedidoId; }
    public void setPedidoId(String pedidoId) { this.pedidoId = pedidoId; }
    public String getProveedorId() { return proveedorId; }
    public void setProveedorId(String proveedorId) { this.proveedorId = proveedorId; }
    public String getTransportista() { return transportista; }
    public void setTransportista(String transportista) { this.transportista = transportista; }
    public String getNumeroGuia() { return numeroGuia; }
    public void setNumeroGuia(String numeroGuia) { this.numeroGuia = numeroGuia; }
    public Instant getFechaDespacho() { return fechaDespacho; }
    public void setFechaDespacho(Instant fechaDespacho) { this.fechaDespacho = fechaDespacho; }
    public java.time.LocalDate getFechaEstimadaEntrega() { return fechaEstimadaEntrega; }
    public void setFechaEstimadaEntrega(java.time.LocalDate fechaEstimadaEntrega) { this.fechaEstimadaEntrega = fechaEstimadaEntrega; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
