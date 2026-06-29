import React, { useEffect, useMemo, useState } from 'react';
import { productosAPI } from '../api';
import NuevoPedidoModal from './NuevoPedidoModal';
import NuevoProductoModal from './NuevoProductoModal';

const PUEDE_CREAR = ['CLIENTE_MAYORISTA', 'VENDEDOR', 'ADMINISTRADOR'];
const PUEDE_GESTIONAR_PRODUCTOS = ['PROVEEDOR', 'ADMINISTRADOR'];

export default function Productos() {
  const rol = localStorage.getItem('rol');
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalPedidoSeleccionados, setModalPedidoSeleccionados] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [tagFiltro, setTagFiltro] = useState('');
  const [tagInputVisible, setTagInputVisible] = useState({});
  const [tagEditValue, setTagEditValue] = useState({});

  useEffect(() => {
    productosAPI
      .list()
      .then((res) => setProductos(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [productos]);

  const todasEtiquetas = useMemo(() => {
    const tags = new Set();
    productos.forEach((p) => {
      if (p.etiquetas) {
        p.etiquetas.split(',').forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags).sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchBusqueda = !busqueda ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
      const matchTag = !tagFiltro || (p.etiquetas && p.etiquetas.includes(tagFiltro));
      return matchBusqueda && matchCategoria && matchTag;
    });
  }, [productos, busqueda, categoriaFiltro, tagFiltro]);

  const toggleSeleccion = (productoId) => {
    const nuevaSeleccion = new Set(seleccionados);
    if (nuevaSeleccion.has(productoId)) {
      nuevaSeleccion.delete(productoId);
    } else {
      nuevaSeleccion.add(productoId);
    }
    setSeleccionados(nuevaSeleccion);
  };

  const toggleSeleccionTodos = () => {
    if (seleccionados.size === productosFiltrados.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(productosFiltrados.map((p) => p.id)));
    }
  };

  const limpiarSeleccion = () => {
    setSeleccionados(new Set());
  };

  const handleAgregarProducto = (p) => {
    setSeleccionado(p);
    setModalOpen(true);
  };

  const handleAgregarSeleccionados = () => {
    setModalPedidoSeleccionados(true);
  };

  const handleAsignarEtiqueta = () => {
    const tag = tagEditValue._bulk || '';
    if (!tag.trim()) return;
    const nuevasEtiquetas = {};
    seleccionados.forEach((id) => {
      const prod = productos.find((p) => p.id === id);
      if (prod) {
        const existentes = prod.etiquetas ? prod.etiquetas.split(',').map((t) => t.trim()).filter(Boolean) : [];
        if (!existentes.includes(tag.trim())) {
          existentes.push(tag.trim());
          nuevasEtiquetas[id] = existentes.join(',');
        }
      }
    });
    setTagEditValue((prev) => ({ ...prev, _bulk: '' }));
    limpiarSeleccion();
    Object.entries(nuevasEtiquetas).forEach(([id, etiquetas]) => {
      guardarEtiquetas(Number(id), etiquetas);
    });
  };

  const handleProductoGuardado = () => {
    setInfo('Producto agregado correctamente');
    productosAPI.list().then((res) => setProductos(res.data));
  };

  const getEtiquetas = (producto) => {
    return producto.etiquetas ? producto.etiquetas.split(',').map((t) => t.trim()).filter(Boolean) : [];
  };

  const guardarEtiquetas = (productoId, etiquetas) => {
    const productoOriginal = productos.find((p) => p.id === productoId);
    if (!productoOriginal) return;
    setProductos((prev) => prev.map((p) => p.id === productoId ? { ...p, etiquetas } : p));
    productosAPI.actualizarEtiquetas(productoId, etiquetas).catch(() => {
      setProductos((prev) => prev.map((p) => p.id === productoId ? { ...p, etiquetas: productoOriginal.etiquetas } : p));
      setError('Error al guardar etiquetas');
    });
  };

  const eliminarEtiqueta = (producto, etiqueta) => {
    const etiquetas = getEtiquetas(producto).filter((t) => t !== etiqueta);
    guardarEtiquetas(producto.id, etiquetas.join(','));
  };

  const agregarEtiqueta = (producto, etiqueta) => {
    if (!etiqueta.trim()) return;
    const etiquetas = getEtiquetas(producto);
    if (!etiquetas.includes(etiqueta.trim())) {
      etiquetas.push(etiqueta.trim());
      guardarEtiquetas(producto.id, etiquetas.join(','));
    }
    setTagInputVisible((prev) => ({ ...prev, [producto.id]: false }));
    setTagEditValue((prev) => ({ ...prev, [producto.id]: '' }));
  };

  const handleDragStart = (e, productoId, etiqueta) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ productoId, etiqueta }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, producto, etiquetaDestino) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!data) return;
    const { productoId, etiqueta: etiquetaOrigen } = data;
    if (productoId !== producto.id) return;
    const etiquetas = getEtiquetas(producto);
    const indiceOrigen = etiquetas.indexOf(etiquetaOrigen);
    const indiceDestino = etiquetas.indexOf(etiquetaDestino);
    if (indiceOrigen !== -1 && indiceDestino !== -1 && indiceOrigen !== indiceDestino) {
      etiquetas.splice(indiceOrigen, 1);
      etiquetas.splice(indiceDestino, 0, etiquetaOrigen);
      guardarEtiquetas(producto.id, etiquetas.join(','));
    }
  };

  const productosSeleccionados = useMemo(() => {
    return productos.filter((p) => seleccionados.has(p.id));
  }, [productos, seleccionados]);

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
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          {tagFiltro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="pill pill-blue">Filtrado por: {tagFiltro}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTagFiltro('')}>
                Borrar filtro
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {todasEtiquetas.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`pill ${tagFiltro === tag ? 'pill-ok' : 'pill-blue'}`}
                onClick={() => setTagFiltro(tagFiltro === tag ? '' : tag)}
                style={{ cursor: 'pointer', background: tagFiltro === tag ? 'rgba(76, 175, 80, 0.2)' : '' }}
              >
                {tag}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">📋 Lista de productos ({productosFiltrados.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {PUEDE_CREAR.includes(rol) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm pulse"
                  onClick={() => setModalOpen(true)}
                >
                  🛒 Nuevo pedido
                </button>
              )}
              {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={() => setModalProductoOpen(true)}
                >
                  📦 Nuevo producto
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
              <input
                type="text"
                placeholder="🔍 Buscar por código o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {seleccionados.size > 0 && (
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--surface)',
            padding: '0.8rem',
            borderBottom: '2px solid var(--tierra)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            zIndex: 10
          }}>
            <span className="pill pill-pending">{seleccionados.size} seleccionado{seleccionados.size > 1 ? 's' : ''}</span>
            {PUEDE_CREAR.includes(rol) && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={handleAgregarSeleccionados}
              >
                Agregar seleccionados al pedido
              </button>
            )}
            {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                  type="text"
                  placeholder="Escribe etiqueta..."
                  value={tagEditValue._bulk || ''}
                  onChange={(e) => setTagEditValue((prev) => ({ ...prev, _bulk: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsignarEtiqueta()}
                  style={{ width: 150, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAsignarEtiqueta}
                  style={{ marginLeft: 4 }}
                >
                  Asignar etiqueta...
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={limpiarSeleccion}
            >
              Limpiar
            </button>
          </div>
        )}

        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={seleccionados.size === productosFiltrados.length && productosFiltrados.length > 0}
                    onChange={toggleSeleccionTodos}
                  />
                </th>
                <th>🏷️ Código</th>
                <th>📝 Descripción</th>
                <th>📦 Categoría</th>
                <th>🏷️ Etiquetas</th>
                <th>💰 Precio (S/)</th>
                <th>🏷️ Estado</th>
                {PUEDE_CREAR.includes(rol) && <th>🛒 Acción</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={PUEDE_CREAR.includes(rol) ? 8 : 7} className="empty-state">
                    📭 No se encontraron productos
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => {
                  const etiquetas = getEtiquetas(p);
                  return (
                    <tr key={p.id} style={{ transition: 'background 0.2s' }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(p.id)}
                          onChange={() => toggleSeleccion(p.id)}
                        />
                      </td>
                      <td><strong>{p.codigo}</strong></td>
                      <td>{p.descripcion}</td>
                      <td>
                        <span className="pill pill-blue" style={{ textTransform: 'capitalize' }}>
                          {p.categoria || 'General'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                          {etiquetas.map((tag) => (
                            <span
                              key={tag}
                              className="pill pill-pending"
                              draggable
                              onDragStart={(e) => handleDragStart(e, p.id, tag)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, p, tag)}
                              style={{ cursor: 'grab', userSelect: 'none' }}
                            >
                              {tag}
                              {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
                                <button
                                  type="button"
                                  onClick={() => eliminarEtiqueta(p, tag)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--rojo-terracota)',
                                    cursor: 'pointer',
                                    marginLeft: 4,
                                    fontSize: '0.9rem',
                                    padding: 0,
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
                            <>
                              {tagInputVisible[p.id] ? (
                                <input
                                  type="text"
                                  value={tagEditValue[p.id] || ''}
                                  onChange={(e) => setTagEditValue((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      agregarEtiqueta(p, tagEditValue[p.id] || '');
                                    }
                                    if (e.key === 'Escape') {
                                      setTagInputVisible((prev) => ({ ...prev, [p.id]: false }));
                                    }
                                  }}
                                  onBlur={() => agregarEtiqueta(p, tagEditValue[p.id] || '')}
                                  style={{ width: 100, padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                                  autoFocus
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="pill pill-blue"
                                  onClick={() => setTagInputVisible((prev) => ({ ...prev, [p.id]: true }))}
                                  style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem 0.5rem', opacity: 0.5 }}
                                >
                                  +
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td><strong>S/ {Number(p.precioReferencia).toFixed(2)}</strong></td>
                      <td>
                        <span className={`pill ${p.activo ? 'pill-ok' : 'pill-red'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {PUEDE_CREAR.includes(rol) && (
                        <td>
                          <button
                            className="btn btn-success btn-sm pulse"
                            onClick={() => handleAgregarProducto(p)}
                            title="Agregar a pedido"
                            disabled={!p.activo}
                          >
                            + Agregar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevoPedidoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSeleccionado(null);
        }}
        onCreated={() => setInfo('¡Pedido creado! Revisa tus pedidos en el menú lateral')}
        productoPred={seleccionado}
      />

      <NuevoPedidoModal
        open={modalPedidoSeleccionados}
        onClose={() => setModalPedidoSeleccionados(false)}
        onCreated={() => {
          setInfo('¡Pedido creado! Revisa tus pedidos en el menú lateral');
          limpiarSeleccion();
        }}
        productosPre={productosSeleccionados}
      />

      <NuevoProductoModal
        open={modalProductoOpen}
        onClose={() => setModalProductoOpen(false)}
        onCreated={handleProductoGuardado}
      />
    </div>
  );
}