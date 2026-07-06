package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "mensajes_chat")
public class MensajeChat {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, length = 36)
    private String emisorId;

    @Column(nullable = false, length = 36)
    private String receptorId;

    @Column(nullable = false, length = 500)
    private String contenido;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private Instant timestamp = Instant.now();

    @Column(nullable = false)
    private boolean leido = false;
    

    public MensajeChat() {}

    public MensajeChat(String emisorId, String receptorId, String contenido) {
        this.emisorId = emisorId;
        this.receptorId = receptorId;
        this.contenido = contenido;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmisorId() { return emisorId; }
    public void setEmisorId(String emisorId) { this.emisorId = emisorId; }
    public String getReceptorId() { return receptorId; }
    public void setReceptorId(String receptorId) { this.receptorId = receptorId; }
    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public boolean isLeido() { return leido; }
    public void setLeido(boolean leido) { this.leido = leido; }
}