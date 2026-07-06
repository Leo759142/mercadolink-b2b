package pe.aspropa.mercadolink.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.Actor;
import pe.aspropa.mercadolink.domain.MensajeChat;
import pe.aspropa.mercadolink.repository.ActorRepository;
import pe.aspropa.mercadolink.repository.MensajeChatRepository;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final MensajeChatRepository mensajeRepository;
    private final ActorRepository actorRepository;

    public ChatService(MensajeChatRepository mensajeRepository, ActorRepository actorRepository) {
        this.mensajeRepository = mensajeRepository;
        this.actorRepository = actorRepository;
    }

    @Transactional
    public MensajeChat guardarMensaje(String emisorId, String receptorId, String contenido) {
        MensajeChat msg = new MensajeChat(emisorId, receptorId, contenido);
        return mensajeRepository.save(msg);
    }

    @Transactional(readOnly = true)
    public List<MensajeChat> getConversacion(String userA, String userB) {
        return mensajeRepository.findConversacion(userA, userB);
    }

    @Transactional
    public void marcarLeidos(String receptorId, String emisorId) {
        List<MensajeChat> noLeidos = mensajeRepository.findConversacion(emisorId, receptorId)
                .stream()
                .filter(m -> m.getReceptorId().equals(receptorId) && !m.isLeido())
                .toList();
        noLeidos.forEach(m -> m.setLeido(true));
        mensajeRepository.saveAll(noLeidos);
    }

    public long contarNoLeidos(String receptorId) {
        return mensajeRepository.findByReceptorIdAndLeidoFalse(receptorId).size();
    }

    public List<Map<String, Object>> getContactosConInfo(String userId) {
        // 1. Contactos con conversación previa
        List<String> contactoIds = mensajeRepository.findContactos(userId);
        
        // 2. Todos los actores activos (para poder iniciar conversación)
        List<Actor> todosActores = actorRepository.findByActivoTrue();
        
        Set<String> todosIds = new LinkedHashSet<>(contactoIds);
        todosActores.stream()
            .map(Actor::getId)
            .filter(id -> !id.equals(userId))
            .forEach(todosIds::add);
        
        return todosIds.stream().map(id -> {
            Actor actor = actorRepository.findById(id).orElse(null);
            
            long noLeidos = mensajeRepository.findByReceptorIdAndLeidoFalse(userId)
                    .stream()
                    .filter(m -> m.getEmisorId().equals(id))
                    .count();

            Map<String, Object> contacto = new HashMap<>();
            contacto.put("id", id);
            contacto.put("nombre", actor != null ? actor.getNombreComercial() : "Desconocido");
            contacto.put("rol", actor != null ? actor.getRol().name() : "");
            contacto.put("noLeidos", noLeidos);
            contacto.put("tieneConversacion", contactoIds.contains(id));
            
            return contacto;
        }).collect(Collectors.toList());
    }
}