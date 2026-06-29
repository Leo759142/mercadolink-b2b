import React, { useCallback, useEffect, useState } from 'react';
import { inventarioAPI, productosAPI, puestosAPI } from '../api';
import { getSession } from '../utils/auth';

export default function ProveedorInventario() {
  const { puestoId: puestoSesion } = getSession();
  const [puestos, setPuestos] = useState([]);
  const [puestoId, setPuestoId] = useState(puestoSesion || '');
  const [productos, setProductos] = useState([]);
  const [stockInputs, setStockInputs] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cargarInventario = useCallback(async () => {
    if (!puestoId) return;
    setError('');
    try {
      const { data: inv } = await inventarioAPI.porPuesto(puestoId);
      const stockMap = {};
      inv.forEach((i) => {
        stockMap[i.producto.id] = i.cantidadActual || 0;
      });
      setStockInputs((prev) => ({ ...prev, ...stockMap }));
    } catch (err) {
      setError(err.message);
    }
  }, [puestoId]);

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
      })
      .catch((err) => setError(err.message));
  }, [puestoSesion]);

  useEffect(() => {
    productosAPI.misProductos().then((res) => {
      setProductos(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (puestoId) cargarInventario();
  }, [puestoId, cargarInventario]);

  const actualizarStock = async (productoId) => {
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      await inventarioAPI.actualizar(
        productoId,
        puestoId,
        Number(stockInputs[productoId] || 0),
        0
      );
      setInfo('Stock actualizado');
      await cargarInventario();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando inventario de proveedor…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">Inventario de Proveedor</div>
      <div className="panel-sub">
        Gestiona tu stock por producto y puesto
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <div className="form-group" style={{ maxWidth: 320 }}>
          <label htmlFor="prov-puesto">Mi Puesto</label>
          <select
            id="inv-puesto"
            value={puestoId}
            onChange={(e) => setPuestoId(e.target.value)}
          >
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.numero}
              </option>
            ))}
          </select>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Precio Ref.</th>
              <th>Stock Actual</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5}>No tienes productos registrados. Agrega productos primero.</td>
              </tr>
            ) : (
              productos.map((prod) => (
                <tr key={prod.id}>
                  <td>{prod.descripcion}</td>
                  <td>{prod.codigo}</td>
                  <td>S/ {Number(prod.precioReferencia).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      style={{ width: 80 }}
                      value={stockInputs[prod.id] || 0}
                      onChange={(e) =>
                        setStockInputs((prev) => ({
                          ...prev,
                          [prod.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={submitting}
                      onClick={() => actualizarStock(prod.id)}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <p className="hint" style={{ marginTop: 12 }}>
          Como proveedor, puedes actualizar el stock disponible de tus productos.
        </p>
      </div>
    </div>
  );
}