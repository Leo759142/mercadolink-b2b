package pe.aspropa.mercadolink.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.aspropa.mercadolink.domain.Notificacion;
import pe.aspropa.mercadolink.repository.NotificacionRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notificaciones")
public class NotificacionController {

    private final NotificacionRepository repository;

    public NotificacionController(NotificacionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Notificacion>> listar() {
        List<Notificacion> lista = repository.findTop50ByOrderByCreadaEnDesc();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Long> contarNoLeidas() {
        return ResponseEntity.ok(repository.countByLeidaFalse());
    }
}
