import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // DEBUG: Ver todo el estado
  useEffect(() => {
    console.log('[DEBUG] Total mensajes en estado global:', mensajes.length);
    console.log('[DEBUG] Mensajes:', mensajes.map(m => ({
      id: m.id?.slice(0,8),
      emisor: m.emisorId?.slice(0,8),
      receptor: m.receptorId?.slice(0,8),
      contenido: m.contenido?.substring(0,20)
    })));
  }, [mensajes]);

  // Cargar contactos
  useEffect(() => {
    chatAPI.contactos().then((res) => {
      console.log('[DEBUG] Contactos cargados:', res.data);
      setContactos(res.data);
      setCargando(false);
    });
  }, []);

  // Filtrar mensajes para el contacto activo
  const mensajesFiltrados = useMemo(() => {
    if (!contactoActivo) return [];
    const contactoId = String(contactoActivo.id);
    const myId = String(actorId);
    
    return mensajes.filter(msg => {
      const msgEmisor = String(msg.emisorId);
      const msgReceptor = String(msg.receptorId);
      return (msgEmisor === myId && msgReceptor === contactoId) ||
             (msgEmisor === contactoId && msgReceptor === myId);
    });
  }, [mensajes, contactoActivo, actorId]);

  // Cargar conversación al seleccionar contacto
  useEffect(() => {
    if (!contactoActivo) return;
    
    const contactoId = String(contactoActivo.id);
    const myId = String(actorId);
    
    chatAPI.conversacion(contactoActivo.id).then((res) => {
      console.log('[DEBUG] Conversación cargada del servidor:', res.data);
      
      setMensajes((prev) => {
        // 1. Mantener mensajes de OTROS contactos (no tocarlos)
        const mensajesDeOtros = prev.filter(m => {
          const mEmisor = String(m.emisorId);
          const mReceptor = String(m.receptorId);
          const esDeEstaConversacion = 
            (mEmisor === myId && mReceptor === contactoId) ||
            (mEmisor === contactoId && mReceptor === myId);
          return !esDeEstaConversacion;
        });
        
        // 2. De esta conversación: mantener solo temporales que aún no tienen real equivalente
        const reales = (res.data || []).map(m => ({
          ...m,
          emisorId: String(m.emisorId),
          receptorId: String(m.receptorId),
        }));
        
        const idsReales = new Set(reales.map(m => m.id));
        
        const tempsDeEstaConversacion = prev.filter(m => {
          const mEmisor = String(m.emisorId);
          const mReceptor = String(m.receptorId);
          const esDeEstaConversacion = 
            (mEmisor === myId && mReceptor === contactoId) ||
            (mEmisor === contactoId && mReceptor === myId);
          return esDeEstaConversacion && m.id?.startsWith('temp-') && !idsReales.has(m.id);
        });
        
        const resultado = [...mensajesDeOtros, ...reales, ...tempsDeEstaConversacion];
        console.log('[DEBUG] Merge resultado:', resultado.length, 'mensajes');
        return resultado;
      });
      
      chatAPI.marcarLeidos(contactoActivo.id);
    });
  }, [contactoActivo, setMensajes, actorId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [mensajesFiltrados]); // ← Solo cuando cambian los filtrados, no todos

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!texto.trim() || !contactoActivo) return;
    
    console.log('[DEBUG] Enviando mensaje a:', contactoActivo.id);
    enviarMensaje(contactoActivo.id, texto.trim());
    setTexto('');
  };

  const formatearHora = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
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
            Contactos ({contactos.length})
          </div>
          {contactos.length === 0 ? (
            <div className="empty-state" style={{ padding: '1rem' }}>
              No hay contactos disponibles
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
              <div style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                {contactoActivo.nombre}
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 8 }}>
                  ({mensajesFiltrados.length} mensajes)
                </span>
              </div>

              <div
                ref={scrollRef}
                style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
              >
                {mensajesFiltrados.length === 0 && (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No hay mensajes aún. ¡Escribe el primero!
                  </div>
                )}
                {mensajesFiltrados.map((msg) => {
                  const esMio = String(msg.emisorId) === String(actorId);
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
                        opacity: msg.id?.startsWith('temp-') ? 0.7 : 1,
                      }}
                    >
                      <div>{msg.contenido}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {msg.id?.startsWith('temp-') ? '⏳ ' : ''}{formatearHora(msg.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>

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