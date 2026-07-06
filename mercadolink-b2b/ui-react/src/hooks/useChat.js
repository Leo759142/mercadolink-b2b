import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getSession } from '../utils/auth';

const STORAGE_KEY = 'mercadolink_chat_mensajes';

export function useChat() {
  const [conectado, setConectado] = useState(false);
  const [mensajes, setMensajes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const clientRef = useRef(null);

  // Persistir mensajes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
  }, [mensajes]);

  const conectar = useCallback(() => {
    const session = getSession();
    if (!session.token || !session.actorId) return;

    // URL absoluta al backend (NO relativa, para evitar basename de React Router)
    const wsUrl = `${window.location.protocol}//${window.location.host}/ws-chat`;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${session.token}`,
      },
      onConnect: () => {
        setConectado(true);
        console.log('[CHAT] Conectado. ActorId:', session.actorId);

        client.subscribe('/user/queue/chat', (message) => {
          try {
            const raw = JSON.parse(message.body);
            console.log('[CHAT] Mensaje WS recibido:', raw);
            
            const msg = {
              id: raw.id || `ws-${Date.now()}`,
              emisorId: String(raw.emisorId),
              receptorId: String(raw.receptorId),
              contenido: raw.contenido,
              timestamp: typeof raw.timestamp === 'string' 
                ? raw.timestamp 
                : new Date().toISOString(),
              leido: raw.leido || false,
            };

            setMensajes((prev) => {
              // Evitar duplicados reales
              if (prev.some(m => m.id === msg.id && !m.id?.startsWith('temp-'))) {
                return prev;
              }
              // Reemplazar temporal correspondiente
              const sinTemp = prev.filter(m => 
                !(m.id?.startsWith('temp-') && 
                  m.emisorId === msg.emisorId && 
                  m.receptorId === msg.receptorId &&
                  m.contenido === msg.contenido)
              );
              return [...sinTemp, msg];
            });
          } catch (err) {
            console.error('[CHAT] Error:', err);
          }
        });
      },
      onDisconnect: () => setConectado(false),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    clientRef.current = client;
  }, []);

  const desconectar = useCallback(() => {
    clientRef.current?.deactivate();
  }, []);

  const enviarMensaje = useCallback((receptorId, contenido) => {
    const session = getSession();
    if (!clientRef.current?.connected) {
      console.warn('[CHAT] No conectado');
      return;
    }
    
    const msgTemp = {
      id: 'temp-' + Date.now(),
      emisorId: String(session.actorId),
      receptorId: String(receptorId),
      contenido,
      timestamp: new Date().toISOString(),
      leido: false,
    };
    
    setMensajes((prev) => [...prev, msgTemp]);
    
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