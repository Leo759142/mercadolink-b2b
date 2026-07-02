import React, { useEffect, useMemo, useState } from 'react';
import { pedidosAPI, productosAPI, puestosAPI } from '../api';

const MIN_UNIDADES = 10;
const MIN_MONTO = 50;

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
  console.log(`[DEBUG] ${evento}`, datos);
}

export default function NuevoPedidoModal({ open, onClose, onCreated, productoPred, productosPre }) {
  const [productos, setProductos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [puestosSeleccionados, setPuestosSeleccionados] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const preSelected = useMemo(() => productosPre || (productoPred ? [productoPred] : []), [productosPre, productoPred]);
  const singleProduct = productoPred && !productosPre;

  useEffect(() => {
    if (!open) return;
    setIdempotencyKey(crypto.randomUUID());
    setError('');
    setObservaciones('');
    setLoading(true);
    logEvento('modal_open', { idempotencyKey: crypto.randomUUID() });
    Promise.all([productosAPI.list(), puestosAPI.list()])
      .then(([prodRes, puestosRes]) => {
        logEvento('catalogo_cargado', { productos: prodRes.data.length, puestos: puestosRes.data.length });
        setProductos(prodRes.data);
        setPuestos(puestosRes.data);
        const stored = localStorage.getItem('puestoId');
        const initialPuestos = {};
        prodRes.data.forEach((p) => {
          if (stored && puestosRes.data.some((pu) => pu.id === stored)) {
            initialPuestos[p.id] = stored;
          } else {
            initialPuestos[p.id] = puestosRes.data[0]?.id || '';
          }
        });
        const initialCantidades = {};
        if (singleProduct && productoPred) {
          initialCantidades[productoPred.id] = 1;
        } else {
          preSelected.forEach((p) => {
            const exists = prodRes.data.some((prod) => prod.id === p.id);
            if (exists) {
              initialCantidades[p.id] = 1;
            }
          });
        }
        setPuestosSeleccionados(initialPuestos);
        setCantidades(initialCantidades);
      })
      .catch((err) => {
        logEvento('catalogo_error', { error: err.message });
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [open, preSelected, singleProduct, productoPred]);

  const productosAMostrar = useMemo(() => {
    if (singleProduct && productoPred) {
      return [productoPred];
    }
    if (productosPre && productosPre.length > 0) {
      return productosPre;
    }
    return productos;
  }, [productos, productoPred, singleProduct, productosPre]);

  const itemsCarrito = useMemo(() => {
    return productosAMostrar
      .filter((p) => (cantidades[p.id] || 0) > 0)
      .map((p) => ({
        productoId: p.id,
        puestoId: puestosSeleccionados[p.id] || '',
        cantidad: Number(cantidades[p.id]),
        producto: p,
      }));
  }, [productosAMostrar, cantidades, puestosSeleccionados]);

  const totalUnidades = itemsCarrito.reduce((s, i) => s + i.cantidad, 0);
  const montoEstimado = itemsCarrito.reduce(
    (s, i) => s + i.cantidad * Number(i.producto.precioReferencia),
    0
  );

  const setCantidad = (productoId, value) => {
    const n = Math.max(0, parseInt(value, 10) || 0);
    setCantidades((prev) => ({ ...prev, [productoId]: n }));
  };

  const setPuestoProducto = (productoId, puestoId) => {
    setPuestosSeleccionados((prev) => ({ ...prev, [productoId]: puestoId }));
  };

  const handleSubmit = async () => {
    logEvento('submit_iniciado', { totalUnidades, montoEstimado, itemsCount: itemsCarrito.length });
    setError('');
    if (itemsCarrito.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }
    const itemsSinPuesto = itemsCarrito.filter((i) => !i.puestoId);
    if (itemsSinPuesto.length > 0) {
      setError('Selecciona un puesto para todos los productos');
      return;
    }
    if (totalUnidades < MIN_UNIDADES || montoEstimado < MIN_MONTO) {
      setError(
        `Mínimo ${MIN_UNIDADES} unidades y S/ ${MIN_MONTO} (actual: ${totalUnidades} u., S/ ${montoEstimado.toFixed(2)})`
      );
      return;
    }

    setSubmitting(true);
    try {
      const items = itemsCarrito.map(({ productoId, puestoId: pid, cantidad }) => ({
        productoId,
        puestoId: pid,
        cantidad,
      }));
      logEvento('llamada_api_pedido', { idempotencyKey, items });
      const { data } = await pedidosAPI.crear(
        items,
        observaciones || undefined,
        idempotencyKey
      );
      logEvento('pedido_creado_exito', { pedidoId: data.id, monto: data.montoTotal });
      onCreated?.(data);
      onClose();
    } catch (err) {
      logEvento('pedido_error', { error: err.message, stack: err.stack });
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>📋 Nuevo pedido B2B</h3>
        <p className="sub">
          Idempotency-Key: <code>{idempotencyKey.slice(0, 8)}…</code>
        </p>
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <p>Cargando catálogo…</p>
        ) : (
          <>
            <div className="scrollbox" style={{ maxHeight: 300, marginBottom: 12 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>S/</th>
                    <th>Puesto</th>
                    <th>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {productosAMostrar.map((p) => (
                    <tr key={p.id}>
                      <td>{p.descripcion}</td>
                      <td>{Number(p.precioReferencia).toFixed(2)}</td>
                      <td>
                        <select
                          value={puestosSeleccionados[p.id] || ''}
                          onChange={(e) => setPuestoProducto(p.id, e.target.value)}
                          style={{ width: 120 }}
                        >
                          <option value="">Seleccionar</option>
                          {puestos.map((pu) => (
                            <option key={pu.id} value={pu.id}>
                              {pu.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          style={{ width: 64 }}
                          value={cantidades[p.id] || ''}
                          placeholder="0"
                          onChange={(e) => setCantidad(p.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-preview">
              Total estimado: <strong>S/ {montoEstimado.toFixed(2)}</strong> ·{' '}
              {totalUnidades} unidades
            </div>

            <div className="form-group">
              <label htmlFor="modal-obs">Observaciones</label>
              <textarea
                id="modal-obs"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || loading}
            onClick={handleSubmit}
          >
            {submitting ? 'Creando…' : `Crear pedido (${totalUnidades}u.)`}
          </button>
        </div>
      </div>
    </div>
  );
}