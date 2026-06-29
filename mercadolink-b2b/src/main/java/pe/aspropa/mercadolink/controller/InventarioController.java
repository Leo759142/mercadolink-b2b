package pe.aspropa.mercadolink.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import pe.aspropa.mercadolink.domain.Inventario;
import pe.aspropa.mercadolink.service.InventarioService;

@RestController
@RequestMapping("/api/v1/inventario")
@Tag(name = "Inventario", description = "Gestión de stock por puesto y producto")
public class InventarioController {

    private final InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @GetMapping("/puesto/{puestoId}")
    @Operation(summary = "Lista el inventario de un puesto")
    public List<Inventario> listarPorPuesto(@PathVariable String puestoId) {
        return inventarioService.listarPorPuesto(puestoId);
    }

    @PutMapping("/{productoId}/puesto/{puestoId}")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR','PROVEEDOR')")
    @Operation(summary = "Actualiza el stock de un producto en un puesto (regla INV-002)")
    public Inventario actualizar(@PathVariable String productoId,
                                 @PathVariable String puestoId,
                                 @RequestBody Map<String, Integer> body) {
        int cantidadActual = body.getOrDefault("cantidadActual", 0);
        int cantidadMinima = body.getOrDefault("cantidadMinima", 0);
        return inventarioService.actualizarStock(productoId, puestoId, cantidadActual, cantidadMinima);
    }
}
