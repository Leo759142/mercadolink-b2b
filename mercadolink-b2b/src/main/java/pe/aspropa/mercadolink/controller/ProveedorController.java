package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.dto.ActualizarProveedorRequest;
import pe.aspropa.mercadolink.dto.CrearProveedorRequest;
import pe.aspropa.mercadolink.dto.ProveedorResponse;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.ProveedorService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/proveedores")
@Tag(name = "Proveedores", description = "Gestión de proveedores del mercado")
public class ProveedorController {

    private static final Logger log = LoggerFactory.getLogger(ProveedorController.class);

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    @Operation(summary = "Lista todos los proveedores")
    public List<ProveedorResponse> listar() {
        log.debug("[API PROVEEDORES] GET listar");
        return proveedorService.listarTodos();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtiene un proveedor por id")
    public ProveedorResponse obtener(@PathVariable String id) {
        log.debug("[API PROVEEDORES] GET obtener id={}", id);
        return proveedorService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR')")
    @Operation(summary = "Crea un proveedor (solo ADMIN)")
    public ResponseEntity<ProveedorResponse> crear(@AuthenticationPrincipal AuthenticatedActor principal,
                                                   @Valid @RequestBody CrearProveedorRequest req) {
        log.info("[API PROVEEDORES] POST crear - actorId={}, razonSocial={}", principal.actorId(), req.getRazonSocial());
        ProveedorResponse resp = proveedorService.crear(req);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','PROVEEDOR')")
    @Operation(summary = "Actualiza datos de proveedor")
    public ProveedorResponse actualizar(@PathVariable String id,
                                        @Valid @RequestBody ActualizarProveedorRequest req,
                                        @AuthenticationPrincipal AuthenticatedActor principal) {
        log.info("[API PROVEEDORES] PUT actualizar id={}, actorId={}", id, principal.actorId());
        return proveedorService.actualizar(id, req);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR')")
    @Operation(summary = "Cambia el estado de un proveedor")
    public ResponseEntity<Void> cambiarEstado(@PathVariable String id,
                                              @RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal AuthenticatedActor principal) {
        String nuevoEstado = body.get("estado");
        log.info("[API PROVEEDORES] PATCH estado id={}, nuevoEstado={}, actorId={}", id, nuevoEstado, principal.actorId());
        proveedorService.cambiarEstado(id, nuevoEstado);
        return ResponseEntity.ok().build();
    }
}
