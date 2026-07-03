package pe.aspropa.mercadolink.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.aspropa.mercadolink.domain.MensajeChat;
import pe.aspropa.mercadolink.security.AuthenticatedActor;
import pe.aspropa.mercadolink.service.ChatService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat/enviar")
    public void enviarMensajeWebSocket(@Payload Map<String, String> payload,
                                       @AuthenticationPrincipal AuthenticatedActor principal) {
        String receptorId = payload.get("receptorId");
        String contenido = payload.get("contenido");

        MensajeChat guardado = chatService.guardarMensaje(principal.actorId(), receptorId, contenido);

        messagingTemplate.convertAndSendToUser(receptorId, "/queue/chat", guardado);
        messagingTemplate.convertAndSendToUser(principal.actorId(), "/queue/chat", guardado);
    }

    @GetMapping("/conversacion/{contactoId}")
    public List<MensajeChat> getConversacion(@PathVariable String contactoId,
                                              @AuthenticationPrincipal AuthenticatedActor principal) {
        return chatService.getConversacion(principal.actorId(), contactoId);
    }

    @GetMapping("/contactos")
    public List<Map<String, Object>> getContactos(@AuthenticationPrincipal AuthenticatedActor principal) {
        return chatService.getContactosConInfo(principal.actorId());
    }

    @PostMapping("/leer/{contactoId}")
    public void marcarLeidos(@PathVariable String contactoId,
                             @AuthenticationPrincipal AuthenticatedActor principal) {
        chatService.marcarLeidos(principal.actorId(), contactoId);
    }

    @GetMapping("/no-leidos")
    public long contarNoLeidos(@AuthenticationPrincipal AuthenticatedActor principal) {
        return chatService.contarNoLeidos(principal.actorId());
    }
}