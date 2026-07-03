import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getSession } from '../utils/auth';

export function useChat() {
  const [conectado, setConectado] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const clientRef = useRef(null);

  const conectar = useCallback(() => {
    const session = getSession();
    if (!session.token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws-chat'),
      connectHeaders: {
        Authorization: `Bearer ${session.token}`,
      },
      onConnect: () => {
        setConectado(true);
        
        client.subscribe('/user/queue/chat', (message) => {
          const msg = JSON.parse(message.body);
          setMensajes((prev) => [...prev, msg]);
        });
      },
      onDisconnect: () => setConectado(false),
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;
  }, []);

  const desconectar = useCallback(() => {
    clientRef.current?.deactivate();
  }, []);

  const enviarMensaje = useCallback((receptorId, contenido) => {
    if (!clientRef.current?.connected) return;
    
    clientRef.current.publish({
      destination: '/app/chat/enviar',
      body: JSON.stringify({ receptorId, contenido }),
    });
  }, []);

  useEffect(() => {
    conectar();
    return () => desconectar();
  }, [conectar, desconectar]);

  return { conectado, mensajes, setMensajes, enviarMensaje };
}