package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.aspropa.mercadolink.domain.Tag;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, String> {
    Optional<Tag> findByNombreIgnoreCase(String nombre);
    List<Tag> findByActivoTrue();
    List<Tag> findByActivoTrueOrderByNombreAsc();

    @Query("SELECT t FROM Tag t WHERE t.activo = true AND LOWER(t.nombre) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Tag> search(@Param("q") String q);

    @Query("SELECT t FROM Tag t WHERE t.activo = true ORDER BY (SELECT COUNT(pt) FROM ProductoTag pt WHERE pt.tag.id = t.id) DESC")
    List<Tag> findPopularTags();
}
