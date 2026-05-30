package pe.aspropa.mercadolink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.aspropa.mercadolink.domain.Rol;

public class RegisterRequest {

    @NotBlank @Size(min = 3, max = 150)
    private String nombreComercial;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 8, max = 100,
            message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank @Size(min = 8, max = 20)
    private String documento;

    @NotNull
    private Rol rol;

    private String puestoId;

    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String n) { this.nombreComercial = n; }
    public String getEmail() { return email; }
    public void setEmail(String e) { this.email = e; }
    public String getPassword() { return password; }
    public void setPassword(String p) { this.password = p; }
    public String getDocumento() { return documento; }
    public void setDocumento(String d) { this.documento = d; }
    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
    public String getPuestoId() { return puestoId; }
    public void setPuestoId(String puestoId) { this.puestoId = puestoId; }
}
