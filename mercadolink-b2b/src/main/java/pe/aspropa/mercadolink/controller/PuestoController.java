package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.aspropa.mercadolink.domain.Puesto;
import pe.aspropa.mercadolink.repository.PuestoRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/puestos")
@Tag(name = "Puestos", description = "Puestos del mercado popular")
public class PuestoController {

    private final PuestoRepository puestoRepository;

    public PuestoController(PuestoRepository puestoRepository) {
        this.puestoRepository = puestoRepository;
    }

    @GetMapping
    @Operation(summary = "Lista puestos activos")
    public List<Puesto> listar() {
        return puestoRepository.findAll().stream().filter(Puesto::isActivo).toList();
    }
}
