package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Pago;

import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, String> {
    Optional<Pago> findByOrderId(String orderId);
    Optional<Pago> findByPedidoId(String pedidoId);
}
