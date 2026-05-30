package pe.aspropa.mercadolink.dto;

import pe.aspropa.mercadolink.domain.Rol;

public class LoginResponse {
    private String token;
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private String actorId;
    private String nombreComercial;
    private Rol rol;
    /** Puesto asignado (vendedores); null para otros roles. */
    private String puestoId;

    public LoginResponse() {}

    public LoginResponse(String token, long expiresInSeconds, String actorId,
                         String nombreComercial, Rol rol, String puestoId) {
        this.token = token;
        this.expiresInSeconds = expiresInSeconds;
        this.actorId = actorId;
        this.nombreComercial = nombreComercial;
        this.rol = rol;
        this.puestoId = puestoId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String t) { this.tokenType = t; }
    public long getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(long e) { this.expiresInSeconds = e; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String n) { this.nombreComercial = n; }
    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
    public String getPuestoId() { return puestoId; }
    public void setPuestoId(String puestoId) { this.puestoId = puestoId; }
}
