package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

/** Perfil ampliado de proveedor (tabla proveedores del SQL). */
@Entity
@Table(name = "proveedores")
public class Proveedor {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** Relación 1:1 con Actor del rol PROVEEDOR. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false, unique = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Actor actor;

    @Column(nullable = false, length = 200)
    private String razonSocial;

    @Column(nullable = false, unique = true, length = 20)
    private String ruc;

    @Column(nullable = false, length = 30)
    private String estado = "EN_EVALUACION";

    @Column(length = 150)
    private String nombreContacto;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(length = 300)
    private String direccion;

    @Column(length = 100)
    private String distrito;

    @Column(nullable = false)
    private LocalDate fechaRegistro = LocalDate.now();

    /** Fecha en que fue aprobado (null si aún en evaluación o rechazado). */
    @Column(nullable = true)
    private LocalDate fechaAprobacion;

    /** ID del ADMINISTRADOR que aprobó. */
    @Column(length = 36, nullable = true)
    private String aprobadoPor;

    public Proveedor() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Actor getActor() { return actor; }
    public void setActor(Actor actor) { this.actor = actor; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
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
    public LocalDate getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDate fechaRegistro) { this.fechaRegistro = fechaRegistro; }
    public LocalDate getFechaAprobacion() { return fechaAprobacion; }
    public void setFechaAprobacion(LocalDate fechaAprobacion) { this.fechaAprobacion = fechaAprobacion; }
    public String getAprobadoPor() { return aprobadoPor; }
    public void setAprobadoPor(String aprobadoPor) { this.aprobadoPor = aprobadoPor; }
}
