package pe.aspropa.mercadolink.security;

import pe.aspropa.mercadolink.domain.Rol;

/**
 * Principal liviano que viaja en el SecurityContext después de validar el JWT.
 * Evita arrastrar la entidad JPA en cada request.
 */
public record AuthenticatedActor(String actorId, String email, Rol rol) {}
