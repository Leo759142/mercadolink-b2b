package pe.aspropa.mercadolink.domain;

/** Estados del ciclo de vida del pago (sección 3.3.2). */
public enum EstadoPago {
    CREADO,
    PENDIENTE,
    APROBADO,
    RECHAZADO,
    EXPIRADO,
    EN_CONCILIACION
}
