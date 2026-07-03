import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventarioAPI, pedidosAPI, productosAPI, puestosAPI, proveedoresAPI } from '../api';
import { getSession, rolToKey } from '../utils/auth';
import { labelEstado, pedidoActivo, pillClass } from '../utils/pedidos';

const SUBTITLES = {
  vendedor: '📦 Gestiona tu puesto, inventario y entregas',
  proveedor: '🏭 Administra tu catálogo y órdenes recibidas',
  mayorista: '🛒 Realiza pedidos y revisa disponibilidad',
  admin: '🛡️ Panel de control global de Aspropa',
};

// ✅ Qué stats cards muestra cada rol
const STATS_CONFIG = {
  vendedor: ['pedidosActivos', 'bajoMinimo', 'proveedoresActivos'],
  proveedor: ['pedidosActivos', 'productos', 'proveedoresActivos'],
  mayorista: ['pedidosActivos', 'productos', 'montoPendiente'],
  admin: ['pedidosActivos', 'productos', 'bajoMinimo', 'montoPendiente', 'proveedoresActivos'],
};

// ✅ Labels para cada stat
const STAT_LABELS = {
  pedidosActivos: { label: '📋 Pedidos activos', color: 'var(--info)' },
  productos: { label: '🛒 Productos en venta', color: 'var(--success)' },
  bajoMinimo: { label: '⚠️ Pocos productos', color: 'var(--danger)' },
  montoPendiente: { label: '💰 Total pendiente (S/)', color: 'var(--warning)' },
  proveedoresActivos: { label: '🤝 Proveedores activos', color: 'var(--maderaoscuro)' },
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

  const key = rolToKey(rol);
  const statsToShow = STATS_CONFIG[key] || STATS_CONFIG.mayorista;

  const cargar = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      // ✅ Cargar solo lo necesario según el rol
      const promises = [];

      // Todos los roles ven productos
      promises.push(productosAPI.list());

      // Mayorista y admin ven sus pedidos
      if (['mayorista', 'admin'].includes(key)) {
        promises.push(pedidosAPI.misPedidos());
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Vendedor y admin necesitan puestos
      if (['vendedor', 'admin'].includes(key)) {
        promises.push(puestosAPI.list());
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Proveedor y admin ven proveedores
      if (['proveedor', 'admin'].includes(key)) {
        promises.push(proveedoresAPI.listar());
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [prodRes, pedRes, puestosRes, provRes] = await Promise.all(promises);

      const listaPedidos = pedRes.data || [];
      const activos = listaPedidos.filter(pedidoActivo);
      const montoPendiente = activos.reduce(
        (s, p) => s + Number(p.montoTotal || 0),
        0
      );

      let bajoMinimo = 0;
      let bars = [];

      // ✅ Solo vendedor y admin ven stock de su puesto
      if (['vendedor', 'admin'].includes(key)) {
        const puestoInventario =
          puestoId || (puestosRes.data.length > 0 ? puestosRes.data[0].id : null);

        if (puestoInventario) {
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
            /* inventario no accesible */
          }
        }
      }

      setStats({
        pedidosActivos: activos.length,
        productos: prodRes.data?.length || 0,
        bajoMinimo,
        montoPendiente,
        proveedoresActivos: Array.isArray(provRes.data) ? provRes.data.length : 0,
      });

      // ✅ Mayorista ve sus últimos pedidos
      if (['mayorista', 'admin'].includes(key)) {
        setPedidos(listaPedidos.slice(0, 5));
      }

      // ✅ Vendedor ve pedidos de su puesto (pendientes de entrega)
      if (key === 'vendedor') {
        try {
          const puestoPedidos = await pedidosAPI.miosPorPuesto?.() || { data: [] };
          setPedidos(puestoPedidos.data?.slice(0, 5) || []);
        } catch {
          setPedidos([]);
        }
      }

      // ✅ Proveedor ve pedidos recibidos
      if (key === 'proveedor') {
        try {
          const provPedidos = await pedidosAPI.miosProveedor();
          setPedidos(provPedidos.data?.slice(0, 5) || []);
        } catch {
          setPedidos([]);
        }
      }

      setStockBars(bars);

      const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
      setActivityLog(logs.slice(-8).reverse());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [puestoId, rol, key]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">🔄 Cargando tu panel...</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">🏠 Bienvenido al mercado</div>
      <div className="panel-sub">{SUBTITLES[key] || SUBTITLES.mayorista}</div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ✅ STATS: Solo las que corresponden al rol */}
      <div className="stats-row">
        {statsToShow.map((statKey) => (
          <div className="stat-card pulse" key={statKey}>
            <div className="label">{STAT_LABELS[statKey].label}</div>
            <div
              className="val"
              style={{
                color:
                  statKey === 'bajoMinimo' && stats[statKey] > 0
                    ? 'var(--danger)'
                    : STAT_LABELS[statKey].color,
              }}
            >
              {statKey === 'montoPendiente'
                ? stats[statKey].toFixed(2)
                : stats[statKey]}
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* ✅ ÚLTIMOS PEDIDOS: Solo mayorista, vendedor, proveedor, admin */}
        {['mayorista', 'vendedor', 'proveedor', 'admin'].includes(key) && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                {key === 'vendedor' && '📦 Pedidos de tu puesto'}
                {key === 'proveedor' && '📥 Pedidos recibidos'}
                {key === 'mayorista' && '📋 Últimos pedidos'}
                {key === 'admin' && '📋 Últimos pedidos'}
              </span>
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
                    <td colSpan={4} className="empty-state">
                      {key === 'vendedor' && '📭 No hay pedidos para tu puesto'}
                      {key === 'proveedor' && '📭 No tienes pedidos recibidos'}
                      {key === 'mayorista' && '📭 Aún no tienes pedidos'}
                    </td>
                  </tr>
                ) : (
                  pedidos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: "'Amatic SC', cursive",
                            fontSize: '1.1rem',
                          }}
                        >
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
        )}

        {/* ✅ STOCK: Solo vendedor y admin */}
        {['vendedor', 'admin'].includes(key) && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">📦 Stock por producto</span>
              <Link to="/inventario" className="pill pill-success pulse">
                Gestionar →
              </Link>
            </div>
            {stockBars.length === 0 ? (
              <p className="empty-state">📊 Sin datos de inventario</p>
            ) : (
              stockBars.map((b) => (
                <div key={b.nombre} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      marginBottom: 4,
                    }}
                  >
                    <span>{b.nombre}</span>
                    <span
                      style={{
                        color: b.low ? 'var(--danger)' : 'var(--text-muted)',
                      }}
                    >
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
        )}

        {/* ✅ Para proveedor y mayorista, mostrar algo útil en la segunda columna */}
        {key === 'proveedor' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏭 Tu catálogo</span>
              <Link to="/productos" className="pill pill-success pulse">
                Ver catálogo →
              </Link>
            </div>
            <p className="empty-state">
              🛒 Tienes {stats.productos} productos publicados
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 1rem 1rem' }}>
              <Link to="/productos" className="btn btn-primary pulse">
                📦 Gestionar productos
              </Link>
              <Link to="/proveedor-pedidos" className="btn btn-ghost">
                📥 Ver pedidos recibidos
              </Link>
            </div>
          </div>
        )}

        {key === 'mayorista' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">🛒 Acciones rápidas</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 1rem 1rem' }}>
              <Link to="/productos" className="btn btn-primary pulse">
                🛒 Ver catálogo
              </Link>
              <Link to="/pedidos" className="btn btn-ghost">
                📋 Mis pedidos
              </Link>
            </div>
            <p className="hint" style={{ padding: '0 1rem 1rem' }}>
              💡 Recuerda: mínimo 10 unidades y S/ 50 por pedido
            </p>
          </div>
        )}
      </div>

      {/* ✅ ACTIVIDAD RECIENTE: Todos los roles */}
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
                <div
                  className={`log-dot ${
                    log.evento?.includes('error') || log.evento?.includes('Error')
                      ? 'log-dot-err'
                      : 'log-dot-ok'
                  }`}
                ></div>
                <div className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="log-msg">
                  <strong>{log.evento}</strong>
                  <span className="log-meta">
                    {' '}
                    · {JSON.stringify(log.datos).slice(0, 60)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ ACCESOS RÁPIDOS: Personalizados por rol */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title">🚀 Accesos rápidos</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/productos" className="btn btn-primary pulse">
            🛒 Ver catálogo
          </Link>

          {key === 'mayorista' && (
            <Link to="/pedidos" className="btn btn-ghost">
              📋 Mis pedidos
            </Link>
          )}

          {['vendedor', 'admin'].includes(key) && (
            <Link to="/inventario" className="btn btn-success">
              📦 Ver inventario
            </Link>
          )}

          {key === 'vendedor' && (
            <Link to="/pedidos-vendedor" className="btn btn-warning">
              📦 Entregas pendientes
            </Link>
          )}

          {key === 'proveedor' && (
            <>
              <Link to="/proveedor-pedidos" className="btn btn-ghost">
                📥 Pedidos recibidos
              </Link>
              <Link to="/proveedor-inventario" className="btn btn-success">
                📋 Mi inventario
              </Link>
            </>
          )}

          {key === 'admin' && (
            <>
              <Link to="/proveedores" className="btn btn-ghost">
                🤝 Proveedores
              </Link>
              <Link to="/auditoria" className="btn btn-warning">
                🔎 Auditoría
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}