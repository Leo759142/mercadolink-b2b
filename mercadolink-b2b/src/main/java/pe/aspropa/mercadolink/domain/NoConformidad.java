package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Registro de no conformidad detectada en una recepción. */
@Entity
@Table(name = "no_conformidades")
public class NoConformidad {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recepcion_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Recepcion recepcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoNoConformidad tipo;

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(name = "accion_requerida", length = 500)
    private String accionRequerida;

    @Column(nullable = false)
    private boolean resuelta = false;

    @Column(name = "fecha_reporte", nullable = false)
    private Instant fechaReporte = Instant.now();

    @Column(name = "fecha_resolucion")
    private Instant fechaResolucion;

    public NoConformidad() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Recepcion getRecepcion() { return recepcion; }
    public void setRecepcion(Recepcion recepcion) { this.recepcion = recepcion; }
    public TipoNoConformidad getTipo() { return tipo; }
    public void setTipo(TipoNoConformidad tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getAccionRequerida() { return accionRequerida; }
    public void setAccionRequerida(String accionRequerida) { this.accionRequerida = accionRequerida; }
    public boolean isResuelta() { return resuelta; }
    public void setResuelta(boolean resuelta) { this.resuelta = resuelta; }
    public Instant getFechaReporte() { return fechaReporte; }
    public void setFechaReporte(Instant fechaReporte) { this.fechaReporte = fechaReporte; }
    public Instant getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(Instant fechaResolucion) { this.fechaResolucion = fechaResolucion; }
}
