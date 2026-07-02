package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.Tag;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.service.TagService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/etiquetas")
@io.swagger.v3.oas.annotations.tags.Tag(name = "Etiquetas", description = "Gestión de etiquetas del catálogo")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "Lista todas las etiquetas activas con cantidad de productos")
    public List<Object> listar() {
        return tagService.listarTodas().stream()
                .map(t -> Map.of(
                        "id", t.getId(),
                        "nombre", t.getNombre(),
                        "slug", t.getSlug(),
                        "cantidadProductos", tagService.contarProductosPorTag(t)
                ))
                .toList();
    }

    @GetMapping("/buscar")
    @Operation(summary = "Busca etiquetas por nombre")
    public List<Tag> buscar(@RequestParam(required = false) String q) {
        return tagService.buscar(q);
    }

    @GetMapping("/populares")
    @Operation(summary = "Lista etiquetas más usadas ordenadas por cantidad de productos")
    public List<Object> populares() {
        return tagService.populares().stream()
                .map(t -> Map.of(
                        "id", t.getId(),
                        "nombre", t.getNombre(),
                        "slug", t.getSlug(),
                        "cantidadProductos", tagService.contarProductosPorTag(t)
                ))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Crea una nueva etiqueta (o devuelve la existente)")
    public ResponseEntity<Tag> crear(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        if (nombre == null || nombre.trim().isEmpty()) {
            throw BusinessException.badRequest("TAG-001", "El nombre de la etiqueta es obligatorio");
        }
        return ResponseEntity.ok(tagService.crear(nombre));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Renombra una etiqueta")
    public ResponseEntity<Tag> renombrar(@PathVariable String id,
                                          @RequestBody Map<String, String> body) {
        String nuevoNombre = body.get("nombre");
        if (nuevoNombre == null || nuevoNombre.trim().isEmpty()) {
            throw BusinessException.badRequest("TAG-003", "El nombre no puede estar vacío");
        }
        Tag tag = tagService.obtenerPorId(id);
        tagService.renombrar(id, nuevoNombre);
        return ResponseEntity.ok(tag);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR')")
    @Operation(summary = "Elimina (desactiva) una etiqueta")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        tagService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
