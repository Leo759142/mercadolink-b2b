package pe.aspropa.mercadolink.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Proveedor;
import pe.aspropa.mercadolink.domain.Rol;
import pe.aspropa.mercadolink.dto.CrearProveedorRequest;
import pe.aspropa.mercadolink.dto.ProveedorResponse;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.repository.ProveedorRepository;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ActorRepository actorRepository;
    private final PasswordEncoder passwordEncoder;

    public ProveedorService(ProveedorRepository proveedorRepository,
                            ActorRepository actorRepository,
                            PasswordEncoder passwordEncoder) {
        this.proveedorRepository = proveedorRepository;
        this.actorRepository = actorRepository;
        this.passwordEncoder = passwordEncoder;
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
        Actor actor = new Actor();
        actor.setNombreComercial(req.getRazonSocial());
        actor.setEmail(req.getEmail());
        actor.setPasswordHash(passwordEncoder.encode(
            req.getPassword() != null ? req.getPassword() : "password123"
        ));
        actor.setDocumento(req.getRuc());
        actor.setRol(Rol.PROVEEDOR);
        actor = actorRepository.save(actor);

    

    @Transactional
        public ProveedorResponse crear(CrearProveedorRequest req) {
            if (proveedorRepository.existsByRuc(req.getRuc())) {
                throw BusinessException.conflict("PROV-002", "Ya existe un proveedor con ese RUC");
            }

            // 1. Crear Actor (para autenticación y chat)
            Actor actor = new Actor();
            actor.setNombreComercial(req.getRazonSocial());
            actor.setEmail(req.getEmail());
            actor.setPasswordHash(passwordEncoder.encode(
                req.getPassword() != null ? req.getPassword() : "password123"
            ));
            actor.setDocumento(req.getRuc());
            actor.setRol(Rol.PROVEEDOR);
            actor = actorRepository.save(actor);

            // 2. Crear Proveedor vinculado
            Proveedor p = new Proveedor();
            p.setActor(actor);
            p.setRazonSocial(req.getRazonSocial());
            p.setRuc(req.getRuc());
            p.setNombreContacto(req.getNombreContacto());
            p.setTelefono(req.getTelefono());
            p.setEmail(req.getEmail());
            p.setDireccion(req.getDireccion());
            p.setDistrito(req.getDistrito());
            // estado ya tiene default "EN_EVALUACION"

            Proveedor saved = proveedorRepository.save(p);
            return new ProveedorResponse(saved);
        }
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
