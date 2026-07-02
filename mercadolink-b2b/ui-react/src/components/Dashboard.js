import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventarioAPI, pedidosAPI, productosAPI, puestosAPI, proveedoresAPI } from '../api';
import { getSession, rolToKey } from '../utils/auth';
import { labelEstado, pedidoActivo, pillClass } from '../utils/pedidos';

const SUBTITLES = {
  vendedor: '📦 Gestiona tu puesto, inventario y ventas',
  proveedor: '🏭 Administra tu catálogo y órdenes',
  mayorista: '🛒 Realiza pedidos y revisa disponibilidad',
  admin: '🛡️ Panel de control global de Aspropa',
};

function resumenItems(p) {
  if (!p.items?.length) return '—';
  return p.items
    .map(
      (it) =>
        `${it.producto?.descripcion || '?'} ×${it.cantidad}`
    )
    .join(', ');
}

export default function Dashboard() {
  const { rol, puestoId } = getSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pedidosActivos: 0,
    productos: 0,
    bajoMinimo: 0,
    montoPendiente: 0,
    proveedoresActivos: 0,
  });
  const [pedidos, setPedidos] = useState([]);
  const [stockBars, setStockBars] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  const cargar = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [prodRes, pedRes, puestosRes, provRes] = await Promise.all([
        productosAPI.list(),
        pedidosAPI.misPedidos(),
        puestosAPI.list(),
        proveedoresAPI.listar(),
      ]);

      const listaPedidos = pedRes.data || [];
      const activos = listaPedidos.filter(pedidoActivo);
      const montoPendiente = activos.reduce(
        (s, p) => s + Number(p.montoTotal || 0),
        0
      );

      let bajoMinimo = 0;
      let bars = [];
      const puestoInventario =
        puestoId || (puestosRes.data.length > 0 ? puestosRes.data[0].id : null);

      if (puestoInventario && ['vendedor', 'admin'].includes(rolToKey(rol))) {
        try {
          const invRes = await inventarioAPI.porPuesto(puestoInventario);
          const inv = invRes.data || [];
          bajoMinimo = inv.filter(
            (i) => i.cantidadActual - (i.cantidadReservada || 0) < i.cantidadMinima
          ).length;
          bars = inv.map((i) => {
            const disp = i.cantidadActual - (i.cantidadReservada || 0);
            const pct = Math.min(
              100,
              Math.round((disp / Math.max(i.cantidadMinima * 2, 1)) * 100)
            );
            return {
              nombre: i.producto?.descripcion || i.producto?.codigo || '—',
              disp,
              min: i.cantidadMinima,
              pct,
              low: disp < i.cantidadMinima,
            };
          });
        } catch {
          /* inventario no accesible para este rol */
        }
      }

      setStats({
        pedidosActivos: activos.length,
        productos: prodRes.data?.length || 0,
        bajoMinimo,
        montoPendiente,
        proveedoresActivos: Array.isArray(provRes.data) ? provRes.data.length : 0,
      });
      setPedidos(listaPedidos.slice(0, 5));
      setStockBars(bars);

      const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
      setActivityLog(logs.slice(-8).reverse());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [puestoId, rol]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const key = rolToKey(rol);

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">🔄 Cargando tu puesto...</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">🏠 Bienvenido al mercado</div>
      <div className="panel-sub">{SUBTITLES[key] || SUBTITLES.mayorista}</div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="stats-row">
        <div className="stat-card pulse">
          <div className="label">📋 Pedidos activos</div>
          <div className="val" style={{ color: 'var(--info)' }}>
            {stats.pedidosActivos}
          </div>
        </div>
        <div className="stat-card pulse">
          <div className="label">🛒 Productos en venta</div>
          <div className="val" style={{ color: 'var(--success)' }}>
            {stats.productos}
          </div>
        </div>
        <div className="stat-card pulse">
          <div className="label">⚠️ Pocos productos</div>
          <div className="val" style={{ color: stats.bajoMinimo ? 'var(--danger)' : 'var(--text-muted)' }}>
            {stats.bajoMinimo}
          </div>
        </div>
        <div className="stat-card pulse">
          <div className="label">💰 Total pendiente (S/)</div>
          <div className="val" style={{ color: 'var(--warning)' }}>
            {stats.montoPendiente.toFixed(2)}
          </div>
        </div>
        <div className="stat-card pulse">
          <div className="label">🤝 Proveedores activos</div>
          <div className="val" style={{ color: 'var(--maderaoscuro)' }}>
            {stats.proveedoresActivos}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Últimos pedidos</span>
            <Link to="/pedidos" className="pill pill-blue pulse">
              Ver todos →
            </Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">📭 Aún no tienes pedidos</td>
                </tr>
              ) : (
                pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: "'Amatic SC', cursive", fontSize: '1.1rem' }}>
                        {p.id.slice(0, 8)}
                      </span>
                    </td>
                    <td>{resumenItems(p)}</td>
                    <td>{p.items?.length || 1}</td>
                    <td>
                      <span className={`pill ${pillClass(p.estado)}`}>
                        {labelEstado(p.estado)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 Stock por producto</span>
            {canAccessInventario(rol) && (
              <Link to="/inventario" className="pill pill-success pulse">
                Gestionar →
              </Link>
            )}
          </div>
          {stockBars.length === 0 ? (
            <p className="empty-state">📊 Sin datos de inventario para tu rol</p>
          ) : (
            stockBars.map((b) => (
              <div key={b.nombre} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                  <span>{b.nombre}</span>
                  <span style={{ color: b.low ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {b.disp} uds / mín: {b.min}
                  </span>
                </div>
                <div className="prog-bar">
                  <div
                    className="prog-fill"
                    style={{
                      width: `${b.pct}%`,
                      background: b.low
                        ? 'linear-gradient(90deg, #ffcdd2, #e57373)'
                        : b.pct < 70
                        ? 'linear-gradient(90deg, #fff9c4, #ffb74d)'
                        : 'linear-gradient(90deg, #c8e6c9, #4caf50)',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title">⚡ Actividad reciente</span>
        </div>
        {activityLog.length === 0 ? (
          <p className="empty-state">Sin eventos aún</p>
        ) : (
          <div className="scrollbox" style={{ maxHeight: 260 }}>
            {activityLog.map((log, i) => (
              <div className="log-entry" key={i}>
                <div className={`log-dot ${log.evento?.includes('error') || log.evento?.includes('Error') ? 'log-dot-err' : 'log-dot-ok'}`}></div>
                <div className="log-time">{new Date(log.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="log-msg">
                  <strong>{log.evento}</strong>
                  <span className="log-meta"> · {JSON.stringify(log.datos).slice(0, 60)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title">🚀 Accesos rápidos</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/productos" className="btn btn-primary pulse">
            🛒 Ver catálogo
          </Link>
          <Link to="/pedidos" className="btn btn-ghost">
            📋 Mis pedidos
          </Link>
          {canAccessInventario(rol) && (
            <Link to="/inventario" className="btn btn-success">
              📦 Ver inventario
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function canAccessInventario(rol) {
  return ['VENDEDOR', 'ADMINISTRADOR'].includes(rol);
}