import React, { useCallback, useEffect, useState } from 'react';
import { pedidosAPI } from '../api';
import { labelEstado, pillClass } from '../utils/pedidos';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
}

export default function PedidosProveedor() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState({});
  const [procesando, setProcesando] = useState({});

  const cargar = useCallback(async () => {
    logEvento('cargar_pedidos_proveedor', {});
    setError('');
    try {
      const { data } = await pedidosAPI.miosProveedor();
      logEvento('cargar_pedidos_proveedor_exito', { count: data.length });
      setPedidos(data);
    } catch (err) {
      logEvento('cargar_pedidos_proveedor_error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const confirmarSurtimiento = async (pedidoId, itemId) => {
    const key = `${pedidoId}-${itemId}`;
    setProcesando((prev) => ({ ...prev, [key]: true }));
    try {
      await pedidosAPI.confirmarSurtimiento(pedidoId, itemId);
      logEvento('surtimiento_confirmado', { pedidoId, itemId });
      // Recargar pedidos
      const { data } = await pedidosAPI.miosProveedor();
      setPedidos(data);
    } catch (err) {
      logEvento('surtimiento_error', { pedidoId, itemId, error: err.message });
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleExpandido = (pedidoId) => {
    setExpandido((prev) => ({
      ...prev,
      [pedidoId]: !prev[pedidoId],
    }));
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando pedidos proveedor…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📥 Pedidos Recibidos</div>
      <div className="panel-sub">Pedidos de tus productos · Usa la pestaña "Pedidos Recibidos" en Gestión de Pedidos para más opciones</div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Pedidos recibidos</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
            Actualizar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {pedidos.length === 0 ? (
            <div className="card">Sin pedidos de tus productos aún</div>
          ) : (
            pedidos.map((p) => (
              <div key={p.id} style={{ marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }}>
                {/* Fila resumen */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpandido(p.id)}>
                  <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <span style={{ fontWeight: 'bold', minWidth: 100 }}><code>{p.id.slice(0, 8)}…</code></span>
                    <span>{p.cliente?.nombreComercial || '—'}</span>
                    <span style={{ color: '#666' }}>S/ {Number(p.montoTotal).toFixed(2)}</span>
                    <span className={`pill ${pillClass(p.estado)}`}>{labelEstado(p.estado)}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#666' }}>{new Date(p.fechaCreacion).toLocaleString('es-PE')}</span>
                  <span style={{ marginLeft: '1rem' }}>{expandido[p.id] ? '▼' : '▶'}</span>
                </div>

                {/* Items expandidos */}
                {expandido[p.id] && p.items && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Items:</div>
                    {p.items.map((item) => {
                      const key = `${p.id}-${item.id}`;
                      return (
                        <div key={item.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f9f9f9',
                          marginBottom: '0.5rem',
                          borderRadius: '4px',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div><strong>{item.producto?.descripcion || '?'}</strong></div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Cantidad: {item.cantidad} | Puesto: {item.puesto?.nombre || 'N/A'} | Precio: S/ {Number(item.precioUnitario).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              Estado: <span className={`pill ${pillClass(item.estadoItem)}`}>{item.estadoItem || 'PENDIENTE'}</span>
                            </div>
                          </div>
                          {item.estadoItem === 'PENDIENTE' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => confirmarSurtimiento(p.id, item.id)}
                              disabled={procesando[key]}
                              style={{ marginLeft: '1rem' }}
                            >
                              {procesando[key] ? '⏳' : '✓ Surtido'}
                            </button>
                          )}
                          {item.estadoItem !== 'PENDIENTE' && (
                            <div style={{ marginLeft: '1rem', fontSize: '12px', color: '#666' }}>✓ {item.estadoItem}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}