package pe.aspropa.mercadolink.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Intento de pago vinculado a un pedido. La pasarela externa es Izipay, pero la
 * fuente de verdad del estado vive en esta tabla y solo cambia mediante validación
 * backend del IPN/Webhook (sección 3.3.2 - regla de oro).
 */
@Entity
@Table(name = "pagos",
        uniqueConstraints = @UniqueConstraint(name = "uk_pago_order_id", columnNames = "orderId"))
public class Pago {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** Identificador único enviado a Izipay; clave para idempotencia. */
    @Column(nullable = false, length = 64)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "cliente"})
    private Pedido pedido;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 10)
    private String moneda = "PEN";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPago estado = EstadoPago.CREADO;

    /** Token retornado por la pasarela (mock en sandbox). */
    @Column(length = 200)
    private String formToken;

    /** Id de transacción confirmado por Izipay tras IPN. */
    @Column(length = 100)
    private String transactionId;

    @Column(nullable = false)
    private Instant fechaCreacion = Instant.now();

    @Column
    private Instant fechaActualizacion;

    public Pago() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public Pedido getPedido() { return pedido; }
    public void setPedido(Pedido pedido) { this.pedido = pedido; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }
    public EstadoPago getEstado() { return estado; }
    public void setEstado(EstadoPago estado) {
        this.estado = estado;
        this.fechaActualizacion = Instant.now();
    }
    public String getFormToken() { return formToken; }
    public void setFormToken(String f) { this.formToken = f; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String t) { this.transactionId = t; }
    public Instant getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(Instant f) { this.fechaCreacion = f; }
    public Instant getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(Instant f) { this.fechaActualizacion = f; }
}
