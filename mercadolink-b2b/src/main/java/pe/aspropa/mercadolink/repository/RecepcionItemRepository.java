package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.aspropa.mercadolink.domain.RecepcionItem;

public interface RecepcionItemRepository extends JpaRepository<RecepcionItem, Integer> {
}
