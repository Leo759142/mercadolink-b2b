package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Producto;
import pe.aspropa.mercadolink.dto.ProductoResponse;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.ActorService;
import pe.aspropa.mercadolink.service.TagService;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/productos")
@Tag(name = "Productos", description = "Catálogo de productos publicado por proveedores")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final ActorService actorService;
    private final TagService tagService;

    public ProductoController(ProductoRepository productoRepository, ActorService actorService, TagService tagService) {
        this.productoRepository = productoRepository;
        this.actorService = actorService;
        this.tagService = tagService;
    }

    @GetMapping
    @Operation(summary = "Lista productos activos del catálogo, opcionalmente filtrados por etiqueta o búsqueda")
    public List<ProductoResponse> listar(@RequestParam(required = false) String tag,
                                         @RequestParam(required = false) String busqueda) {
        List<Producto> productos;
        if (busqueda != null && !busqueda.trim().isEmpty()) {
            productos = productoRepository.findByCodigoOrDescripcionContaining(busqueda.trim());
            if (!productos.isEmpty() && tag != null && !tag.trim().isEmpty()) {
                List<String> tagNames = List.of(tag.split(","));
                List<Producto> porTag = tagNames.size() == 1
                        ? productoRepository.findByTagNombreAndActivoTrue(tagNames.get(0).trim())
                        : productoRepository.findByAllTagsAndActivoTrue(
                                tagNames.stream().map(String::trim).toList(), tagNames.size());
                productos = productos.stream()
                        .filter(porTag::contains)
                        .toList();
            }
        } else if (tag == null || tag.trim().isEmpty()) {
            productos = productoRepository.findByActivoTrue();
        } else {
            List<String> tagNames = List.of(tag.split(","));
            if (tagNames.size() == 1) {
                productos = productoRepository.findByTagNombreAndActivoTrue(tagNames.get(0).trim());
            } else {
                productos = productoRepository.findByAllTagsAndActivoTrue(
                        tagNames.stream().map(String::trim).toList(), tagNames.size());
            }
        }
        return productos.stream()
                .map(p -> new ProductoResponse(
                        p.getId(),
                        p.getCodigo(),
                        p.getDescripcion(),
                        p.getUnidadMedida(),
                        p.getPrecioReferencia(),
                        p.isActivo(),
                        p.getTags().isEmpty() ? getEtiquetasString(p) : p.getTagNombres(),
                        p.getProveedor() != null ? p.getProveedor().getNombreComercial() : null
                ))
                .toList();
    }

    private List<String> getEtiquetasString(Producto p) {
        if (p.getEtiquetas() != null && !p.getEtiquetas().isEmpty()) {
            return Arrays.stream(p.getEtiquetas().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return Collections.emptyList();
    }

    @GetMapping("/mis-productos")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Lista productos publicados por el proveedor autenticado")
    public List<ProductoResponse> listarMisProductos(@AuthenticationPrincipal AuthenticatedActor principal) {
        return productoRepository.findByProveedorId(principal.actorId()).stream()
                .map(p -> new ProductoResponse(
                        p.getId(),
                        p.getCodigo(),
                        p.getDescripcion(),
                        p.getUnidadMedida(),
                        p.getPrecioReferencia(),
                        p.isActivo(),
                        p.getTags().isEmpty() ? getEtiquetasString(p) : p.getTagNombres(),
                        p.getProveedor() != null ? p.getProveedor().getNombreComercial() : null
                ))
                .toList();
    }

    @GetMapping("/sugerencias-etiquetas")
    @Operation(summary = "Devuelve sugerencias de etiquetas existentes para autocompletado")
    public List<String> sugerenciasEtiquetas() {
        return tagService.listarTodas().stream()
                .map(tag -> tag.getNombre())
                .sorted()
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Publica un producto en el catálogo (solo PROVEEDOR/ADMIN)")
    public ResponseEntity<ProductoResponse> crear(@RequestBody Map<String, Object> body,
                                           @AuthenticationPrincipal AuthenticatedActor principal) {
        Actor proveedor = actorService.obtenerPorId(principal.actorId());
        String codigo = (String) body.get("codigo");
        String descripcion = (String) body.get("descripcion");
        Object precioRaw = body.get("precioReferencia");
        if (codigo == null || descripcion == null || precioRaw == null) {
            throw BusinessException.badRequest("EX-VAL-001",
                    "Campos obligatorios: codigo, descripcion, precioReferencia");
        }
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setDescripcion(descripcion);
        p.setPrecioReferencia(new BigDecimal(precioRaw.toString()));
        p.setProveedor(proveedor);
        p.setEtiquetas((String) body.get("etiquetas"));
        String etiquetas = (String) body.get("etiquetas");
if (etiquetas != null && !etiquetas.isBlank()) {
             List<String> nombres = Arrays.stream(etiquetas.split(","))
                     .map(String::trim)
                     .filter(s -> !s.isEmpty())
                     .toList();
             tagService.sincronizarProducto(p, nombres);
        }
        Producto guardado = productoRepository.save(p);
        return ResponseEntity.ok(new ProductoResponse(
                guardado.getId(),
                guardado.getCodigo(),
                guardado.getDescripcion(),
                guardado.getUnidadMedida(),
                guardado.getPrecioReferencia(),
                guardado.isActivo(),
                guardado.getTags().isEmpty() ? getEtiquetasString(guardado) : guardado.getTagNombres(),
                guardado.getProveedor() != null ? guardado.getProveedor().getNombreComercial() : null
        ));
    }

    @PatchMapping("/{id}/etiquetas")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Actualiza las etiquetas de un producto (backward-compatible, mantiene string coma-separado)")
    public ResponseEntity<ProductoResponse> actualizarEtiquetas(@PathVariable String id,
                                                                  @RequestBody Map<String, String> body,
                                                                  @AuthenticationPrincipal AuthenticatedActor principal) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PRO-003", "Producto no encontrado: " + id));
        if (!p.getProveedor().getId().equals(principal.actorId()) && !principal.rol().name().equals("ADMINISTRADOR")) {
            throw BusinessException.forbidden("PRO-004", "No autorizado para modificar este producto");
        }
        String etiquetas = body.get("etiquetas");
        p.setEtiquetas(etiquetas);
        List<String> nombres = (etiquetas != null && !etiquetas.isEmpty())
                ? Arrays.stream(etiquetas.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : Collections.emptyList();
        tagService.sincronizarProducto(p, nombres);
        Producto guardado = productoRepository.save(p);
        return ResponseEntity.ok(new ProductoResponse(
                guardado.getId(),
                guardado.getCodigo(),
                guardado.getDescripcion(),
                guardado.getUnidadMedida(),
                guardado.getPrecioReferencia(),
                guardado.isActivo(),
                guardado.getTags().isEmpty() ? getEtiquetasString(guardado) : guardado.getTagNombres(),
                guardado.getProveedor() != null ? guardado.getProveedor().getNombreComercial() : null
        ));
    }
}