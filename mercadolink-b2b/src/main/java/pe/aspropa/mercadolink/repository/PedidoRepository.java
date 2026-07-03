package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.aspropa.mercadolink.domain.Pedido;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, String> {
    Optional<Pedido> findByIdempotencyKey(String idempotencyKey);
    List<Pedido> findByClienteIdOrderByFechaCreacionDesc(String clienteId);

    @Query("select distinct p from Pedido p join p.items i where i.producto.proveedor.id = :proveedorId order by p.fechaCreacion desc")
    List<Pedido> findByProveedorId(@Param("proveedorId") String proveedorId);

    //NUEVO: Pedidos que tienen items asignados al puesto del vendedor
    @Query("select distinct p from Pedido p join p.items i where i.puesto.id = :puestoId order by p.fechaCreacion desc")
    List<Pedido> findByItemsPuestoId(@Param("puestoId") String puestoId);
}