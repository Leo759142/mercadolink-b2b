import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { productosAPI, etiquetasAPI } from '../api';
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
  const [tagsSeleccionados, setTagsSeleccionados] = useState([]);
  const [todasEtiquetas, setTodasEtiquetas] = useState([]);
  const [etiquetasPopulares, setEtiquetasPopulares] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [tagInputVisible, setTagInputVisible] = useState({});
  const [tagEditValue, setTagEditValue] = useState({});
  const [tagAutocomplete, setTagAutocomplete] = useState({});
  const [loadingTags, setLoadingTags] = useState(true);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await productosAPI.list();
      setProductos(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEtiquetas = useCallback(async () => {
    try {
      const [allRes, popRes] = await Promise.all([
        etiquetasAPI.list(),
        etiquetasAPI.populares(),
      ]);
      const etiquetas = (allRes.data || []).map(t => ({
        id: t.id,
        nombre: t.nombre,
        slug: t.slug,
        cantidadProductos: t.cantidadProductos || 0,
      }));
      setTodasEtiquetas(etiquetas);
      setEtiquetasPopulares(popRes.data || []);
    } catch {
      /* si falla la API de etiquetas no bloqueamos la carga del catálogo */
      setTodasEtiquetas([]);
      setEtiquetasPopulares([]);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarEtiquetas();
  }, [cargarProductos, cargarEtiquetas]);

  const tagsSeleccionadosNombres = useMemo(() => tagsSeleccionados.map(t => typeof t === 'string' ? t : t.nombre), [tagsSeleccionados]);

  const productosFiltrados = useMemo(() => {
    let resultado = productos;
    if (tagsSeleccionadosNombres.length > 0) {
      resultado = resultado.filter((p) => {
        const ets = getEtiquetas(p);
        return tagsSeleccionadosNombres.every(tagSel => ets.includes(tagSel));
      });
    }
    // Text search
    resultado = resultado.filter((p) => {
      const matchBusqueda = !busqueda ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return matchBusqueda;
    });
    return resultado;
  }, [productos, busqueda, tagsSeleccionadosNombres]);

  const toggleTag = (tag) => {
    setTagsSeleccionados((prev) => {
      const exists = prev.some(t => (typeof t === 'string' ? t : t.nombre) === (typeof tag === 'string' ? tag : tag.nombre));
      if (exists) {
        return prev.filter(t => (typeof t === 'string' ? t : t.nombre) !== (typeof tag === 'string' ? tag : tag.nombre));
      }
      return [...prev, tag];
    });
  };

  const limpiarTags = () => setTagsSeleccionados([]);

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

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const handleAgregarProducto = (p) => {
    setSeleccionado(p);
    setModalOpen(true);
  };

  const handleAgregarSeleccionados = () => {
    setModalPedidoSeleccionados(true);
  };

  const handleAsignarEtiqueta = async () => {
    const tag = tagEditValue._bulk || '';
    if (!tag.trim()) return;
    const nuevasEtiquetas = {};
    seleccionados.forEach((id) => {
      const prod = productos.find((p) => p.id === id);
      if (prod) {
        const existentes = getEtiquetas(prod);
        if (!existentes.includes(tag.trim())) {
          existentes.push(tag.trim());
          nuevasEtiquetas[id] = existentes.join(',');
        }
      }
    });
    setTagEditValue((prev) => ({ ...prev, _bulk: '' }));
    limpiarSeleccion();
    await Promise.all(
      Object.entries(nuevasEtiquetas).map(([id, etiquetas]) =>
        guardarEtiquetas(id, etiquetas)
      )
    );
  };

  const handleProductoGuardado = async () => {
    setInfo('Producto agregado correctamente');
    await cargarProductos();
    await cargarEtiquetas();
  };

  const getEtiquetas = (producto) => {
    if (Array.isArray(producto.etiquetas)) {
      return producto.etiquetas;
    }
    if (producto.etiquetas && typeof producto.etiquetas === 'string') {
      return producto.etiquetas.split(',').map((t) => t.trim()).filter(Boolean);
    }
    return [];
  };

  const guardarEtiquetas = async (productoId, etiquetas) => {
    const productoOriginal = productos.find((p) => p.id === productoId);
    if (!productoOriginal) return;
    const etiquetasArray = typeof etiquetas === 'string' ? etiquetas.split(',').map(t => t.trim()).filter(Boolean) : etiquetas;
    setProductos((prev) => prev.map((p) => p.id === productoId ? { ...p, etiquetas: etiquetasArray } : p));
    try {
      await productosAPI.actualizarEtiquetas(productoId, etiquetasArray.join(','));
    } catch {
      setProductos((prev) => prev.map((p) => p.id === productoId ? { ...p, etiquetas: typeof productoOriginal.etiquetas === 'string' ? productoOriginal.etiquetas : productoOriginal.etiquetas } : p));
      setError('Error al guardar etiquetas');
    }
  };

  const eliminarEtiqueta = async (producto, etiqueta) => {
    const etiquetas = getEtiquetas(producto).filter((t) => t !== etiqueta);
    await guardarEtiquetas(producto.id, etiquetas.join(','));
  };

  const agregarEtiqueta = async (producto, etiqueta) => {
    if (!etiqueta.trim()) return;
    const etiquetas = getEtiquetas(producto);
    if (!etiquetas.includes(etiqueta.trim())) {
      etiquetas.push(etiqueta.trim());
      await guardarEtiquetas(producto.id, etiquetas.join(','));
    }
    setTagInputVisible((prev) => ({ ...prev, [producto.id]: false }));
    setTagEditValue((prev) => ({ ...prev, [producto.id]: '' }));
    setTagAutocomplete((prev) => ({ ...prev, [producto.id]: [] }));
  };

  const handleTagInputChange = async (producto, value) => {
    setTagEditValue((prev) => ({ ...prev, [producto.id]: value }));
    if (value.trim().length > 0) {
      try {
        const res = await etiquetasAPI.buscar(value);
        const sugerencias = (res.data || []).filter(t => !getEtiquetas(producto).includes(t.nombre));
        setTagAutocomplete((prev) => ({ ...prev, [producto.id]: sugerencias }));
      } catch {
        setTagAutocomplete((prev) => ({ ...prev, [producto.id]: [] }));
      }
    } else {
      setTagAutocomplete((prev) => ({ ...prev, [producto.id]: [] }));
    }
  };

  const seleccionarSugerencia = async (producto, tag) => {
    await agregarEtiqueta(producto, tag.nombre);
    setTagAutocomplete((prev) => ({ ...prev, [producto.id]: [] }));
  };

  const crearEtiqueta = async (nombre) => {
    try {
      await etiquetasAPI.crear(nombre);
      await cargarEtiquetas();
      setInfo(`Etiqueta "${nombre}" creada`);
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarEtiquetaGlobal = async (tagId, nombre) => {
    try {
      await etiquetasAPI.eliminar(tagId);
      await cargarEtiquetas();
      setTagsSeleccionados(prev => prev.filter(t => (typeof t === 'string' ? t : t.nombre) !== nombre));
      setInfo(`Etiqueta "${nombre}" eliminada`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragStart = (e, productoId, etiqueta) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ productoId, etiqueta }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
          {/* Active tag filters */}
          {tagsSeleccionadosNombres.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtrado por:</span>
              {tagsSeleccionadosNombres.map((tag) => (
                <span key={tag} className="pill pill-ok" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.9rem', padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={limpiarTags}>
                Borrar filtros
              </button>
            </div>
          )}

          {/* Tabs: Populares / Todas */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 8, paddingBottom: 4 }}>
              Etiquetas:
            </span>
          </div>

          {/* Tag cloud */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {todasEtiquetas.length === 0 && !loadingTags && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Sin etiquetas todavía
              </span>
            )}
            {todasEtiquetas.map((tag) => {
              const nombre = typeof tag === 'string' ? tag : tag.nombre;
              const cantidad = typeof tag === 'object' ? (tag.cantidadProductos || 0) : 0;
              const id = typeof tag === 'object' ? tag.id : null;
              const isActive = tagsSeleccionadosNombres.includes(nombre);
              return (
                <span key={id || nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    className={`pill ${isActive ? 'pill-ok' : 'pill-blue'}`}
                    onClick={() => toggleTag(tag)}
                    style={{ cursor: 'pointer', background: isActive ? 'rgba(76, 175, 80, 0.2)' : '' }}
                    title={`${cantidad} producto${cantidad !== 1 ? 's' : ''}`}
                  >
                    {nombre}
                    <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>{cantidad}</span>
                  </button>
                  {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && id && (
                    <button
                      type="button"
                      onClick={() => eliminarEtiquetaGlobal(id, nombre)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--rojo-terracota)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                        lineHeight: 1,
                        marginLeft: -2,
                      }}
                      title="Eliminar etiqueta"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          {/* Popular tags section */}
          {etiquetasPopulares.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                Más usadas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {etiquetasPopulares.slice(0, 8).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`pill ${tagsSeleccionadosNombres.includes(tag.nombre) ? 'pill-ok' : 'pill-pending'}`}
                    onClick={() => toggleTag(tag)}
                    style={{ cursor: 'pointer', background: tagsSeleccionadosNombres.includes(tag.nombre) ? 'rgba(76, 175, 80, 0.2)' : '' }}
                  >
                    {tag.nombre}
                    <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>{tag.cantidadProductos || 0}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Actions bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">📋 Lista de productos ({productosFiltrados.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {PUEDE_CREAR.includes(rol) && (
                <button type="button" className="btn btn-primary btn-sm pulse" onClick={() => setModalOpen(true)}>
                  🛒 Nuevo pedido
                </button>
              )}
              {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
                <button type="button" className="btn btn-success btn-sm" onClick={() => setModalProductoOpen(true)}>
                  📦 Nuevo producto
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
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
            {PUEDE_GESTIONAR_PRODUCTOS.includes(rol) && (
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="text"
                  placeholder="+ Nueva etiqueta..."
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const val = e.target.value.trim();
                      if (val) {
                        await crearEtiqueta(val);
                        e.target.value = '';
                      }
                    }
                  }}
                  style={{ minWidth: 160 }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Enter para crear etiqueta global
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Selection bar */}
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
              <button type="button" className="btn btn-success btn-sm" onClick={handleAgregarSeleccionados}>
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
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAsignarEtiqueta} style={{ marginLeft: 4 }}>
                  Asignar etiqueta...
                </button>
              </div>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={limpiarSeleccion}>
              Limpiar
            </button>
          </div>
        )}

        {/* Product table */}
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
                <th>🏷️ Etiquetas</th>
                <th>💰 Precio (S/)</th>
                <th>🏷️ Estado</th>
                {PUEDE_CREAR.includes(rol) && <th>🛒 Acción</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={PUEDE_CREAR.includes(rol) ? 7 : 6} className="empty-state">
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
                            <span style={{ position: 'relative' }}>
                              {tagInputVisible[p.id] ? (
                                <>
                                  <input
                                    type="text"
                                    value={tagEditValue[p.id] || ''}
                                    onChange={(e) => handleTagInputChange(p, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        agregarEtiqueta(p, tagEditValue[p.id] || '');
                                      }
                                      if (e.key === 'Escape') {
                                        setTagInputVisible((prev) => ({ ...prev, [p.id]: false }));
                                        setTagAutocomplete((prev) => ({ ...prev, [p.id]: [] }));
                                      }
                                    }}
                                    onBlur={() => {
                                      agregarEtiqueta(p, tagEditValue[p.id] || '');
                                      setTagAutocomplete((prev) => ({ ...prev, [p.id]: [] }));
                                    }}
                                    style={{ width: 100, padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                                    autoFocus
                                  />
                                  {tagAutocomplete[p.id] && tagAutocomplete[p.id].length > 0 && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 4,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 100,
                                        minWidth: 160,
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                      }}
                                    >
                                      {tagAutocomplete[p.id].map((sug) => (
                                        <div
                                          key={sug.id}
                                          onClick={() => seleccionarSugerencia(p, sug)}
                                          onMouseDown={(e) => e.preventDefault()}
                                          style={{
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            borderBottom: '1px solid var(--border)',
                                          }}
                                        >
                                          {sug.nombre}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
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
                            </span>
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
