package pe.aspropa.mercadolink.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.aspropa.mercadolink.domain.Auditoria;
import pe.aspropa.mercadolink.repository.AuditoriaRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
public class AuditoriaController {

    private final AuditoriaRepository repository;

    public AuditoriaController(AuditoriaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Auditoria>> listar() {
        List<Auditoria> lista = repository.findTop100ByOrderByTimestampOpDesc();
        return ResponseEntity.ok(lista);
    }
}
