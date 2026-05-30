package pe.aspropa.mercadolink.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class UiController {

    @GetMapping({"/", "/home"})
    public String index(Model model) {
        model.addAttribute("appName", "MercadoLink B2B");
        return "index";
    }
}
