package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.dto.LoginRequest;
import pe.aspropa.mercadolink.dto.LoginResponse;
import pe.aspropa.mercadolink.dto.RegisterRequest;
import pe.aspropa.mercadolink.service.ActorService;
import pe.aspropa.mercadolink.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Registro de actores y obtención de tokens JWT")
public class AuthController {

    private final AuthService authService;
    private final ActorService actorService;

    public AuthController(AuthService authService, ActorService actorService) {
        this.authService = authService;
        this.actorService = actorService;
    }

    @PostMapping("/login")
    @Operation(summary = "Autenticación con email y contraseña, retorna JWT")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    @Operation(summary = "Registro de actor (Vendedor, Proveedor, Cliente Mayorista, Administrador)")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
        Actor actor = actorService.registrar(req);
        return ResponseEntity.ok(Map.of(
                "id", actor.getId(),
                "email", actor.getEmail(),
                "rol", actor.getRol(),
                "mensaje", "Registro exitoso. Use /api/v1/auth/login para obtener el token."
        ));
    }
}
