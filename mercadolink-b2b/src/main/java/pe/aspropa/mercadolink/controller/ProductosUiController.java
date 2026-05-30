package pe.aspropa.mercadolink.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProductosUiController {

    @GetMapping("/productos")
    public String productos(Model model) {
        // The template will fetch products via JS from the API
        return "productos";
    }
}
