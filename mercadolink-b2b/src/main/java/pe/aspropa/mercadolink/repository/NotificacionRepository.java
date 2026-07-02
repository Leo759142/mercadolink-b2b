package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Notificacion;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findTop50ByOrderByCreadaEnDesc();
    List<Notificacion> findByLeidaFalseOrderByCreadaEnDesc();
    long countByLeidaFalse();
}
