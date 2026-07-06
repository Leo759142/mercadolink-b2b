package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Rol;

import java.util.List;
import java.util.Optional;

public interface ActorRepository extends JpaRepository<Actor, String> {
    Optional<Actor> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByDocumento(String documento);
    List<Actor> findByRol(Rol rol);
    List<Actor> findByActivoTrue();
}
