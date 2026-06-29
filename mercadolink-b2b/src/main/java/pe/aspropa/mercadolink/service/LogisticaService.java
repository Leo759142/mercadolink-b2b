package pe.aspropa.mercadolink.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.*;
import pe.aspropa.mercadolink.dto.CrearEnvioRequest;
import pe.aspropa.mercadolink.dto.CrearNoConformidadRequest;
import pe.aspropa.mercadolink.dto.CrearRecepcionItemRequest;
import pe.aspropa.mercadolink.dto.CrearRecepcionRequest;
import pe.aspropa.mercadolink.exception.BusinessException;
import pe.aspropa.mercadolink.repository.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class LogisticaService {

    private static final Logger log = LoggerFactory.getLogger(LogisticaService.class);

    private final EnvioRepository envioRepository;
    private final RecepcionRepository recepcionRepository;
    private final RecepcionItemRepository recepcionItemRepository;
    private final NoConformidadRepository noConformidadRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final ActorService actorService;
    private final AuditoriaService auditoriaService;
    private final NotificacionService notificacionService;

    public LogisticaService(EnvioRepository envioRepository,
                            RecepcionRepository recepcionRepository,
                            RecepcionItemRepository recepcionItemRepository,
                            NoConformidadRepository noConformidadRepository,
                            PedidoRepository pedidoRepository,
                            ProductoRepository productoRepository,
                            ActorService actorService,
                            AuditoriaService auditoriaService,
                            NotificacionService notificacionService) {
        this.envioRepository = envioRepository;
        this.recepcionRepository = recepcionRepository;
        this.recepcionItemRepository = recepcionItemRepository;
        this.noConformidadRepository = noConformidadRepository;
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.actorService = actorService;
        this.auditoriaService = auditoriaService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public Envio crearEnvio(String actorId, CrearEnvioRequest req) {
        log.info("[LOGISTICA] Creando envio: pedidoId={}, proveedorId={}", req.getPedidoId(), req.getProveedorId());

        Pedido pedido = pedidoRepository.findById(req.getPedidoId())
                .orElseThrow(() -> BusinessException.notFound("LOG-001", "Pedido no encontrado: " + req.getPedidoId()));
        Actor proveedor = actorService.obtenerPorId(req.getProveedorId());
        if (proveedor.getRol() != Rol.PROVEEDOR && proveedor.getRol() != Rol.ADMINISTRADOR) {
            throw BusinessException.forbidden("LOG-002", "El actor no es proveedor: " + req.getProveedorId());
        }

        Envio envio = new Envio();
        envio.setPedido(pedido);
        envio.setProveedor(proveedor);
        envio.setTransportista(req.getTransportista());
        envio.setNumeroGuia(req.getNumeroGuia());
        envio.setFechaDespacho(req.getFechaDespacho());
        envio.setFechaEstimadaEntrega(req.getFechaEstimadaEntrega());
        envio.setObservaciones(req.getObservaciones());

        Envio saved = envioRepository.save(envio);
        log.info("[LOGISTICA] Envio creado: id={}", saved.getId());
        auditoriaService.registrar(actorId, "SISTEMA", "Logistica", "CrearEnvio", saved.getId(), "EXITO",
                null, "Envío creado para pedido " + pedido.getId());
        return saved;
    }

    public Envio obtenerEnvio(String id) {
        log.debug("[LOGISTICA] Obteniendo envio: id={}", id);
        return envioRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("LOG-404", "Envío no encontrado: " + id));
    }

    public List<Envio> listarEnvios() {
        log.debug("[LOGISTICA] Listando envios");
        return envioRepository.findAll();
    }

    @Transactional
    public Recepcion crearRecepcion(String actorId, CrearRecepcionRequest req) {
        log.info("[LOGISTICA] Creando recepcion: pedidoId={}, envioId={}", req.getPedidoId(), req.getEnvioId());

        Pedido pedido = pedidoRepository.findById(req.getPedidoId())
                .orElseThrow(() -> BusinessException.notFound("LOG-003", "Pedido no encontrado: " + req.getPedidoId()));
        Envio envio = envioRepository.findById(req.getEnvioId())
                .orElseThrow(() -> BusinessException.notFound("LOG-004", "Envío no encontrado: " + req.getEnvioId()));
        Actor encargado = actorService.obtenerPorId(req.getEncargadoId());
        if (encargado.getRol() != Rol.VENDEDOR && encargado.getRol() != Rol.ADMINISTRADOR) {
            throw BusinessException.forbidden("LOG-005", "El actor no es vendedor: " + req.getEncargadoId());
        }

        EstadoRecepcion estado;
        try {
            estado = EstadoRecepcion.valueOf(req.getEstadoRecepcion());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("LOG-006", "Estado de recepción inválido: " + req.getEstadoRecepcion());
        }

        Recepcion recepcion = new Recepcion();
        recepcion.setPedido(pedido);
        recepcion.setEnvio(envio);
        recepcion.setEncargado(encargado);
        recepcion.setEstadoRecepcion(estado);
        recepcion.setObservaciones(req.getObservaciones());

        if (req.getItems() != null) {
            for (CrearRecepcionItemRequest itemReq : req.getItems()) {
                Producto producto = productoRepository.findById(itemReq.getProductoId())
                        .orElseThrow(() -> BusinessException.notFound("LOG-007",
                                "Producto no encontrado: " + itemReq.getProductoId()));
                EstadoFisico estadoFisico = EstadoFisico.BUENO;
                if (itemReq.getEstadoFisico() != null && !itemReq.getEstadoFisico().isBlank()) {
                    try {
                        estadoFisico = EstadoFisico.valueOf(itemReq.getEstadoFisico());
                    } catch (IllegalArgumentException e) {
                        throw BusinessException.badRequest("LOG-008",
                                "Estado físico inválido: " + itemReq.getEstadoFisico());
                    }
                }
                RecepcionItem item = new RecepcionItem();
                item.setRecepcion(recepcion);
                item.setProducto(producto);
                item.setCantidadPedida(itemReq.getCantidadPedida());
                item.setCantidadRecibida(itemReq.getCantidadRecibida());
                item.setEstadoFisico(estadoFisico);
                recepcion.getItems().add(item);
            }
        }

        Recepcion saved = recepcionRepository.save(recepcion);
        log.info("[LOGISTICA] Recepcion creada: id={}", saved.getId());
        auditoriaService.registrar(actorId, "SISTEMA", "Logistica", "CrearRecepcion", saved.getId(), "EXITO",
                null, "Recepción creada para envío " + envio.getId());
        return saved;
    }

    public Recepcion obtenerRecepcion(String id) {
        log.debug("[LOGISTICA] Obteniendo recepcion: id={}", id);
        return recepcionRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("LOG-404", "Recepción no encontrada: " + id));
    }

    public List<Recepcion> listarRecepciones() {
        log.debug("[LOGISTICA] Listando recepciones");
        return recepcionRepository.findAll();
    }

    @Transactional
    public Recepcion actualizarEstadoRecepcion(String id, EstadoRecepcion nuevoEstado, String actorId) {
        log.info("[LOGISTICA] Actualizando estado recepcion: id={}, nuevoEstado={}", id, nuevoEstado);
        Recepcion recepcion = obtenerRecepcion(id);
        recepcion.setEstadoRecepcion(nuevoEstado);
        Recepcion saved = recepcionRepository.save(recepcion);
        log.info("[LOGISTICA] Estado recepcion actualizado: id={}, estado={}", id, nuevoEstado);
        auditoriaService.registrar(actorId, "SISTEMA", "Logistica", "ActualizarEstadoRecepcion", id, "EXITO",
                null, "Estado cambiado a " + nuevoEstado);
        return saved;
    }

    @Transactional
    public NoConformidad crearNoConformidad(String actorId, CrearNoConformidadRequest req) {
        log.info("[LOGISTICA] Creando no conformidad: recepcionId={}, tipo={}", req.getRecepcionId(), req.getTipo());

        Recepcion recepcion = recepcionRepository.findById(req.getRecepcionId())
                .orElseThrow(() -> BusinessException.notFound("LOG-009",
                        "Recepción no encontrada: " + req.getRecepcionId()));

        TipoNoConformidad tipo;
        try {
            tipo = TipoNoConformidad.valueOf(req.getTipo());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("LOG-010", "Tipo de no conformidad inválido: " + req.getTipo());
        }

        NoConformidad nc = new NoConformidad();
        nc.setRecepcion(recepcion);
        nc.setTipo(tipo);
        nc.setDescripcion(req.getDescripcion());
        nc.setAccionRequerida(req.getAccionRequerida());
        nc.setResuelta(false);
        nc.setFechaReporte(Instant.now());

        NoConformidad saved = noConformidadRepository.save(nc);
        log.info("[LOGISTICA] No conformidad creada: id={}", saved.getId());
        auditoriaService.registrar(actorId, "SISTEMA", "Logistica", "CrearNoConformidad", saved.getId(), "EXITO",
                null, "No conformidad registrada para recepción " + recepcion.getId());
        return saved;
    }

    public List<NoConformidad> listarNoConformidades() {
        log.debug("[LOGISTICA] Listando no conformidades");
        return noConformidadRepository.findAll();
    }

    @Transactional
    public NoConformidad resolverNoConformidad(String id, String actorId) {
        log.info("[LOGISTICA] Resolviendo no conformidad: id={}", id);
        NoConformidad nc = noConformidadRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("LOG-404", "No conformidad no encontrada: " + id));
        if (nc.isResuelta()) {
            throw BusinessException.badRequest("LOG-011", "La no conformidad ya está resuelta: " + id);
        }
        nc.setResuelta(true);
        nc.setFechaResolucion(Instant.now());
        NoConformidad saved = noConformidadRepository.save(nc);
        log.info("[LOGISTICA] No conformidad resuelta: id={}", id);
        auditoriaService.registrar(actorId, "SISTEMA", "Logistica", "ResolverNoConformidad", id, "EXITO",
                null, "No conformidad marcada como resuelta");
        return saved;
    }
}
