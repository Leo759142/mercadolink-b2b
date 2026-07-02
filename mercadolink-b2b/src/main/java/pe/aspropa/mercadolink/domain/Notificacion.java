package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(length = 1000)
    private String mensaje;

    @Column(nullable = false)
    private boolean leida = false;

    @Column(nullable = false)
    private Instant creadaEn = Instant.now();

    public Notificacion() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public boolean isLeida() { return leida; }
    public void setLeida(boolean leida) { this.leida = leida; }
    public Instant getCreadaEn() { return creadaEn; }
    public void setCreadaEn(Instant creadaEn) { this.creadaEn = creadaEn; }
}
