package pe.aspropa.mercadolink.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.domain.Rol;

@Controller
public class ProductosUiController {

    private final ProductoRepository productoRepository;
    private final ActorRepository actorRepository;

    public ProductosUiController(ProductoRepository productoRepository, ActorRepository actorRepository) {
        this.productoRepository = productoRepository;
        this.actorRepository = actorRepository;
    }

    @GetMapping("/productos")
    public String productos(Model model) {
        model.addAttribute("productos", productoRepository.findByActivoTrue());
        return "productos";
    }
}
