package pe.aspropa.mercadolink.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.aspropa.mercadolink.domain.Inventario;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, String> {

    Optional<Inventario> findByProductoIdAndPuestoId(String productoId, String puestoId);

    List<Inventario> findByPuestoId(String puestoId);
    
    /** Buscar todos los inventarios de un producto (para elegir puesto automáticamente en B2B). */
    List<Inventario> findByProductoId(String productoId);

    /** Optimistic lock por defecto via @Version; este método es por si se quisiera reforzar. */
    @Lock(LockModeType.OPTIMISTIC)
    @Query("select i from Inventario i where i.producto.id = :productoId and i.puesto.id = :puestoId")
    Optional<Inventario> findForUpdate(@Param("productoId") String productoId,
                                       @Param("puestoId") String puestoId);
}
