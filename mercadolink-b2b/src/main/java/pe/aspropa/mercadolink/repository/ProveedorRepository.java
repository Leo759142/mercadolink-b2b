package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Proveedor;

import java.util.Optional;

public interface ProveedorRepository extends JpaRepository<Proveedor, String> {
    Optional<Proveedor> findByRuc(String ruc);
    boolean existsByRuc(String ruc);
}
