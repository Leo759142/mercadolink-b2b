package pe.aspropa.mercadolink.domain;

/**
 * Roles definidos en el contrato SOA (sección 3.1.2 del Avance 1).
 * Cada rol se traduce automáticamente al authority {@code ROLE_<NAME>}
 * usado por Spring Security para las restricciones RBAC.
 */
public enum Rol {
    VENDEDOR,
    PROVEEDOR,
    CLIENTE_MAYORISTA,
    ADMINISTRADOR
}
