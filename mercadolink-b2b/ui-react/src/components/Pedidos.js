import React, { useCallback, useEffect, useState } from 'react';
import { culqiAPI, pagosAPI, pedidosAPI } from '../api';
import { labelEstado, siguientesEstados } from '../utils/pedidos';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
  console.log(`[DEBUG] ${evento}`, datos);
}

const PUEDE_GESTIONAR_ESTADO = ['VENDEDOR', 'ADMINISTRADOR', 'PROVEEDOR'];

const ESTADOS_PAGO = [
  { key: 'PENDIENTE_PAGO', label: 'Pendiente Pago', emoji: '💰' },
  { key: 'PAGADO', label: 'Pagado', emoji: '✅' },
  { key: 'CONFIRMADO', label: 'Confirmado', emoji: '📋' },
  { key: 'EN_DESPACHO', label: 'En Despacho', emoji: '📦' },
  { key: 'ENTREGADO', label: 'Entregado', emoji: '🎉' },
];

function pillClass(estado) {
  if (['ENTREGADO', 'PAGADO'].includes(estado)) return 'pill-ok';
  if (['CANCELADO', 'RECHAZADO', 'EN_DISPUTA'].includes(estado)) return 'pill-red';
  if (['PENDIENTE_PAGO', 'BORRADOR'].includes(estado)) return 'pill-pending';
  if (['CONFIRMADO', 'EN_DESPACHO'].includes(estado)) return 'pill-blue';
  return 'pill-grey';
}

export default function Pedidos() {
  const rol = localStorage.getItem('rol');
  const [tab, setTab] = useState('misPedidos');
  const [pedidos, setPedidos] = useState([]);
  const [pedidosProveedor, setPedidosProveedor] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState(null);

  const cargarPedidos = useCallback(async () => {
    logEvento('cargar_pedidos', {});
    setError('');
    try {
      const { data } = await pedidosAPI.misPedidos();
      logEvento('cargar_pedidos_exito', { count: data.length });
      setPedidos(data);
    } catch (err) {
      logEvento('cargar_pedidos_error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPedidosProveedor = useCallback(async () => {
    logEvento('cargar_pedidos_proveedor', {});
    try {
      const { data } = await pedidosAPI.miosProveedor();
      logEvento('cargar_pedidos_proveedor_exito', { count: data.length });
      setPedidosProveedor(data);
    } catch (err) {
      logEvento('cargar_pedidos_proveedor_error', { error: err.message });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([cargarPedidos(), cargarPedidosProveedor()]);
    };
    init();
  }, [cargarPedidos, cargarPedidosProveedor]);

  const simularPagoCulqi = async (pedido) => {
    logEvento('simular_pago_culqi_inicio', { pedidoId: pedido.id, monto: pedido.montoTotal });
    setAccionId(pedido.id);
    setError('');
    setInfo('');
    try {
      let orderId = localStorage.getItem(`pago_${pedido.id}`);
      let monto = pedido.montoTotal;
      if (!orderId) {
        const iniciar = await pagosAPI.iniciar(pedido.id);
        orderId = iniciar.data.orderId;
        monto = iniciar.data.monto;
      }
      const amount = Number(monto).toFixed(2);
      const transactionId = `TX-CULQI-${Date.now()}`;
      await culqiAPI.firmar({ orderId, transactionId, status: 'APROBADO', amount });
      logEvento('simular_pago_culqi_webhook', { orderId, transactionId });
      await culqiAPI.webhook({ orderId, chargeId: 'ch-' + Date.now(), transactionId, status: 'APROBADO', amount });
      logEvento('simular_pago_culqi_exito', { pedidoId: pedido.id });
      setInfo('Webhook Culqi enviado. El pedido pasará a PAGADO en unos segundos.');
      setTimeout(cargarPedidos, 2000);
    } catch (err) {
      logEvento('simular_pago_culqi_error', { error: err.message });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

  const avanzarEstado = async (pedido, nuevoEstado) => {
    logEvento('avanzar_estado', { pedidoId: pedido.id, nuevoEstado });
    setAccionId(pedido.id);
    setError('');
    setInfo('');
    try {
      await pedidosAPI.cambiarEstado(pedido.id, nuevoEstado);
      logEvento('avanzar_estado_exito', { pedidoId: pedido.id, nuevoEstado });
      setInfo(`Estado actualizado: ${labelEstado(nuevoEstado)}`);
      await cargarPedidos();
    } catch (err) {
      logEvento('avanzar_estado_error', { error: err.message });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

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

  const FlujoSeguimiento = ({ estado }) => {
    const idxActual = ESTADOS_PAGO.findIndex((e) => e.key === estado);
    if (idxActual === -1) return <span className={`pill ${pillClass(estado)}`}>{labelEstado(estado)}</span>;
    return (
      <div className="flow-steps">
        {ESTADOS_PAGO.map((e, i) => {
          const done = i < idxActual;
          const current = i === idxActual;
          return (
            <React.Fragment key={e.key}>
              {i > 0 && <span className="step-arrow">→</span>}
              <div className={`step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                <span className="step-emoji">{e.emoji}</span> {e.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando pedidos…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📋 Gestión de Pedidos B2B</div>
      <div className="panel-sub">
        Flujo: Pendiente Pago → Pagado → Confirmado → En Despacho → Entregado
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--maderaclaro)' }}>
          <button type="button" className={`btn btn-sm ${tab === 'misPedidos' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('misPedidos')}>
            📋 Mis Pedidos
          </button>
          <button type="button" className={`btn btn-sm ${tab === 'pedidosRecibidos' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('pedidosRecibidos')}>
            📥 Pedidos Recibidos
          </button>
        </nav>

        {tab === 'misPedidos' && (
          <table className="tbl">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Cant.</th>
                <th>Total S/</th>
                <th>Estado</th>
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
                      <span className={`pill ${pillClass(p.estado)}`}>
                        {labelEstado(p.estado)}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(p)}>
                        Ver
                      </button>
                      {p.estado === 'PENDIENTE_PAGO' && (
                        <>
                          <button type="button" className="btn btn-warning btn-sm" onClick={() => avanzarEstado(p, 'PAGADO')}>
                            Confirmar
                          </button>
                          <button type="button" className="btn btn-success btn-sm" disabled={accionId === p.id} onClick={() => simularPagoCulqi(p)}>
                            Pagar Culqi
                          </button>
                        </>
                      )}
                      {(p.estado === 'CONFIRMADO' || p.estado === 'EN_DESPACHO') && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => avanzarEstado(p, p.estado === 'CONFIRMADO' ? 'EN_DESPACHO' : 'ENTREGADO')}>
                          Avanzar →
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'pedidosRecibidos' && (
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidosProveedor.length === 0 ? (
                <tr>
                  <td colSpan={6}>Sin pedidos de tus productos aún</td>
                </tr>
              ) : (
                pedidosProveedor.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.id.slice(0, 8)}…</code></td>
                    <td>{p.cliente?.nombreComercial || '—'}</td>
                    <td style={{ maxWidth: 250 }}>{resumenItems(p)}</td>
                    <td>S/ {Number(p.montoTotal).toFixed(2)}</td>
                    <td>
                      <span className={`pill ${pillClass(p.estado)}`}>
                        {labelEstado(p.estado)}
                      </span>
                    </td>
                    <td>{new Date(p.fechaCreacion).toLocaleString('es-PE')}</td>
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
            <span className="card-title">Flujo — <code>{selected.id.slice(0, 8)}</code></span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          </div>
          <FlujoSeguimiento estado={selected.estado} />
          {PUEDE_GESTIONAR_ESTADO.includes(rol) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {siguientesEstados(selected.estado)
                .filter((e) => e !== 'PAGADO' && e !== 'RECHAZADO')
                .map((est) => (
                  <button key={est} type="button" className="btn btn-success btn-sm" disabled={accionId === selected.id} onClick={() => avanzarEstado(selected, est)}>
                    → {labelEstado(est)}
                  </button>
                ))}
            </div>
          )}
          <p className="hint" style={{ marginTop: 8 }}>
            PAGADO/RECHAZADO se aplican vía webhook. Estados logísticos: vendedor/admin.
          </p>
        </div>
      )}
    </div>
  );
}