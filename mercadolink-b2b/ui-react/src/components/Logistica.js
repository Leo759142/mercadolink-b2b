import React, { useEffect, useState } from 'react';
import { logisticaAPI } from '../api';

const PUEDE_CREAR_ENVIO = ['PROVEEDOR', 'ADMINISTRADOR'];
const PUEDE_CREAR_RECEPCION = ['VENDEDOR', 'ADMINISTRADOR'];
const PUEDE_CREAR_NC = ['VENDEDOR', 'ADMINISTRADOR'];
const PUEDE_RESOLVER_NC = ['VENDEDOR', 'ADMINISTRADOR'];
const PUEDE_AVANZAR_ETAPA = ['VENDEDOR', 'ADMINISTRADOR'];

const ETAPAS_ENVIO = [
  { key: 'PENDIENTE_RECOLECCION', label: 'Pendiente recolección', emoji: '📦' },
  { key: 'EN_PREPARACION', label: 'En preparación', emoji: '🏭' },
  { key: 'DESPACHADO', label: 'Despachado', emoji: '🚚' },
  { key: 'EN_TRANSITO', label: 'En tránsito', emoji: '🛤️' },
  { key: 'EN_PUBLICA_RECEPCION', label: 'En punto de recepción', emoji: '🏬' },
  { key: 'RECIBIDO_CONFORME', label: 'Recibido conforme', emoji: '✅' },
];

function PillEstadoRecepcion({ estado }) {
  let cls = 'pill ';
  switch (estado) {
    case 'CONFORME':
      cls += 'pill-ok';
      break;
    case 'CON_FALTANTE':
      cls += 'pill-warning';
      break;
    case 'CON_DANIO':
      cls += 'pill-red';
      break;
    case 'CON_DIFERENCIA_DE_PRECIO':
      cls += 'pill-blue';
      break;
    case 'DEVUELTO':
      cls += 'pill-red';
      break;
    default:
      cls += 'pill-pending';
  }
  return <span className={cls}>{estado || '—'}</span>;
}

function PillResuelta({ resuelta }) {
  return (
    <span className={resuelta ? 'pill pill-ok' : 'pill pill-pending'}>
      {resuelta ? 'Sí' : 'No'}
    </span>
  );
}

function PillEtapa({ etapa }) {
  const isCompleted = etapa === 'RECIBIDO_CONFORME';
  let cls = 'pill ';
  if (isCompleted) {
    cls += 'pill-ok';
  } else if (etapa) {
    cls += 'pill-info';
  } else {
    cls += 'pill-pending';
  }
  return <span className={cls}>{etapa || 'Pendiente recolección'}</span>;
}

function ModalEnvio({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    pedido_id: '',
    proveedor_id: '',
    transportista: '',
    numero_guia: '',
    fecha_despacho: '',
    fecha_estimada_entrega: '',
    observaciones: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        pedido_id: '',
        proveedor_id: '',
        transportista: '',
        numero_guia: '',
        fecha_despacho: '',
        fecha_estimada_entrega: '',
        observaciones: '',
      });
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.pedido_id || !form.proveedor_id || !form.transportista || !form.numero_guia) {
      setError('Los campos pedido_id, proveedor_id, transportista y numero_guia son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        fecha_despacho: form.fecha_despacho || null,
        fecha_estimada_entrega: form.fecha_estimada_entrega || null,
      };
      const { data } = await logisticaAPI.envios.crear(payload);
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>🚚 Nuevo envío</h3>
        <p className="sub">Registra un envío de mercadería</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="env-pedido">Pedido ID *</label>
          <input id="env-pedido" value={form.pedido_id} onChange={(e) => handleChange('pedido_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-proveedor">Proveedor ID *</label>
          <input id="env-proveedor" value={form.proveedor_id} onChange={(e) => handleChange('proveedor_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-transportista">Transportista *</label>
          <input id="env-transportista" value={form.transportista} onChange={(e) => handleChange('transportista', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-guia">Número de guía *</label>
          <input id="env-guia" value={form.numero_guia} onChange={(e) => handleChange('numero_guia', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-despacho">Fecha de despacho</label>
          <input type="datetime-local" id="env-despacho" value={form.fecha_despacho} onChange={(e) => handleChange('fecha_despacho', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-entrega">Fecha estimada de entrega</label>
          <input type="date" id="env-entrega" value={form.fecha_estimada_entrega} onChange={(e) => handleChange('fecha_estimada_entrega', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="env-obs">Observaciones</label>
          <textarea id="env-obs" rows={3} value={form.observaciones} onChange={(e) => handleChange('observaciones', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalRecepcion({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    pedido_id: '',
    envio_id: '',
    encargado_id: '',
    estado_recepcion: 'CONFORME',
    observaciones: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        pedido_id: '',
        envio_id: '',
        encargado_id: '',
        estado_recepcion: 'CONFORME',
        observaciones: '',
      });
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.pedido_id || !form.envio_id || !form.encargado_id) {
      setError('Los campos pedido_id, envio_id y encargado_id son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await logisticaAPI.recepciones.crear(form);
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>📦 Nueva recepción</h3>
        <p className="sub">Registra la recepción de un envío</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="rec-pedido">Pedido ID *</label>
          <input id="rec-pedido" value={form.pedido_id} onChange={(e) => handleChange('pedido_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="rec-envio">Envío ID *</label>
          <input id="rec-envio" value={form.envio_id} onChange={(e) => handleChange('envio_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="rec-encargado">Encargado ID *</label>
          <input id="rec-encargado" value={form.encargado_id} onChange={(e) => handleChange('encargado_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="rec-estado">Estado recepción</label>
          <select id="rec-estado" value={form.estado_recepcion} onChange={(e) => handleChange('estado_recepcion', e.target.value)}>
            <option value="CONFORME">CONFORME</option>
            <option value="CON_FALTANTE">CON_FALTANTE</option>
            <option value="CON_DANIO">CON_DANIO</option>
            <option value="CON_DIFERENCIA_DE_PRECIO">CON_DIFERENCIA_DE_PRECIO</option>
            <option value="DEVUELTO">DEVUELTO</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="rec-obs">Observaciones</label>
          <textarea id="rec-obs" rows={3} value={form.observaciones} onChange={(e) => handleChange('observaciones', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalNoConformidad({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    recepcion_id: '',
    tipo: 'FALTANTE',
    descripcion: '',
    accion_requerida: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        recepcion_id: '',
        tipo: 'FALTANTE',
        descripcion: '',
        accion_requerida: '',
      });
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.recepcion_id || !form.descripcion) {
      setError('Los campos recepcion_id y descripcion son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await logisticaAPI.noConformidades.crear(form);
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>⚠️ Nueva no conformidad</h3>
        <p className="sub">Registra un incidente de recepción</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="nc-recepcion">Recepción ID *</label>
          <input id="nc-recepcion" value={form.recepcion_id} onChange={(e) => handleChange('recepcion_id', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="nc-tipo">Tipo</label>
          <select id="nc-tipo" value={form.tipo} onChange={(e) => handleChange('tipo', e.target.value)}>
            <option value="FALTANTE">FALTANTE</option>
            <option value="DANIO">DANIO</option>
            <option value="DIFERENCIA_PRECIO">DIFERENCIA_PRECIO</option>
            <option value="PRODUCTO_INCORRECTO">PRODUCTO_INCORRECTO</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="nc-desc">Descripción *</label>
          <textarea id="nc-desc" rows={4} value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="nc-accion">Acción requerida</label>
          <input id="nc-accion" value={form.accion_requerida} onChange={(e) => handleChange('accion_requerida', e.target.value)} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Logistica() {
  const rol = localStorage.getItem('rol');
  const [tab, setTab] = useState('seguimiento');
  const [envios, setEnvios] = useState([]);
  const [recepciones, setRecepciones] = useState([]);
  const [noConfs, setNoConfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [seguimientoEnvioId, setSeguimientoEnvioId] = useState('');

  const [modalEnvio, setModalEnvio] = useState(false);
  const [modalRecepcion, setModalRecepcion] = useState(false);
  const [modalNC, setModalNC] = useState(false);

  const cargarEnvios = async () => {
    setError('');
    try {
      const { data } = await logisticaAPI.envios.listar();
      setEnvios(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarRecepciones = async () => {
    setError('');
    try {
      const { data } = await logisticaAPI.recepciones.listar();
      setRecepciones(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarNoConfs = async () => {
    setError('');
    try {
      const { data } = await logisticaAPI.noConformidades.listar();
      setNoConfs(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const cargarTodo = async () => {
    setLoading(true);
    setError('');
    try {
      await cargarEnvios();
      await cargarRecepciones();
      await cargarNoConfs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTab = (t) => {
    setTab(t);
  };

  const resolverNC = async (id) => {
    setError('');
    setInfo('');
    try {
      await logisticaAPI.noConformidades.resolver(id);
      setInfo('No conformidad marcada como resuelta');
      cargarNoConfs();
    } catch (err) {
      setError(err.message);
    }
  };

  const obtenerEtapaEnvio = (envio) => {
    const etapa = envio.etapa || 'PENDIENTE_RECOLECCION';
    return ETAPAS_ENVIO.findIndex((e) => e.key === etapa);
  };

  const avanzarEtapa = async (envioId) => {
    setError('');
    setInfo('');
    const envio = envios.find((e) => e.id === envioId);
    if (!envio) return;
    const currentIdx = obtenerEtapaEnvio(envio);
    if (currentIdx >= ETAPAS_ENVIO.length - 1) return;
    const nextEtapa = ETAPAS_ENVIO[currentIdx + 1].key;
    try {
      await logisticaAPI.seguimiento.avanzarEtapa(envioId, nextEtapa);
      setInfo('Etapa avanzada correctamente');
      cargarEnvios();
    } catch (err) {
      setError(err.message);
    }
  };

  const truncar = (text, max = 60) => {
    if (!text) return '—';
    return text.length > max ? text.slice(0, max) + '…' : text;
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">
          <div className="panel-title">📦 Logística</div>
          <p>Cargando información logística…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">📦 Logística</div>
      <div className="panel-sub">
        Gestión de envíos, recepciones y no conformidades
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--maderaclaro)' }}>
          <button type="button" className={`btn btn-sm ${tab === 'seguimiento' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTab('seguimiento')}>
            📍 Seguimiento
          </button>
          <button type="button" className={`btn btn-sm ${tab === 'envios' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTab('envios')}>
            🚚 Envíos
          </button>
          <button type="button" className={`btn btn-sm ${tab === 'recepciones' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTab('recepciones')}>
            📦 Recepciones
          </button>
          <button type="button" className={`btn btn-sm ${tab === 'noConfs' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => handleTab('noConfs')}>
            ⚠️ No conformidades
          </button>
        </nav>

        {tab === 'seguimiento' && (
          <div>
            <div className="card-header">
              <span className="card-title">📍 Seguimiento de envíos</span>
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cargarEnvios}>
                  Actualizar
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <select
                value={seguimientoEnvioId}
                onChange={(e) => setSeguimientoEnvioId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--maderaclaro)', minWidth: '200px' }}
              >
                <option value="">Seleccionar envío...</option>
                {envios.map((env) => (
                  <option key={env.id} value={env.id}>
                    Pedido {env.pedido_id?.slice(0, 8) || env.id?.slice(0, 8) || '—'}
                  </option>
                ))}
              </select>
            </div>
            {seguimientoEnvioId && (
              <div>
                {(() => {
                  const envio = envios.find((e) => e.id === seguimientoEnvioId);
                  if (!envio) return <p>Envío no encontrado</p>;
                  const currentIdx = obtenerEtapaEnvio(envio);
                  const isFinal = currentIdx >= ETAPAS_ENVIO.length - 1;
                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {ETAPAS_ENVIO.map((etapa, idx) => {
                          const isCompleted = idx < currentIdx;
                          const isCurrent = idx === currentIdx;
                          const isPending = idx > currentIdx;
                          return (
                            <div key={etapa.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '20px',
                                  backgroundColor:
                                    isCompleted ? '#d4edda' :
                                    isCurrent ? '#cce5ff' :
                                    '#f8f9fa',
                                  border: isCurrent ? '2px solid #007bff' : '1px solid #dee2e6',
                                }}
                              >
                                {isCompleted ? '✅' : etapa.emoji}
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: isCurrent ? 'bold' : isCompleted ? '500' : 'normal', color: isPending ? '#6c757d' : 'inherit' }}>
                                {etapa.label}
                              </span>
                              {idx < ETAPAS_ENVIO.length - 1 && (
                                <span style={{ color: '#007bff', fontSize: '14px' }}>➔</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {PUEDE_AVANZAR_ETAPA.includes(rol) && !isFinal && (
                        <div style={{ marginTop: '1rem' }}>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => avanzarEtapa(envio.id)}>
                            Avanzar etapa
                          </button>
                          <span style={{ marginLeft: '1rem', fontSize: '14px', color: '#6c757d' }}>
                            Etapa actual: {ETAPAS_ENVIO[currentIdx].label}
                          </span>
                        </div>
                      )}
                      {isFinal && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#d4edda', borderRadius: '4px', color: '#155724' }}>
                          ✅ Envío completado - Recibido conforme
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {!seguimientoEnvioId && envios.length > 0 && (
              <p style={{ color: '#6c757d' }}>Selecciona un envío para ver su seguimiento</p>
            )}
            {envios.length === 0 && (
              <p style={{ color: '#6c757d' }}>No hay envíos registrados</p>
            )}
          </div>
        )}

        {tab === 'envios' && (
          <div>
            <div className="card-header">
              <span className="card-title">Lista de envíos</span>
              <div>
                {PUEDE_CREAR_ENVIO.includes(rol) && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalEnvio(true)}>
                    + Nuevo envío
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={cargarEnvios}>
                  Actualizar
                </button>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Transportista</th>
                  <th>Guía</th>
                  <th>Etapa</th>
                  <th>Despacho</th>
                  <th>Entrega estimada</th>
                </tr>
              </thead>
              <tbody>
                {envios.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay envíos registrados</td>
                  </tr>
                ) : (
                  envios.map((env) => (
                    <tr key={env.id}>
                      <td><code>{env.pedido_id || '—'}</code></td>
                      <td>{env.transportista || '—'}</td>
                      <td>{env.numero_guia || '—'}</td>
                      <td><PillEtapa etapa={env.etapa} /></td>
                      <td>{env.fecha_despacho ? new Date(env.fecha_despacho).toLocaleString('es-PE') : '—'}</td>
                      <td>{env.fecha_estimada_entrega ? new Date(env.fecha_estimada_entrega).toLocaleDateString('es-PE') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'recepciones' && (
          <div>
            <div className="card-header">
              <span className="card-title">Lista de recepciones</span>
              <div>
                {PUEDE_CREAR_RECEPCION.includes(rol) && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalRecepcion(true)}>
                    + Nueva recepción
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={cargarRecepciones}>
                  Actualizar
                </button>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Pedido</th>
                  <th>Envío</th>
                  <th>Encargado</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recepciones.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No hay recepciones registradas</td>
                  </tr>
                ) : (
                  recepciones.map((rec) => (
                    <tr key={rec.id}>
                      <td><code>{rec.id.slice(0, 8)}…</code></td>
                      <td>{rec.pedido_id || '—'}</td>
                      <td>{rec.envio_id || '—'}</td>
                      <td>{rec.encargado_id || '—'}</td>
                      <td><PillEstadoRecepcion estado={rec.estado_recepcion} /></td>
                      <td>{rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-PE') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'noConfs' && (
          <div>
            <div className="card-header">
              <span className="card-title">Lista de no conformidades</span>
              <div>
                {PUEDE_CREAR_NC.includes(rol) && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalNC(true)}>
                    + Nueva no conformidad
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={cargarNoConfs}>
                  Actualizar
                </button>
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Recepción</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Resuelta</th>
                  <th>Reporte</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {noConfs.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No hay no conformidades registradas</td>
                  </tr>
                ) : (
                  noConfs.map((nc) => (
                    <tr key={nc.id}>
                      <td><code>{nc.id.slice(0, 8)}…</code></td>
                      <td>{nc.recepcion_id ? nc.recepcion_id.slice(0, 8) + '…' : '—'}</td>
                      <td>{nc.tipo || '—'}</td>
                      <td style={{ maxWidth: 200 }}>{truncar(nc.descripcion)}</td>
                      <td><PillResuelta resuelta={Boolean(nc.resuelta)} /></td>
                      <td>{nc.fecha_reporte ? new Date(nc.fecha_reporte).toLocaleDateString('es-PE') : '—'}</td>
                      <td>
                        {!nc.resuelta && PUEDE_RESOLVER_NC.includes(rol) && (
                          <button type="button" className="btn btn-success btn-sm" onClick={() => resolverNC(nc.id)}>
                            Resolver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalEnvio open={modalEnvio} onClose={() => setModalEnvio(false)} onCreated={() => { cargarEnvios(); setInfo('Envío creado correctamente'); }} />
      <ModalRecepcion open={modalRecepcion} onClose={() => setModalRecepcion(false)} onCreated={() => { cargarRecepciones(); setInfo('Recepción creada correctamente'); }} />
      <ModalNoConformidad open={modalNC} onClose={() => setModalNC(false)} onCreated={() => { cargarNoConfs(); setInfo('No conformidad creada correctamente'); }} />
    </div>
  );
}
