package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Proveedor;
import pe.aspropa.mercadolink.dto.ActualizarProveedorRequest;
import pe.aspropa.mercadolink.dto.CrearProveedorRequest;
import pe.aspropa.mercadolink.dto.ProveedorResponse;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ProveedorRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProveedorService {

    private static final Logger log = LoggerFactory.getLogger(ProveedorService.class);

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<ProveedorResponse> listarTodos() {
        log.debug("[PROVEEDOR] Listando todos");
        return proveedorRepository.findAll().stream()
                .map(ProveedorResponse::new)
                .collect(Collectors.toList());
    }

    public ProveedorResponse obtener(String id) {
        log.debug("[PROVEEDOR] Obteniendo id={}", id);
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PROV-001", "Proveedor no encontrado: " + id));
        return new ProveedorResponse(p);
    }

    @Transactional
    public ProveedorResponse crear(CrearProveedorRequest req) {
        log.info("[PROVEEDOR] Creando razonSocial={}, ruc={}", req.getRazonSocial(), req.getRuc());
        if (proveedorRepository.existsByRuc(req.getRuc())) {
            throw BusinessException.conflict("PROV-002", "Ya existe un proveedor con ese RUC");
        }
        Proveedor p = new Proveedor();
        p.setRazonSocial(req.getRazonSocial());
        p.setRuc(req.getRuc());
        p.setNombreContacto(req.getNombreContacto());
        p.setTelefono(req.getTelefono());
        p.setEmail(req.getEmail());
        p.setDireccion(req.getDireccion());
        p.setDistrito(req.getDistrito());
        Proveedor saved = proveedorRepository.save(p);
        log.info("[PROVEEDOR] Creado id={}", saved.getId());
        return new ProveedorResponse(saved);
    }

    @Transactional
    public ProveedorResponse actualizar(String id, ActualizarProveedorRequest req) {
        log.info("[PROVEEDOR] Actualizando id={}", id);
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PROV-001", "Proveedor no encontrado: " + id));
        if (req.getRazonSocial() != null) p.setRazonSocial(req.getRazonSocial());
        if (req.getRuc() != null) p.setRuc(req.getRuc());
        if (req.getEstado() != null) p.setEstado(req.getEstado());
        if (req.getNombreContacto() != null) p.setNombreContacto(req.getNombreContacto());
        if (req.getTelefono() != null) p.setTelefono(req.getTelefono());
        if (req.getEmail() != null) p.setEmail(req.getEmail());
        if (req.getDireccion() != null) p.setDireccion(req.getDireccion());
        if (req.getDistrito() != null) p.setDistrito(req.getDistrito());
        Proveedor saved = proveedorRepository.save(p);
        log.info("[PROVEEDOR] Actualizado id={}", saved.getId());
        return new ProveedorResponse(saved);
    }

    @Transactional
    public void cambiarEstado(String id, String nuevoEstado) {
        log.info("[PROVEEDOR] Cambiando estado id={}, nuevoEstado={}", id, nuevoEstado);
        Proveedor p = proveedorRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("PROV-001", "Proveedor no encontrado: " + id));
        p.setEstado(nuevoEstado);
        proveedorRepository.save(p);
        log.info("[PROVEEDOR] Estado cambiado id={}", id);
    }
}
