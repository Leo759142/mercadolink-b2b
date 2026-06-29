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

const ESTADOS_PAGO = ['PENDIENTE_PAGO', 'PAGADO', 'CONFIRMADO', 'EN_DESPACHO', 'ENTREGADO'];
const ESTADOS_CANCELADO = ['CANCELADO', 'RECHAZADO'];

export default function PedidosProveedor() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);

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

  const resumenItems = (p) => {
    if (!p.items?.length) return '—';
    return p.items
      .map((it) => `${it.producto?.descripcion || '?'} ×${it.cantidad}`)
      .join(', ');
  };

  const esPagoConfirmado = (pedido) => 
    ESTADOS_PAGO.includes(pedido.estado) && !ESTADOS_CANCELADO.includes(pedido.estado);

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando pedidos de tus productos…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">Mis Pedidos Proveedor</div>
      <div className="panel-sub">
        Pedidos que incluyen tus productos
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Pedidos recibidos</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
            Actualizar
          </button>
        </div>

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
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={6}>Sin pedidos de tus productos aún</td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code>{p.id.slice(0, 8)}…</code>
                  </td>
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
      </div>
    </div>
  );
}