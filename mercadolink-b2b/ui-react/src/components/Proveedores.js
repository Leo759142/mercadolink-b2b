import React, { useEffect, useState } from 'react';
import { proveedoresAPI } from '../api';

const ESTADOS = ['EN_EVALUACION', 'APROBADO', 'ACTIVO', 'SUSPENDIDO', 'DESCARTADO'];
const ESTADO_CLS = {
  EN_EVALUACION: 'pill-pending',
  APROBADO: 'pill-ok',
  ACTIVO: 'pill-ok',
  SUSPENDIDO: 'pill-red',
  DESCARTADO: 'pill-red',
};

export default function Proveedores() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    razonSocial: '', ruc: '', estado: 'EN_EVALUACION',
    nombreContacto: '', telefono: '', email: '', direccion: '', distrito: '',
  });
  const [cotForm, setCotForm] = useState({ proveedorId: '', productoId: '', cantidad: '', dias: '' });
  const [evalForm, setEvalForm] = useState({ proveedorId: '', precio: 7, calidad: 8, puntual: 6 });

  const cargar = async () => {
    setError('');
    try {
      const { data } = await proveedoresAPI.listar();
      setLista(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ razonSocial: '', ruc: '', estado: 'EN_EVALUACION', nombreContacto: '', telefono: '', email: '', direccion: '', distrito: '' });
    setModal(true);
  };

  const abrirEditar = (p) => {
    setEditId(p.id);
    setForm({ razonSocial: p.razonSocial, ruc: p.ruc, estado: p.estado, nombreContacto: p.nombreContacto || '', telefono: p.telefono || '', email: p.email || '', direccion: p.direccion || '', distrito: p.distrito || '' });
    setModal(true);
  };

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await proveedoresAPI.actualizar(editId, form);
        setInfo('Proveedor actualizado');
      } else {
        await proveedoresAPI.crear(form);
        setInfo('Proveedor creado');
      }
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const cambiarEstado = async (id, estado) => {
    setError('');
    try {
      await proveedoresAPI.cambiarEstado(id, { estado });
      setInfo('Estado actualizado');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const enviarCotizacion = async () => {
    if (!cotForm.proveedorId || !cotForm.productoId || !cotForm.cantidad) {
      setError('Completa los campos de cotización');
      return;
    }
    setInfo('Cotización enviada');
    setCotForm({ proveedorId: '', productoId: '', cantidad: '', dias: '' });
  };

  const evaluarProveedor = async () => {
    if (!evalForm.proveedorId) {
      setError('Selecciona un proveedor');
      return;
    }
    const avg = ((Number(evalForm.precio) + Number(evalForm.calidad) + Number(evalForm.puntual)) / 3).toFixed(1);
    const prov = lista.find((v) => v.id === evalForm.proveedorId);
    if (prov) {
      prov.puntaje = Number(avg);
    }
    setInfo(`Evaluación registrada: ${avg}/10`);
    setEvalForm({ ...evalForm, proveedorId: '' });
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">🤝 Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">🤝 Gestión de proveedores</div>
      <div className="panel-sub">
        Registro, evaluación y estado de proveedores mayoristas
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {info && <div className="alert alert-success">✅ {info}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Proveedores registrados ({lista.length})</span>
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>Actualizar</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={abrirNuevo}>
              + Nuevo proveedor
            </button>
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Razón social</th>
              <th>RUC</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Distrito</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan={7}>No hay proveedores registrados</td>
              </tr>
            ) : (
              lista.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.razonSocial}</strong></td>
                  <td><code>{p.ruc}</code></td>
                  <td>{p.nombreContacto || '—'}</td>
                  <td>{p.telefono || '—'}</td>
                  <td>{p.distrito || '—'}</td>
                  <td>
                    <span className={`pill ${ESTADO_CLS[p.estado] || 'pill-pending'}`}>
                      {p.estado.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => abrirEditar(p)}>
                      Editar
                    </button>
                    <select
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '0.2rem' }}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="two-col" style={{ marginTop: '1rem' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📝 Solicitar Cotización</span>
          </div>
          <div className="form-group">
            <label>Proveedor</label>
            <select
              value={cotForm.proveedorId}
              onChange={(e) => setCotForm((f) => ({ ...f, proveedorId: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {lista.map((v) => (
                <option key={v.id} value={v.id}>{v.razonSocial}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Producto</label>
            <select
              value={cotForm.productoId}
              onChange={(e) => setCotForm((f) => ({ ...f, productoId: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '0.7rem' }}>
            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={cotForm.cantidad}
                onChange={(e) => setCotForm((f) => ({ ...f, cantidad: e.target.value }))}
                placeholder="50"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Plazo (días)</label>
              <input
                type="number"
                value={cotForm.dias}
                onChange={(e) => setCotForm((f) => ({ ...f, dias: e.target.value }))}
                placeholder="3"
                min="1"
              />
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={enviarCotizacion} style={{ width: '100%' }}>
            Enviar Cotización
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">⭐ Evaluar Proveedor</span>
          </div>
          <div className="form-group">
            <label>Proveedor</label>
            <select
              value={evalForm.proveedorId}
              onChange={(e) => setEvalForm((f) => ({ ...f, proveedorId: e.target.value }))}
            >
              <option value="">Seleccionar...</option>
              {lista.map((v) => (
                <option key={v.id} value={v.id}>{v.razonSocial}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.7rem' }}>
            <div className="form-group">
              <label>Precio (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={evalForm.precio}
                onChange={(e) => setEvalForm((f) => ({ ...f, precio: e.target.value }))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evalForm.precio}</span>
            </div>
            <div className="form-group">
              <label>Calidad (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={evalForm.calidad}
                onChange={(e) => setEvalForm((f) => ({ ...f, calidad: e.target.value }))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evalForm.calidad}</span>
            </div>
            <div className="form-group">
              <label>Puntualidad (0-10)</label>
              <input
                type="range"
                min="0"
                max="10"
                value={evalForm.puntual}
                onChange={(e) => setEvalForm((f) => ({ ...f, puntual: e.target.value }))}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evalForm.puntual}</span>
            </div>
            <div className="form-group">
              <label>Promedio</label>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                {((Number(evalForm.precio) + Number(evalForm.calidad) + Number(evalForm.puntual)) / 3).toFixed(1)}
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-success" onClick={evaluarProveedor} style={{ width: '100%' }}>
            Registrar Evaluación
          </button>
        </div>
      </div>

      {modal && (
        <div className="modal-bg open" role="dialog" aria-modal="true">
          <div className="modal">
            <h3>{editId ? '✏️ Editar proveedor' : '📦 Nuevo proveedor'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Razón social *</label>
                <input value={form.razonSocial} onChange={(e) => handleChange('razonSocial', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>RUC *</label>
                <input value={form.ruc} onChange={(e) => handleChange('ruc', e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nombre contacto</label>
                  <input value={form.nombreContacto} onChange={(e) => handleChange('nombreContacto', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Teléfono</label>
                  <input value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Distrito</label>
                  <input value={form.distrito} onChange={(e) => handleChange('distrito', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <textarea value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} rows={2} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={(e) => handleChange('estado', e.target.value)}>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
