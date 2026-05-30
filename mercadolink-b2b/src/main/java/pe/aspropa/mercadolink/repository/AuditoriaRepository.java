package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.Auditoria;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findTop100ByOrderByTimestampOpDesc();
    List<Auditoria> findByReferenciaIdOrderByTimestampOpDesc(String referenciaId);
}
