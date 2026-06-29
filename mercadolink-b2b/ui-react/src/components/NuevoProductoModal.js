import React, { useState } from 'react';
import { productosAPI } from '../api';

export default function NuevoProductoModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    codigo: '',
    descripcion: '',
    categoria: '',
    precioReferencia: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setForm({ codigo: '', descripcion: '', categoria: '', precioReferencia: '' });
    setError('');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await productosAPI.crear({
        codigo: form.codigo,
        descripcion: form.descripcion,
        categoria: form.categoria || undefined,
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
            <label htmlFor="prod-categoria">Categoría</label>
            <input
              id="prod-categoria"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              placeholder="Ej: Frutas, Verduras"
            />
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