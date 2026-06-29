package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.*;
import pe.aspropa.mercadolink.dto.CrearEnvioRequest;
import pe.aspropa.mercadolink.dto.CrearNoConformidadRequest;
import pe.aspropa.mercadolink.dto.CrearRecepcionRequest;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.LogisticaService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/logistica")
@Tag(name = "Logistica", description = "Backend de logística: envíos, recepciones y no conformidades")
public class LogisticaController {

    private static final Logger log = LoggerFactory.getLogger(LogisticaController.class);

    private final LogisticaService logisticaService;

    public LogisticaController(LogisticaService logisticaService) {
        this.logisticaService = logisticaService;
    }

    @GetMapping("/envios")
    @Operation(summary = "Lista todos los envíos")
    public List<Envio> listarEnvios() {
        log.debug("[API LOGISTICA] GET envios");
        return logisticaService.listarEnvios();
    }

    @PostMapping("/envios")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Crea un envío (solo PROVEEDOR/ADMIN)")
    public ResponseEntity<Envio> crearEnvio(@AuthenticationPrincipal AuthenticatedActor principal,
                                            @Valid @RequestBody CrearEnvioRequest req) {
        log.info("[API LOGISTICA] POST envios - actorId={}, pedidoId={}", principal.actorId(), req.getPedidoId());
        Envio envio = logisticaService.crearEnvio(principal.actorId(), req);
        log.info("[API LOGISTICA] Envio creado - id={}", envio.getId());
        return ResponseEntity.ok(envio);
    }

    @GetMapping("/envios/{id}")
    @Operation(summary = "Consulta un envío por id")
    public Envio obtenerEnvio(@PathVariable String id) {
        log.debug("[API LOGISTICA] GET envios/{id} - id={}", id);
        return logisticaService.obtenerEnvio(id);
    }

    @GetMapping("/recepciones")
    @Operation(summary = "Lista todas las recepciones")
    public List<Recepcion> listarRecepciones() {
        log.debug("[API LOGISTICA] GET recepciones");
        return logisticaService.listarRecepciones();
    }

    @PostMapping("/recepciones")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Crea una recepción (solo VENDEDOR/ADMIN)")
    public ResponseEntity<Recepcion> crearRecepcion(@AuthenticationPrincipal AuthenticatedActor principal,
                                                    @Valid @RequestBody CrearRecepcionRequest req) {
        log.info("[API LOGISTICA] POST recepciones - actorId={}, pedidoId={}", principal.actorId(), req.getPedidoId());
        Recepcion recepcion = logisticaService.crearRecepcion(principal.actorId(), req);
        log.info("[API LOGISTICA] Recepcion creada - id={}", recepcion.getId());
        return ResponseEntity.ok(recepcion);
    }

    @GetMapping("/recepciones/{id}")
    @Operation(summary = "Consulta una recepción por id")
    public Recepcion obtenerRecepcion(@PathVariable String id) {
        log.debug("[API LOGISTICA] GET recepciones/{id} - id={}", id);
        return logisticaService.obtenerRecepcion(id);
    }

    @PatchMapping("/recepciones/{id}/estado")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Actualiza el estado de una recepción")
    public Recepcion actualizarEstadoRecepcion(@PathVariable String id,
                                               @RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal AuthenticatedActor principal) {
        String nuevoEstado = body.get("estado");
        log.info("[API LOGISTICA] PATCH recepciones/{id}/estado - id={}, nuevoEstado={}", id, nuevoEstado);
        EstadoRecepcion estado = EstadoRecepcion.valueOf(nuevoEstado);
        return logisticaService.actualizarEstadoRecepcion(id, estado, principal.actorId());
    }

    @GetMapping("/no-conformidades")
    @Operation(summary = "Lista todas las no conformidades")
    public List<NoConformidad> listarNoConformidades() {
        log.debug("[API LOGISTICA] GET no-conformidades");
        return logisticaService.listarNoConformidades();
    }

    @PostMapping("/no-conformidades")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Crea una no conformidad (solo VENDEDOR/ADMIN)")
    public ResponseEntity<NoConformidad> crearNoConformidad(@AuthenticationPrincipal AuthenticatedActor principal,
                                                            @Valid @RequestBody CrearNoConformidadRequest req) {
        log.info("[API LOGISTICA] POST no-conformidades - actorId={}, tipo={}", principal.actorId(), req.getTipo());
        NoConformidad nc = logisticaService.crearNoConformidad(principal.actorId(), req);
        log.info("[API LOGISTICA] No conformidad creada - id={}", nc.getId());
        return ResponseEntity.ok(nc);
    }

    @PatchMapping("/no-conformidades/{id}/resolver")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Marca una no conformidad como resuelta")
    public NoConformidad resolverNoConformidad(@PathVariable String id,
                                               @AuthenticationPrincipal AuthenticatedActor principal) {
        log.info("[API LOGISTICA] PATCH no-conformidades/{id}/resolver - id={}", id);
        return logisticaService.resolverNoConformidad(id, principal.actorId());
    }
}
