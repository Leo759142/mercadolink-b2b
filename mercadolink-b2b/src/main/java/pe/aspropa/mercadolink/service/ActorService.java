package pe.aspropa.mercadolink.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.Puesto;
import pe.aspropa.mercadolink.dto.RegisterRequest;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.repository.PuestoRepository;

@Service
public class ActorService {

    private final ActorRepository actorRepository;
    private final PuestoRepository puestoRepository;
    private final PasswordEncoder passwordEncoder;

    public ActorService(ActorRepository actorRepository,
                        PuestoRepository puestoRepository,
                        PasswordEncoder passwordEncoder) {
        this.actorRepository = actorRepository;
        this.puestoRepository = puestoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Actor registrar(RegisterRequest req) {
        if (actorRepository.existsByEmail(req.getEmail())) {
            throw BusinessException.conflict("REG-002",
                    "Ya existe una cuenta con ese email");
        }
        if (actorRepository.existsByDocumento(req.getDocumento())) {
            throw BusinessException.conflict("REG-003",
                    "Ya existe una cuenta con ese documento");
        }
        Actor actor = new Actor(
                req.getNombreComercial(),
                req.getEmail(),
                passwordEncoder.encode(req.getPassword()),
                req.getDocumento(),
                req.getRol()
        );
        if (req.getPuestoId() != null && !req.getPuestoId().isBlank()) {
            Puesto puesto = puestoRepository.findById(req.getPuestoId())
                    .orElseThrow(() -> BusinessException.notFound("PUE-001",
                            "Puesto no encontrado: " + req.getPuestoId()));
            actor.setPuesto(puesto);
        }
        return actorRepository.save(actor);
    }

    public Actor obtenerPorEmail(String email) {
        return actorRepository.findByEmail(email)
                .orElseThrow(() -> BusinessException.notFound("REG-001",
                        "Actor no encontrado: " + email));
    }

    public Actor obtenerPorId(String id) {
        return actorRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("REG-001",
                        "Actor no encontrado: " + id));
    }
}
