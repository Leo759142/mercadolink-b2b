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

export default function PedidosVendedor() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState(null);

  const cargar = useCallback(async () => {
    logEvento('cargar_pedidos_vendedor', {});
    setError('');
    try {
      const { data } = await pedidosAPI.miosPorPuesto();
      logEvento('cargar_pedidos_vendedor_exito', { count: data.length });
      setPedidos(data);
    } catch (err) {
      logEvento('cargar_pedidos_vendedor_error', { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcarEntregado = async (pedido) => {
    logEvento('marcar_entregado', { pedidoId: pedido.id });
    setAccionId(pedido.id);
    setError('');
    setInfo('');
    try {
      await pedidosAPI.cambiarEstado(pedido.id, 'ENTREGADO');
      logEvento('marcar_entregado_exito', { pedidoId: pedido.id });
      setInfo(`Pedido ${pedido.id.slice(0, 8)} marcado como ENTREGADO`);
      await cargar();
    } catch (err) {
      logEvento('marcar_entregado_error', { error: err.message });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

  const resumenItems = (p) => {
    if (!p.items?.length) return '—';
    return p.items
      .map((it) => `${it.producto?.descripcion || '?'} ×${it.cantidad}`)
      .join(', ');
  };

  const totalPedido = (p) => Number(p.montoTotal || 0).toFixed(2);

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando pedidos de tu puesto…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📦 Pedidos de Mi Puesto</div>
      <div className="panel-sub">
        Gestiona las entregas de los pedidos asignados a tu puesto
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Pedidos pendientes de entrega</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
            Actualizar
          </button>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total S/</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No hay pedidos asignados a tu puesto
                </td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code>{p.id.slice(0, 8)}…</code>
                  </td>
                  <td>{p.cliente?.nombreComercial || '—'}</td>
                  <td style={{ maxWidth: 250 }}>{resumenItems(p)}</td>
                  <td>
                    <strong>S/ {totalPedido(p)}</strong>
                  </td>
                  <td>
                    <span className={`pill ${pillClass(p.estado)}`}>
                      {labelEstado(p.estado)}
                    </span>
                  </td>
                  <td>
                    {p.estado === 'EN_DESPACHO' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={accionId === p.id}
                        onClick={() => marcarEntregado(p)}
                      >
                        {accionId === p.id ? '⏳' : '📦'} Marcar Entregado
                      </button>
                    )}
                    {p.estado === 'ENTREGADO' && (
                      <span className="pill pill-ok">✓ Entregado</span>
                    )}
                    {p.estado !== 'EN_DESPACHO' && p.estado !== 'ENTREGADO' && (
                      <span className="pill pill-grey">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}