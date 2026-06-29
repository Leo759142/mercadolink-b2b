package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Producto;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.ActorService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/productos")
@Tag(name = "Productos", description = "Catálogo de productos publicado por proveedores")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final ActorService actorService;

    public ProductoController(ProductoRepository productoRepository, ActorService actorService) {
        this.productoRepository = productoRepository;
        this.actorService = actorService;
    }

    @GetMapping
    @Operation(summary = "Lista productos activos del catálogo")
    public List<Producto> listar() {
        return productoRepository.findByActivoTrue();
    }

    @GetMapping("/mis-productos")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Lista productos publicados por el proveedor autenticado")
    public List<Producto> listarMisProductos(@AuthenticationPrincipal AuthenticatedActor principal) {
        return productoRepository.findByProveedorId(principal.actorId());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Publica un producto en el catálogo (solo PROVEEDOR/ADMIN)")
    public ResponseEntity<Producto> crear(@RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal AuthenticatedActor principal) {
        Actor proveedor = actorService.obtenerPorId(principal.actorId());
        String codigo = (String) body.get("codigo");
        String descripcion = (String) body.get("descripcion");
        String categoria = (String) body.get("categoria");
        Object precioRaw = body.get("precioReferencia");
        if (codigo == null || descripcion == null || precioRaw == null) {
            throw BusinessException.badRequest("EX-VAL-001",
                    "Campos obligatorios: codigo, descripcion, precioReferencia");
        }
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setDescripcion(descripcion);
        p.setCategoria(categoria);
        p.setPrecioReferencia(new BigDecimal(precioRaw.toString()));
        p.setProveedor(proveedor);
        p.setEtiquetas((String) body.get("etiquetas"));
        return ResponseEntity.ok(productoRepository.save(p));
    }

    @PatchMapping("/{id}/etiquetas")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Actualiza las etiquetas de un producto")
    public ResponseEntity<Producto> actualizarEtiquetas(@PathVariable String id,
                                                         @RequestBody Map<String, String> body,
                                                         @AuthenticationPrincipal AuthenticatedActor principal) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PRO-003", "Producto no encontrado: " + id));
        if (!p.getProveedor().getId().equals(principal.actorId()) && !principal.rol().name().equals("ADMINISTRADOR")) {
            throw BusinessException.forbidden("PRO-004", "No autorizado para modificar este producto");
        }
        p.setEtiquetas(body.get("etiquetas"));
        return ResponseEntity.ok(productoRepository.save(p));
    }
}
