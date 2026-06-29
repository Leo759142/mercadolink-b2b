package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "proveedor_ext")
public class ProveedorExt {

    @Id
    @Column(name = "actor_id", length = 36)
    private String actorId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "actor_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "puesto"})
    private Actor actor;

    @Column(length = 150)
    private String nombreContacto;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(length = 200)
    private String direccion;

    @Column(length = 100)
    private String distrito;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoProveedor estado = EstadoProveedor.EN_EVALUACION;

    @Column(nullable = false)
    private Instant fechaRegistro = Instant.now();

    public ProveedorExt() {}

    public ProveedorExt(Actor actor, String nombreContacto, String telefono,
                        String email, String direccion, String distrito) {
        this.actor = actor;
        this.actorId = actor.getId();
        this.nombreContacto = nombreContacto;
        this.telefono = telefono;
        this.email = email;
        this.direccion = direccion;
        this.distrito = distrito;
    }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public Actor getActor() { return actor; }
    public void setActor(Actor actor) { this.actor = actor; }
    public String getNombreContacto() { return nombreContacto; }
    public void setNombreContacto(String nombreContacto) { this.nombreContacto = nombreContacto; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getDistrito() { return distrito; }
    public void setDistrito(String distrito) { this.distrito = distrito; }
    public EstadoProveedor getEstado() { return estado; }
    public void setEstado(EstadoProveedor estado) { this.estado = estado; }
    public Instant getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(Instant fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
