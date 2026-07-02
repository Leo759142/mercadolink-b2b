import React, { useEffect, useState } from 'react';
import { productosAPI, etiquetasAPI } from '../api';

export default function NuevoProductoModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    etiquetas: '',
    precioReferencia: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const reset = () => {
    setForm({ codigo: '', descripcion: '', etiquetas: '', precioReferencia: '' });
    setError('');
    setTagSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (open) {
      etiquetasAPI.list().then((res) => {
        setTagSuggestions(res.data || []);
      }).catch(() => {
        setTagSuggestions([]);
      });
    }
  }, [open]);

  const handleEtiquetasChange = async (e) => {
    const value = e.target.value;
    setForm({ ...form, etiquetas: value });
    if (value.trim().length > 0) {
      try {
        const res = await etiquetasAPI.buscar(value);
        setTagSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const seleccionarTag = (nombre) => {
    const current = form.etiquetas;
    const etiquetas = current ? current.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!etiquetas.includes(nombre)) {
      etiquetas.push(nombre);
      setForm({ ...form, etiquetas: etiquetas.join(', ') });
    }
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await productosAPI.crear({
        codigo: form.codigo,
        descripcion: form.descripcion,
        etiquetas: form.etiquetas || undefined,
        precioReferencia: Number(form.precioReferencia),
      });
      onCreated?.();
      onClose();
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>📦 Nuevo producto</h3>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prod-codigo">Código *</label>
            <input
              id="prod-codigo"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              required
              placeholder="Ej: PROD-001"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-descripcion">Descripción *</label>
            <textarea
              id="prod-descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Descripción del producto"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-etiquetas">Etiquetas (categoría)</label>
            <input
              id="prod-etiquetas"
              name="etiquetas"
              value={form.etiquetas}
              onChange={handleEtiquetasChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ej: Frutas, Verduras (separar con coma)"
              autoComplete="off"
            />
            {showSuggestions && tagSuggestions.length > 0 && (
              <div style={{
                position: 'relative',
                marginTop: 4,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxHeight: 180,
                overflowY: 'auto',
                zIndex: 200,
              }}>
                {tagSuggestions.map((tag) => (
                  <div
                    key={tag.id || tag.nombre}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => seleccionarTag(tag.nombre)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{tag.nombre}</span>
                    {tag.cantidadProductos > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tag.cantidadProductos} prod.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Las etiquetas funcionan como categoría. Separa múltiples con coma o selecciona de la lista.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="prod-precio">Precio referencia (S/) *</label>
            <input
              id="prod-precio"
              name="precioReferencia"
              type="number"
              min="0"
              step="0.01"
              value={form.precioReferencia}
              onChange={handleChange}
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                onClose();
                reset();
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
