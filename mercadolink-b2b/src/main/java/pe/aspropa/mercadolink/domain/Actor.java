package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Actor del ecosistema MercadoLink: vendedor, proveedor, cliente mayorista o administrador.
 * Centraliza credenciales y datos comerciales (documento + RUC).
 */
@Entity
@Table(name = "actores",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_actor_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_actor_documento", columnNames = "documento")
        })
public class Actor {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, length = 150)
    private String nombreComercial;

    @Column(nullable = false, length = 100)
    private String email;

    /** Hash bcrypt; nunca se devuelve por la API. */
    @JsonIgnore
    @Column(nullable = false, length = 100)
    private String passwordHash;

    /** DNI o RUC según corresponda. */
    @Column(nullable = false, length = 20)
    private String documento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Rol rol;

    @Column(nullable = false)
    private boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puesto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Puesto puesto;

    @Column(nullable = false)
    private Instant fechaRegistro = Instant.now();

    public Actor() {}

    public Actor(String nombreComercial, String email, String passwordHash,
                 String documento, Rol rol) {
        this.nombreComercial = nombreComercial;
        this.email = email;
        this.passwordHash = passwordHash;
        this.documento = documento;
        this.rol = rol;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String n) { this.nombreComercial = n; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String p) { this.passwordHash = p; }
    public String getDocumento() { return documento; }
    public void setDocumento(String d) { this.documento = d; }
    public Rol getRol() { return rol; }
    public void setRol(Rol r) { this.rol = r; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean a) { this.activo = a; }
    public Puesto getPuesto() { return puesto; }
    public void setPuesto(Puesto p) { this.puesto = p; }
    public Instant getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Instant f) { this.fechaRegistro = f; }
}
