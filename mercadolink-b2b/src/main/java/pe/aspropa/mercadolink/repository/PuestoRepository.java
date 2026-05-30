package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Puesto;

import java.util.Optional;

public interface PuestoRepository extends JpaRepository<Puesto, String> {
    Optional<Puesto> findByNumero(String numero);
}
