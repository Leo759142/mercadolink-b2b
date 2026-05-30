package pe.aspropa.mercadolink.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import pe.aspropa.mercadolink.domain.Auditoria;
import pe.aspropa.mercadolink.repository.AuditoriaRepository;

/**
 * Servicio de utilidad de auditoría. La escritura es asíncrona para no
 * impactar la latencia de las operaciones de negocio críticas.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    @Async("asyncExecutor")
    public void registrar(String actorId, String tipoActor, String servicio,
                          String operacion, String referenciaId, String resultado,
                          String correlationId, String detalle) {
        Auditoria a = new Auditoria();
        a.setActorId(actorId);
        a.setTipoActor(tipoActor);
        a.setServicio(servicio);
        a.setOperacion(operacion);
        a.setReferenciaId(referenciaId);
        a.setResultado(resultado);
        a.setCorrelationId(correlationId);
        a.setDetalle(detalle);
        repository.save(a);
    }
}
