package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Registro de auditoría transversal (sección 3.5.3 - Sección 7).
 * Cada operación significativa deja un trail consultable por administrador.
 */
@Entity
@Table(name = "auditoria",
        indexes = {
                @Index(name = "ix_audit_actor", columnList = "actorId"),
                @Index(name = "ix_audit_referencia", columnList = "referenciaId")
        })
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 36)
    private String actorId;

    @Column(length = 30)
    private String tipoActor;

    @Column(nullable = false, length = 80)
    private String servicio;

    @Column(nullable = false, length = 100)
    private String operacion;

    @Column(length = 36)
    private String referenciaId;

    @Column(nullable = false, length = 20)
    private String resultado;

    @Column(length = 64)
    private String correlationId;

    @Column(length = 1000)
    private String detalle;

    @Column(nullable = false)
    private Instant timestampOp = Instant.now();

    public Auditoria() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getTipoActor() { return tipoActor; }
    public void setTipoActor(String tipoActor) { this.tipoActor = tipoActor; }
    public String getServicio() { return servicio; }
    public void setServicio(String servicio) { this.servicio = servicio; }
    public String getOperacion() { return operacion; }
    public void setOperacion(String operacion) { this.operacion = operacion; }
    public String getReferenciaId() { return referenciaId; }
    public void setReferenciaId(String referenciaId) { this.referenciaId = referenciaId; }
    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }
    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String c) { this.correlationId = c; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String d) { this.detalle = d; }
    public Instant getTimestampOp() { return timestampOp; }
    public void setTimestampOp(Instant t) { this.timestampOp = t; }
}
