package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Recepcion;

public interface RecepcionRepository extends JpaRepository<Recepcion, String> {
}
