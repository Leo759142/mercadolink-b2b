package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.aspropa.mercadolink.domain.Producto;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, String> {
    Optional<Producto> findByCodigo(String codigo);
    List<Producto> findByActivoTrue();
    List<Producto> findByProveedorId(String proveedorId);

    @Query("SELECT p FROM Producto p JOIN p.tags pt WHERE pt.tag.nombre = :tag AND p.activo = true")
    List<Producto> findByTagNombreAndActivoTrue(@Param("tag") String tag);

    @Query("SELECT p FROM Producto p JOIN p.tags pt WHERE pt.tag.nombre IN :tags AND p.activo = true GROUP BY p.id HAVING COUNT(DISTINCT pt.tag.nombre) = :tagCount")
    List<Producto> findByAllTagsAndActivoTrue(@Param("tags") List<String> tags, @Param("tagCount") long tagCount);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND (LOWER(p.codigo) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Producto> findByCodigoOrDescripcionContaining(@Param("q") String q);
}
