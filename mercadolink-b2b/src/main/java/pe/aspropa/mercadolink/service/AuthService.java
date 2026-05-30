package pe.aspropa.mercadolink.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.dto.LoginRequest;
import pe.aspropa.mercadolink.dto.LoginResponse;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.security.JwtUtil;

@Service
public class AuthService {

    private final ActorRepository actorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(ActorRepository actorRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.actorRepository = actorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest req) {
        Actor actor = actorRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> BusinessException.notFound("EX-AUTH-001",
                        "Credenciales inválidas"));
        if (!actor.isActivo()) {
            throw BusinessException.forbidden("EX-AUTH-003", "Cuenta inactiva");
        }
        if (!passwordEncoder.matches(req.getPassword(), actor.getPasswordHash())) {
            throw BusinessException.notFound("EX-AUTH-001", "Credenciales inválidas");
        }
        String token = jwtUtil.generate(actor.getId(), actor.getEmail(), actor.getRol());
        String puestoId = actor.getPuesto() != null ? actor.getPuesto().getId() : null;
        return new LoginResponse(token, jwtUtil.getExpirationSeconds(),
                actor.getId(), actor.getNombreComercial(), actor.getRol(), puestoId);
    }
}
