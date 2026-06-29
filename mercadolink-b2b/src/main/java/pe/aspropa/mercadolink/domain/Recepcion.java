package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Recepción de envío en almacén con control de estado y ítems. */
@Entity
@Table(name = "recepciones")
public class Recepcion {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "envio_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Envio envio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "encargado_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Actor encargado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_recepcion", nullable = false, length = 30)
    private EstadoRecepcion estadoRecepcion = EstadoRecepcion.CONFORME;

    @Column(nullable = false)
    private Instant fechaRecepcion = Instant.now();

    @Column(length = 500)
    private String observaciones;

    @OneToMany(mappedBy = "recepcion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecepcionItem> items = new ArrayList<>();

    public Recepcion() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Envio getEnvio() { return envio; }
    public void setEnvio(Envio envio) { this.envio = envio; }
    public Actor getEncargado() { return encargado; }
    public void setEncargado(Actor encargado) { this.encargado = encargado; }
    public EstadoRecepcion getEstadoRecepcion() { return estadoRecepcion; }
    public void setEstadoRecepcion(EstadoRecepcion estadoRecepcion) { this.estadoRecepcion = estadoRecepcion; }
    public Instant getFechaRecepcion() { return fechaRecepcion; }
    public void setFechaRecepcion(Instant fechaRecepcion) { this.fechaRecepcion = fechaRecepcion; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<RecepcionItem> getItems() { return items; }
    public void setItems(List<RecepcionItem> items) { this.items = items; }
}
