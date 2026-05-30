package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Pedido;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, String> {
    Optional<Pedido> findByIdempotencyKey(String idempotencyKey);
    List<Pedido> findByClienteIdOrderByFechaCreacionDesc(String clienteId);
}
