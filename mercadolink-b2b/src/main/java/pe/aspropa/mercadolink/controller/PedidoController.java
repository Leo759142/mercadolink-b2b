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

    private static final Logger log = LoggerFactory.getLogger(PedidoController.class);

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
        log.info("[API PEDIDOS] POST crear - actorId={}, idempotencyKey={}, items={}", 
            principal.actorId(), idempotencyKey, req.getItems() != null ? req.getItems().size() : 0);
        Pedido pedido = pedidoService.crearPedido(principal.actorId(), idempotencyKey, req);
        log.info("[API PEDIDOS] Pedido creado - id={}, estado={}", pedido.getId(), pedido.getEstado());
        return ResponseEntity.ok(pedido);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta un pedido por id")
    public Pedido obtener(@PathVariable String id) {
        log.debug("[API PEDIDOS] GET obtener - id={}", id);
        return pedidoService.obtenerPedido(id);
    }

    @GetMapping("/mios")
    @Operation(summary = "Lista los pedidos del actor autenticado")
    public List<Pedido> mios(@AuthenticationPrincipal AuthenticatedActor principal) {
        log.debug("[API PEDIDOS] GET mios - actorId={}", principal.actorId());
        return pedidoService.listarPorCliente(principal.actorId());
    }

    @GetMapping("/proveedor/mios")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Lista los pedidos que incluyen productos del proveedor")
    public List<Pedido> miosProveedor(@AuthenticationPrincipal AuthenticatedActor principal) {
        log.debug("[API PEDIDOS] GET miosProveedor - proveedorId={}", principal.actorId());
        return pedidoService.listarPorProveedor(principal.actorId());
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
    @Operation(summary = "Cambia el estado de un pedido (transiciones controladas)")
    public Pedido cambiarEstado(@PathVariable String id,
                                @RequestBody Map<String, String> body,
                                @AuthenticationPrincipal AuthenticatedActor principal) {
        String nuevoEstado = body.get("estado");
        log.info("[API PEDIDOS] PATCH estado - id={}, nuevoEstado={}", id, nuevoEstado);
        EstadoPedido estado = EstadoPedido.valueOf(nuevoEstado);
        return pedidoService.cambiarEstado(id, estado, principal.actorId());
    }

    @PatchMapping("/{pedidoId}/items/{itemId}/surtir")
    @PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")
    @Operation(summary = "Marca un item del pedido como surtido por el proveedor")
    public Pedido surtirItem(@PathVariable String pedidoId,
                              @PathVariable Long itemId,
                              @AuthenticationPrincipal AuthenticatedActor principal) {
        log.info("[API PEDIDOS] PATCH surtir - pedidoId={}, itemId={}, proveedorId={}",
            pedidoId, itemId, principal.actorId());
        return pedidoService.surtirItem(pedidoId, itemId, principal.actorId());
    }
}