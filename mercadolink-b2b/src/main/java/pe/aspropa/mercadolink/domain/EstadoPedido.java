package pe.aspropa.mercadolink.domain;

/** Estados del ciclo de vida del pedido (sección 3.3.2). */
public enum EstadoPedido {
    BORRADOR,
    PENDIENTE_PAGO,
    PAGADO,
    CONFIRMADO,
    EN_DESPACHO,
    ENTREGADO,
    CANCELADO,
    EN_DISPUTA,
    RECHAZADO
}
