import React, { useEffect, useState } from 'react';
import { productosAPI } from '../api';
import NuevoPedidoModal from './NuevoPedidoModal';

const PUEDE_CREAR = ['CLIENTE_MAYORISTA', 'VENDEDOR', 'ADMINISTRADOR'];

export default function Productos() {
  const rol = localStorage.getItem('rol');
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    productosAPI
      .list()
      .then((res) => setProductos(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">🛒 Cargando catálogo del mercado...</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">🛒 Catálogo de productos</div>
      <div className="panel-sub">📍 Productos frescos del día · Mínimo 10 unidades / S/ 50 por pedido</div>
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {info && <div className="alert alert-success">✅ {info}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Lista de productos {productos.length > 0 && `(${productos.length})`}</span>
          {PUEDE_CREAR.includes(rol) && (
            <button
              type="button"
              className="btn btn-primary btn-sm pulse"
              onClick={() => setModalOpen(true)}
            >
              🛒 Comprar productos
            </button>
          )}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>🏷️ Código</th>
              <th>📝 Descripción</th>
              <th>📦 Categoría</th>
              <th>💰 Precio (S/)</th>
              {PUEDE_CREAR.includes(rol) && <th>🛒 Acción</th>}
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={PUEDE_CREAR.includes(rol) ? 5 : 4} className="empty-state">
                  📭 El catálogo está vacío — ¡Avisale al administrador!
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} style={{ transition: 'background 0.2s' }}>
                  <td><strong>{p.codigo}</strong></td>
                  <td>{p.descripcion}</td>
                  <td>
                    <span className="pill pill-blue" style={{ textTransform: 'capitalize' }}>
                      {p.categoria || 'General'}
                    </span>
                  </td>
                  <td><strong>S/ {Number(p.precioReferencia).toFixed(2)}</strong></td>
                  {PUEDE_CREAR.includes(rol) && (
                    <td>
                      <button
                        className="btn btn-success btn-sm pulse"
                        onClick={() => {
                          setSeleccionado(p);
                          setModalOpen(true);
                        }}
                        title="Agregar a pedido"
                      >
                        + Agregar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NuevoPedidoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setInfo('¡Pedido creado! Revisa tus pedidos en el menú lateral')}
        productoPred={seleccionado}
      />
    </div>
  );
}