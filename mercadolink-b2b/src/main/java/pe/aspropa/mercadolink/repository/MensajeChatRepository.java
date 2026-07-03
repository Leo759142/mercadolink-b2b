package pe.aspropa.mercadolink.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.aspropa.mercadolink.domain.MensajeChat;

import java.util.List;

public interface MensajeChatRepository extends JpaRepository<MensajeChat, String> {

    @Query("SELECT m FROM MensajeChat m WHERE " +
           "(m.emisorId = :userA AND m.receptorId = :userB) OR " +
           "(m.emisorId = :userB AND m.receptorId = :userA) " +
           "ORDER BY m.timestamp ASC")
    List<MensajeChat> findConversacion(@Param("userA") String userA, @Param("userB") String userB);

    List<MensajeChat> findByReceptorIdAndLeidoFalse(String receptorId);

    @Query("SELECT DISTINCT CASE WHEN m.emisorId = :userId THEN m.receptorId ELSE m.emisorId END " +
           "FROM MensajeChat m WHERE m.emisorId = :userId OR m.receptorId = :userId")
    List<String> findContactos(@Param("userId") String userId);
}