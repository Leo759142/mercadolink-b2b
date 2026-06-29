package pe.aspropa.mercadolink.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.ProveedorCategoria;

public interface ProveedorCategoriaRepository extends JpaRepository<ProveedorCategoria, Integer> {
    List<ProveedorCategoria> findByProveedorId(String proveedorId);
    boolean existsByProveedorIdAndCategoriaId(String proveedorId, Integer categoriaId);
}
