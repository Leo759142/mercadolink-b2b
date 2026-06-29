package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CrearNoConformidadRequest {

    @NotBlank
    private String recepcionId;

    @NotBlank
    private String tipo;

    @NotBlank
    @Size(max = 500)
    private String descripcion;

    @Size(max = 500)
    private String accionRequerida;

    public String getRecepcionId() { return recepcionId; }
    public void setRecepcionId(String recepcionId) { this.recepcionId = recepcionId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getAccionRequerida() { return accionRequerida; }
    public void setAccionRequerida(String accionRequerida) { this.accionRequerida = accionRequerida; }
}
