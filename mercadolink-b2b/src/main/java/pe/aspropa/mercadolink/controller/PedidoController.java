package pe.aspropa.mercadolink.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.EstadoPedido;
import pe.aspropa.mercadolink.domain.Pedido;
import pe.aspropa.mercadolink.dto.CrearPedidoRequest;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.PedidoService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pedidos")
@Tag(name = "Pedidos", description = "Pedidos B2B multi-puesto")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENTE_MAYORISTA','VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Crea un pedido B2B (soporta clave de idempotencia)")
    public ResponseEntity<Pedido> crear(
            @Parameter(description = "Clave de idempotencia (UUID v4)")
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal AuthenticatedActor principal,
            @Valid @RequestBody CrearPedidoRequest req) {
        Pedido pedido = pedidoService.crearPedido(principal.actorId(), idempotencyKey, req);
        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta un pedido por id")
    public Pedido obtener(@PathVariable String id) {
        return pedidoService.obtenerPedido(id);
    }

    @GetMapping("/mios")
    @Operation(summary = "Lista los pedidos del actor autenticado")
    public List<Pedido> mios(@AuthenticationPrincipal AuthenticatedActor principal) {
        return pedidoService.listarPorCliente(principal.actorId());
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Cambia el estado de un pedido (transiciones controladas)")
    public Pedido cambiarEstado(@PathVariable String id,
                                @RequestBody Map<String, String> body,
                                @AuthenticationPrincipal AuthenticatedActor principal) {
        EstadoPedido nuevoEstado = EstadoPedido.valueOf(body.get("estado"));
        return pedidoService.cambiarEstado(id, nuevoEstado, principal.actorId());
    }
}
