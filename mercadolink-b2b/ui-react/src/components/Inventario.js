import React, { useCallback, useEffect, useState } from 'react';
import { inventarioAPI, puestosAPI, productosAPI } from '../api';
import { getSession } from '../utils/auth';

export default function Inventario() {
  const { puestoId: puestoSesion } = getSession();
  const [puestos, setPuestos] = useState([]);
  const [puestoId, setPuestoId] = useState(puestoSesion || '');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ cantidadActual: 0, cantidadMinima: 0 });
  const [movimientos, setMovimientos] = useState([]);
  const [modalReposicion, setModalReposicion] = useState(false);
  const [repForm, setRepForm] = useState({ productoId: '', cantidad: '', origen: 'almacen', observaciones: '' });
  const [productos, setProductos] = useState([]);

  const cargarInventario = useCallback(async (pid) => {
    if (!pid) return;
    setError('');
    try {
      const { data } = await inventarioAPI.porPuesto(pid);
      setItems(data);
    } catch (err) {
      setError(err.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    puestosAPI
      .list()
      .then((res) => {
        setPuestos(res.data);
        const initial =
          puestoSesion && res.data.some((p) => p.id === puestoSesion)
            ? puestoSesion
            : res.data[0]?.id || '';
        setPuestoId(initial);
        return initial;
      })
      .then((initial) => cargarInventario(initial))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [puestoSesion, cargarInventario]);

  useEffect(() => {
    if (!loading && puestoId) {
      cargarInventario(puestoId);
    }
  }, [puestoId, loading, cargarInventario]);

  useEffect(() => {
    if (modalReposicion) {
      productosAPI.list().then((res) => setProductos(res.data)).catch(() => {});
    }
  }, [modalReposicion]);

  const iniciarEdicion = (inv) => {
    setEditId(inv.id);
    setEditForm({
      cantidadActual: inv.cantidadActual,
      cantidadMinima: inv.cantidadMinima,
    });
  };

  const guardar = async (inv) => {
    setEditId(null);
    setError('');
    setInfo('');
    try {
      await inventarioAPI.actualizar(
        inv.producto.id,
        puestoId,
        Number(editForm.cantidadActual),
        Number(editForm.cantidadMinima)
      );
      const delta = editForm.cantidadActual - inv.cantidadActual;
      setMovimientos((prev) => [
        ...prev,
        {
          tipo: 'AJUSTE',
          producto: inv.producto?.descripcion || '—',
          cantidad: Math.abs(delta),
          referencia: 'MANUAL',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
      ]);
      setInfo('Stock actualizado');
      await cargarInventario(puestoId);
    } catch (err) {
      setError(err.message);
    }
  };

  const solicitarReposicion = async () => {
    if (!repForm.productoId || !repForm.cantidad) {
      setError('Selecciona producto y cantidad');
      return;
    }
    setInfo('Solicitud de reposición enviada');
    setModalReposicion(false);
    setRepForm({ productoId: '', cantidad: '', origen: 'almacen', observaciones: '' });
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando inventario…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📦 Inventario</div>
      <div className="panel-sub">
        Stock por puesto · API <code>GET/PUT /inventario</code>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <div className="form-group" style={{ maxWidth: 320 }}>
          <label htmlFor="inv-puesto">Puesto</label>
          <select
            id="inv-puesto"
            value={puestoId}
            onChange={(e) => setPuestoId(e.target.value)}
            disabled={!!puestoSesion}
          >
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.numero} ({p.seccion})
              </option>
            ))}
          </select>
        </div>

        <div className="card-header">
          <span className="card-title">Stock de tu Puesto</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalReposicion(true)}>
            + Solicitar Reposición
          </button>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mín.</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>Sin inventario en este puesto</td>
              </tr>
            ) : (
              items.map((inv) => {
                const disp = inv.cantidadActual - (inv.cantidadReservada || 0);
                const bajo = disp < inv.cantidadMinima;
                const editing = editId === inv.id;
                return (
                  <tr key={inv.id}>
                    <td>{inv.producto?.descripcion}</td>
                    <td>{(inv.producto?.etiquetas || inv.producto?.descripcion || '—').toString().split(',')[0]}</td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          style={{ width: 72 }}
                          value={editForm.cantidadActual}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              cantidadActual: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span style={{ color: bajo ? 'var(--danger)' : 'inherit', fontWeight: bajo ? 700 : 400 }}>
                          {inv.cantidadActual}
                        </span>
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          type="number"
                          min="0"
                          style={{ width: 72 }}
                          value={editForm.cantidadMinima}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              cantidadMinima: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        inv.cantidadMinima
                      )}
                    </td>
                    <td>
                      <span className={`pill ${bajo ? 'pill-red' : 'pill-ok'}`}>
                        {bajo ? 'BAJO MÍNIMO' : 'OK'}
                      </span>
                    </td>
                    <td>
                      {editing ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={() => guardar(inv)}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setEditId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => iniciarEdicion(inv)}
                        >
                          Ajustar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <span className="card-title">📥 Últimos Movimientos</span>
        </div>
        {movimientos.length === 0 ? (
          <p className="empty-state">Sin movimientos recientes</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Referencia</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.slice().reverse().map((m, i) => (
                <tr key={i}>
                  <td>
                    <span className={`pill ${m.tipo === 'ENTRADA' ? 'pill-ok' : m.tipo === 'SALIDA' ? 'pill-red' : 'pill-blue'}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td>{m.producto}</td>
                  <td>{m.cantidad}</td>
                  <td><code style={{ fontSize: '0.7rem' }}>{m.referencia}</code></td>
                  <td>{m.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalReposicion && (
        <div className="modal-bg open" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>📦 Solicitar Reposición de Stock</h3>
            <p className="sub">Servicio: <code>ActualizarInventario</code> · Estado inicial: PENDIENTE</p>
            <div className="form-group">
              <label>Producto</label>
              <select
                value={repForm.productoId}
                onChange={(e) => setRepForm((f) => ({ ...f, productoId: e.target.value }))}
              >
                <option value="">Seleccionar...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.descripcion}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
              <div className="form-group">
                <label>Cantidad a Reponer</label>
                <input
                  type="number"
                  min="1"
                  value={repForm.cantidad}
                  onChange={(e) => setRepForm((f) => ({ ...f, cantidad: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div className="form-group">
                <label>Atender desde</label>
                <select
                  value={repForm.origen}
                  onChange={(e) => setRepForm((f) => ({ ...f, origen: e.target.value }))}
                >
                  <option value="almacen">Almacén interno</option>
                  <option value="proveedor">Derivar a Proveedor</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones</label>
                <textarea
                  rows={2}
                  value={repForm.observaciones}
                  onChange={(e) => setRepForm((f) => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Urgente para mañana..."
                />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalReposicion(false)}>Cancelar</button>
              <button type="button" className="btn btn-success" onClick={solicitarReposicion}>Enviar Solicitud</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
