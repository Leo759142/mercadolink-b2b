package pe.aspropa.mercadolink.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Producto;
import pe.aspropa.mercadolink.domain.ProductoTag;
import pe.aspropa.mercadolink.domain.Tag;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ProductoRepository;
import pe.aspropa.mercadolink.repository.TagRepository;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final ProductoRepository productoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public TagService(TagRepository tagRepository, ProductoRepository productoRepository) {
        this.tagRepository = tagRepository;
        this.productoRepository = productoRepository;
    }

    public List<Tag> listarTodas() {
        return tagRepository.findByActivoTrueOrderByNombreAsc();
    }

    public List<Tag> buscar(String q) {
        if (q == null || q.trim().isEmpty()) return listarTodas();
        return tagRepository.search(q.trim());
    }

    public List<Tag> populares() {
        return tagRepository.findPopularTags();
    }

    public Tag crear(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw BusinessException.badRequest("TAG-001", "El nombre de la etiqueta no puede estar vacío");
        }
        nombre = nombre.trim();
        Optional<Tag> existente = tagRepository.findByNombreIgnoreCase(nombre);
        if (existente.isPresent()) {
            return existente.get();
        }
        String slug = nombre.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        Tag tag = new Tag();
        tag.setNombre(nombre);
        tag.setSlug(slug);
        tag.setFechaRegistro(Instant.now());
        return tagRepository.save(tag);
    }

    public Tag obtenerPorId(String id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("TAG-002", "Etiqueta no encontrada: " + id));
    }

    public void renombrar(String id, String nuevoNombre) {
        if (nuevoNombre == null || nuevoNombre.trim().isEmpty()) {
            throw BusinessException.badRequest("TAG-003", "El nombre no puede estar vacío");
        }
        nuevoNombre = nuevoNombre.trim();
        Tag tag = obtenerPorId(id);
        // Prevent renaming to an existing tag
        Optional<Tag> conflict = tagRepository.findByNombreIgnoreCase(nuevoNombre);
        if (conflict.isPresent() && !conflict.get().getId().equals(id)) {
            throw BusinessException.conflict("TAG-004", "Ya existe una etiqueta con ese nombre: " + nuevoNombre);
        }
        tag.setNombre(nuevoNombre);
        tag.setSlug(nuevoNombre.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""));
        tagRepository.save(tag);
    }

    public void eliminar(String id) {
        Tag tag = obtenerPorId(id);
        tag.setActivo(false);
        tagRepository.save(tag);
    }

    @Transactional
    public void sincronizarProducto(Producto producto, List<String> nombresEtiquetas) {
        if (nombresEtiquetas == null || nombresEtiquetas.isEmpty()) {
            producto.getTags().clear();
            producto.setEtiquetas("");
            return;
        }
        Set<String> nuevosNombres = nombresEtiquetas.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        Set<ProductoTag> existentes = new HashSet<>(producto.getTags());
        Set<String> existentesNombres = existentes.stream()
                .map(pt -> pt.getTag().getNombre())
                .collect(Collectors.toSet());

        // Remove tags no longer present
        for (ProductoTag pt : existentes) {
            if (!nuevosNombres.contains(pt.getTag().getNombre())) {
                producto.removeTag(pt.getTag());
            }
        }

        // Add new tags in order
        int orden = 0;
        for (String nombre : nuevosNombres) {
            if (!existentesNombres.contains(nombre)) {
                Tag tag = tagRepository.findByNombreIgnoreCase(nombre)
                        .orElseGet(() -> {
                            Tag nuevo = new Tag();
                            nuevo.setNombre(nombre);
                            nuevo.setSlug(nombre.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""));
                            nuevo.setFechaRegistro(Instant.now());
                            return tagRepository.save(nuevo);
                        });
                producto.addTag(tag, orden++);
            } else {
                // Update orden for existing tags based on new order
                for (ProductoTag pt : producto.getTags()) {
                    if (pt.getTag().getNombre().equals(nombre)) {
                        pt.setOrden(orden++);
                        break;
                    }
                }
            }
        }

        // Sync legacy etiquetas field
        producto.setEtiquetas(String.join(",", nuevosNombres.stream().sorted().toList()));
    }

    public long contarProductosPorTag(Tag tag) {
        return tag.getProductoTags().size();
    }

    @Transactional
    public void migrarEtiquetasLegacy() {
        List<Producto> productos = productoRepository.findAll();
        int i = 0;
        for (Producto p : productos) {
            if (p.getEtiquetas() != null && !p.getEtiquetas().isEmpty() && p.getTags().isEmpty()) {
                List<String> nombres = Arrays.stream(p.getEtiquetas().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                sincronizarProducto(p, nombres);
                productoRepository.saveAndFlush(p);
            }
            if (++i % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
    }
}
