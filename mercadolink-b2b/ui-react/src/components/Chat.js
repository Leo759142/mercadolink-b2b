import React, { useEffect, useRef, useState } from 'react';
import { chatAPI } from '../api';
import { useChat } from '../hooks/useChat';
import { getSession } from '../utils/auth';

export default function Chat() {
  const { actorId, rol, nombreComercial } = getSession();
  const { conectado, mensajes, setMensajes, enviarMensaje } = useChat();
  
  const [contactos, setContactos] = useState([]);
  const [contactoActivo, setContactoActivo] = useState(null);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const scrollRef = useRef(null);

  // Cargar contactos
  useEffect(() => {
    chatAPI.contactos().then((res) => {
      setContactos(res.data);
      setCargando(false);
    });
  }, []);

  // Cargar conversación al seleccionar contacto
  useEffect(() => {
    if (!contactoActivo) return;
    chatAPI.conversacion(contactoActivo.id).then((res) => {
      setMensajes(res.data);
      chatAPI.marcarLeidos(contactoActivo.id);
    });
  }, [contactoActivo, setMensajes]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [mensajes]);

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || !contactoActivo) return;
    
    enviarMensaje(contactoActivo.id, texto.trim());
    setTexto('');
  };

  const formatearHora = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cargando) {
    return <div className="card">Cargando chat...</div>;
  }

  return (
    <div className="panel active">
      <div className="panel-title">💬 Chat</div>
      <div className="panel-sub">
        {conectado ? '🟢 Conectado' : '🔴 Desconectado'} · Conversa con {rol === 'VENDEDOR' ? 'proveedores' : 'vendedores'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', height: 'calc(100vh - 200px)' }}>
        
        {/* Lista de contactos */}
        <div className="card" style={{ overflowY: 'auto', padding: 0 }}>
          <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
            Contactos
          </div>
          {contactos.length === 0 ? (
            <div className="empty-state" style={{ padding: '1rem' }}>
              No hay conversaciones aún
            </div>
          ) : (
            contactos.map((c) => (
              <div
                key={c.id}
                onClick={() => setContactoActivo(c)}
                style={{
                  padding: '0.8rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: contactoActivo?.id === c.id ? 'rgba(56, 139, 253, 0.1)' : '',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.rol}</div>
                </div>
                {c.noLeidos > 0 && (
                  <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
                    {c.noLeidos}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Área de conversación */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          {contactoActivo ? (
            <>
              {/* Header */}
              <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                {contactoActivo.nombre}
              </div>

              {/* Mensajes */}
              <div
                ref={scrollRef}
                style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {mensajes.map((msg) => {
                  const esMio = msg.emisorId === actorId;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: esMio ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        background: esMio ? 'var(--accent)' : 'var(--surface2)',
                        color: esMio ? '#fff' : 'var(--text)',
                        padding: '0.6rem 0.9rem',
                        borderRadius: esMio ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        fontSize: '0.9rem',
                      }}
                    >
                      <div>{msg.contenido}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {formatearHora(msg.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <form
                onSubmit={handleEnviar}
                style={{ padding: '0.8rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}
              >
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  style={{ flex: 1 }}
                  autoComplete="off"
                />
                <button type="submit" className="btn btn-primary" disabled={!texto.trim()}>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Selecciona un contacto para comenzar a chatear
            </div>
          )}
        </div>
      </div>
    </div>
  );
}