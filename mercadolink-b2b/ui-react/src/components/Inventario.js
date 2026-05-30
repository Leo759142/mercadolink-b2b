import React, { useCallback, useEffect, useState } from 'react';
import { inventarioAPI, puestosAPI } from '../api';
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
      setInfo('Stock actualizado');
      await cargarInventario(puestoId);
    } catch (err) {
      setError(err.message);
    }
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
      <div className="panel-title">Inventario</div>
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

        <table className="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Reservado</th>
              <th>Disponible</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8}>Sin inventario en este puesto</td>
              </tr>
            ) : (
              items.map((inv) => {
                const disp = inv.cantidadActual - (inv.cantidadReservada || 0);
                const bajo = disp < inv.cantidadMinima;
                const editing = editId === inv.id;
                return (
                  <tr key={inv.id}>
                    <td>{inv.producto?.descripcion}</td>
                    <td>{inv.producto?.categoria || '—'}</td>
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
                        inv.cantidadActual
                      )}
                    </td>
                    <td>{inv.cantidadReservada || 0}</td>
                    <td>{disp}</td>
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
                        {bajo ? 'Bajo mínimo' : 'OK'}
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
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="hint" style={{ marginTop: 12 }}>
          Movimientos y solicitudes de reposición llegarán en Fase B (tablas{' '}
          <code>movimientos_inventario</code>, <code>solicitudes_reposicion</code>).
        </p>
      </div>
    </div>
  );
}
