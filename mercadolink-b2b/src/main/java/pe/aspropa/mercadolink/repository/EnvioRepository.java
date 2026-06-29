package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Envio;

public interface EnvioRepository extends JpaRepository<Envio, String> {
}
