package pe.aspropa.mercadolink.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Rol;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.repository.PuestoRepository;
import pe.aspropa.mercadolink.repository.ProductoRepository;

@Controller
public class ActoresUiController {

    private final ActorRepository actorRepository;
    private final PuestoRepository puestoRepository;
    private final ProductoRepository productoRepository;

    public ActoresUiController(ActorRepository actorRepository, PuestoRepository puestoRepository, ProductoRepository productoRepository) {
        this.actorRepository = actorRepository;
        this.puestoRepository = puestoRepository;
        this.productoRepository = productoRepository;
    }

    @GetMapping({"/", "/home"})
    public String inicio(Model model) {
        model.addAttribute("appName", "MercadoLink B2B");
        model.addAttribute("proveedores", actorRepository.findByRol(Rol.PROVEEDOR));
        model.addAttribute("vendedores", actorRepository.findByRol(Rol.VENDEDOR));
        model.addAttribute("productos", productoRepository.findByActivoTrue());
        return "index";
    }

    @GetMapping("/actores")
    public String actores(Model model) {
        model.addAttribute("proveedores", actorRepository.findByRol(Rol.PROVEEDOR));
        model.addAttribute("vendedores", actorRepository.findByRol(Rol.VENDEDOR));
        return "actores";
    }

    @GetMapping("/proveedores")
    public String proveedores(Model model) {
        model.addAttribute("proveedores", actorRepository.findByRol(Rol.PROVEEDOR));
        return "proveedores";
    }

    @GetMapping("/vendedores")
    public String vendedores(Model model) {
        model.addAttribute("vendedores", actorRepository.findByRol(Rol.VENDEDOR));
        return "vendedores";
    }

    @GetMapping("/proveedores/nuevo")
    public String nuevoProveedor(Model model) {
        model.addAttribute("actor", new Actor());
        model.addAttribute("puestos", puestoRepository.findAll());
        model.addAttribute("rol", Rol.PROVEEDOR);
        return "actor-form";
    }

    @GetMapping("/vendedores/nuevo")
    public String nuevoVendedor(Model model) {
        model.addAttribute("actor", new Actor());
        model.addAttribute("puestos", puestoRepository.findAll());
        model.addAttribute("rol", Rol.VENDEDOR);
        return "actor-form";
    }

    @GetMapping("/proveedores/{id}/editar")
    public String editarProveedor(@PathVariable String id, Model model) {
        Actor actor = actorRepository.findById(id).orElseThrow();
        model.addAttribute("actor", actor);
        model.addAttribute("puestos", puestoRepository.findAll());
        model.addAttribute("rol", Rol.PROVEEDOR);
        return "actor-form";
    }

    @GetMapping("/vendedores/{id}/editar")
    public String editarVendedor(@PathVariable String id, Model model) {
        Actor actor = actorRepository.findById(id).orElseThrow();
        model.addAttribute("actor", actor);
        model.addAttribute("puestos", puestoRepository.findAll());
        model.addAttribute("rol", Rol.VENDEDOR);
        return "actor-form";
    }

    @PostMapping("/actores/guardar")
    public String guardarActor(@ModelAttribute Actor actor, String puestoId) {
        if (puestoId != null && !puestoId.isBlank()) {
            puestoRepository.findById(puestoId).ifPresent(actor::setPuesto);
        }
        if (actor.getPasswordHash() == null || actor.getPasswordHash().isBlank()) {
            actorRepository.findById(actor.getId()).ifPresent(existing -> actor.setPasswordHash(existing.getPasswordHash()));
        }
        actorRepository.save(actor);
        return "redirect:" + (actor.getRol() == Rol.PROVEEDOR ? "/proveedores" : "/vendedores");
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @PostMapping("/actores/{id}/eliminar")
    public String eliminarActor(@PathVariable String id) {
        Actor actor = actorRepository.findById(id).orElseThrow();
        actor.setActivo(false);
        actorRepository.save(actor);
        return "redirect:" + (actor.getRol() == Rol.PROVEEDOR ? "/proveedores" : "/vendedores");
    }
}