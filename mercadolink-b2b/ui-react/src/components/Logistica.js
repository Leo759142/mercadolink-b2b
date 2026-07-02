import React, { useCallback, useEffect, useState } from 'react';
import { logisticaAPI, pedidosAPI } from '../api';
import { labelEstado, siguientesEstados } from '../utils/pedidos';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
}

const PUEDE_GESTIONAR_ESTADO = ['VENDEDOR', 'ADMINISTRADOR', 'PROVEEDOR'];

const ESTADOS_PAGO = [
  { key: 'PENDIENTE_PAGO', label: 'Pendiente Pago', emoji: '💰' },
  { key: 'PAGADO', label: 'Pagado', emoji: '✅' },
];

const ESTADOS_LOGISTICO = [
  { key: 'PENDIENTE_RECOLECCION', label: 'Pendiente', emoji: '📦' },
  { key: 'EN_PREPARACION', label: 'Preparación', emoji: '🏭' },
  { key: 'ENVIADO', label: 'Enviado', emoji: '🚚' },
  { key: 'ENTREGADO', label: 'Entregado', emoji: '🎉' },
];

function FlujoSeguimiento({ estado, tipo }) {
  const estados = tipo === 'pago' ? ESTADOS_PAGO : ESTADOS_LOGISTICO;
  const idxActual = estados.findIndex((e) => e.key === estado);
  if (idxActual === -1) return null;
  return (
    <div className="flow-steps">
      {estados.map((e, i) => {
        const done = i < idxActual;
        const current = i === idxActual;
        return (
          <React.Fragment key={e.key}>
            {i > 0 && <span className="step-arrow">→</span>}
            <div className={`step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
              {e.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Logistica() {
  const rol = localStorage.getItem('rol');
  const [tab, setTab] = useState('pago');
  const [pedidos, setPedidos] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [recepciones, setRecepciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selected, setSelected] = useState(null);

  const cargarPedidos = useCallback(async () => {
    logEvento('cargar_pedidos', {});
    try {
      const { data } = await pedidosAPI.misPedidos();
      logEvento('cargar_pedidos_exito', { count: data.length });
      setPedidos(data);
    } catch (err) {
      logEvento('cargar_pedidos_error', { error: err.message });
      setError(err.message);
    }
  }, []);

  const cargarEnvios = useCallback(async () => {
    logEvento('cargar_envios', {});
    try {
      const { data } = await logisticaAPI.envios.listar();
      logEvento('cargar_envios_exito', { count: data.length });
      setEnvios(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      logEvento('cargar_envios_error', { error: err.message });
    }
  }, []);

  const cargarRecepciones = useCallback(async () => {
    logEvento('cargar_recepciones', {});
    try {
      const { data } = await logisticaAPI.recepciones.listar();
      logEvento('cargar_recepciones_exito', { count: data.length });
      setRecepciones(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      logEvento('cargar_recepciones_error', { error: err.message });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([cargarPedidos(), cargarEnvios(), cargarRecepciones()]);
      setLoading(false);
    };
    init();
  }, [cargarPedidos, cargarEnvios, cargarRecepciones]);

  const resumenItems = (p) => {
    if (!p.items?.length) return '—';
    return p.items.map((it) => `${it.producto?.descripcion || '?'} ×${it.cantidad}`).join(', ');
  };

  const proveedorDePedido = (p) => {
    if (p.proveedor?.razonSocial) return p.proveedor.razonSocial;
    if (p.items?.[0]?.producto?.proveedor?.razonSocial) return p.items[0].producto.proveedor.razonSocial;
    return '—';
  };

  const totalPedido = (p) => Number(p.montoTotal || 0).toFixed(2);

  const avanzarEstado = async (pedido, nuevoEstado) => {
    logEvento('avanzar_estado', { pedidoId: pedido.id, nuevoEstado });
    setError('');
    setInfo('');
    try {
      await pedidosAPI.cambiarEstado(pedido.id, nuevoEstado);
      logEvento('avanzar_estado_exito', { pedidoId: pedido.id, nuevoEstado });
      setInfo(`Estado: ${labelEstado(nuevoEstado)}`);
      await cargarPedidos();
    } catch (err) {
      logEvento('avanzar_estado_error', { error: err.message });
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando información logística…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📦 Logística</div>
      <div className="panel-sub">
        Envíos, recepciones y seguimiento · Servicio: <code>LogisticaEntrega</code>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--maderaclaro)' }}>
          <button type="button" className={`btn btn-sm ${tab === 'pago' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('pago')}>
            💰 Seguimiento de Pago
          </button>
          <button type="button" className={`btn btn-sm ${tab === 'logistico' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('logistico')}>
            🚚 Seguimiento Logístico
          </button>
        </nav>

        {tab === 'pago' && (
          <table className="tbl">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cant.</th>
                <th>Total S/</th>
                <th>Estado Pago</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={7}>No hay pedidos</td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id.slice(0, 8)}</code></td>
                    <td style={{ maxWidth: 220 }}>{resumenItems(p)}</td>
                    <td>{proveedorDePedido(p)}</td>
                    <td>{p.items?.length || 1}</td>
                    <td><strong>S/ {totalPedido(p)}</strong></td>
                    <td>
                      <FlujoSeguimiento estado={p.estado} tipo="pago" />
                    </td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>
                      {p.estado === 'PENDIENTE_PAGO' && (
                        <button type="button" className="btn btn-warning btn-sm" onClick={() => avanzarEstado(p, 'PAGADO')}>
                          Confirmar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'logistico' && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Guía</th>
                <th>Pedido</th>
                <th>Proveedor</th>
                <th>Transportista</th>
                <th>Despacho</th>
                <th>ETA</th>
                <th>Estado Logístico</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {envios.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay envíos</td>
                </tr>
              ) : (
                envios.map((env) => (
                  <tr key={env.id}>
                    <td><code>{env.numero_guia || env.id.slice(0, 8)}</code></td>
                    <td><code>{env.pedido_id?.slice(0, 8) || '—'}</code></td>
                    <td>{env.proveedor?.razonSocial || env.proveedor_id || '—'}</td>
                    <td>{env.transportista || '—'}</td>
                    <td>{env.fecha_despacho ? new Date(env.fecha_despacho).toLocaleDateString('es-PE') : '—'}</td>
                    <td>{env.fecha_estimada_entrega ? new Date(env.fecha_estimada_entrega).toLocaleDateString('es-PE') : '—'}</td>
                    <td>
                      <FlujoSeguimiento estado={env.etapa || 'PENDIENTE_RECOLECCION'} tipo="logistico" />
                    </td>
                    <td>
                      <button type="button" className="btn btn-success btn-sm" onClick={() => {
                        const ped = pedidos.find(x => x.id === env.pedido_id);
                        if (ped) setSelected(ped);
                      }}>
                        Atender
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Pedido <code>{selected.id.slice(0, 8)}</code></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <FlujoSeguimiento estado={selected.estado} tipo="pago" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {resumenItems(selected)} · S/ {totalPedido(selected)}
          </p>
          {PUEDE_GESTIONAR_ESTADO.includes(rol) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {siguientesEstados(selected.estado)
                .filter((e) => !['PAGADO', 'RECHAZADO'].includes(e))
                .map((est) => (
                  <button key={est} type="button" className="btn btn-primary btn-sm" onClick={() => avanzarEstado(selected, est)}>
                    → {labelEstado(est)}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title">✅ Actas de Recepción</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cargarRecepciones}>
            Actualizar
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pedido</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recepciones.length === 0 ? (
              <tr>
                <td colSpan={4}>No hay recepciones</td>
              </tr>
            ) : (
              recepciones.map((rec) => (
                <tr key={rec.id}>
                  <td><code>{rec.id.slice(0, 8)}</code></td>
                  <td>{rec.pedido_id?.slice(0, 8) || '—'}</td>
                  <td>
                    <span className={`pill ${rec.estado_recepcion === 'CONFORME' ? 'pill-ok' : 'pill-pending'}`}>
                      {rec.estado_recepcion || '—'}
                    </span>
                  </td>
                  <td>{rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleDateString('es-PE') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}