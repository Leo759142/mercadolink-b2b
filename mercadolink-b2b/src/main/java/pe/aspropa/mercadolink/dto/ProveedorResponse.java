package pe.aspropa.mercadolink.dto;

import pe.aspropa.mercadolink.domain.Proveedor;

public class ProveedorResponse {

    private String id;
    private String razonSocial;
    private String ruc;
    private String estado;
    private String nombreContacto;
    private String telefono;
    private String email;
    private String direccion;
    private String distrito;
    private String fechaRegistro;

    public ProveedorResponse(Proveedor p) {
        this.id = p.getId();
        this.razonSocial = p.getRazonSocial();
        this.ruc = p.getRuc();
        this.estado = p.getEstado();
        this.nombreContacto = p.getNombreContacto();
        this.telefono = p.getTelefono();
        this.email = p.getEmail();
        this.direccion = p.getDireccion();
        this.distrito = p.getDistrito();
        this.fechaRegistro = p.getFechaRegistro().toString();
    }

    public String getId() { return id; }
    public String getRazonSocial() { return razonSocial; }
    public String getRuc() { return ruc; }
    public String getEstado() { return estado; }
    public String getNombreContacto() { return nombreContacto; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getDireccion() { return direccion; }
    public String getDistrito() { return distrito; }
    public String getFechaRegistro() { return fechaRegistro; }
}
