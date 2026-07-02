import React, { useEffect, useState } from 'react';
import { auditoriaAPI } from '../api';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
}

function resultadoLabel(ev) {
  const e = (ev || '').toUpperCase();
  if (e.includes('ERROR') || e.includes('RECHAZADO')) return 'RECHAZADO';
  if (e.includes('EXITO')) return 'EXITO';
  return '—';
}

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      logEvento('cargar_auditoria', {});
      try {
        const { data } = await auditoriaAPI.listar();
        const mapped = (data || []).map((a) => ({
          evento: `${a.getTipoActor() || 'SISTEMA'} · ${a.getOperacion()}`,
          datos: {
            servicio: a.getServicio(),
            resultado: a.getResultado(),
            detalle: a.getDetalle(),
            correlationId: a.getCorrelationId(),
          },
          timestamp: a.getTimestampOp() ? a.getTimestampOp().toString() : new Date().toISOString(),
        }));
        setLogs(mapped.reverse());
        logEvento('cargar_auditoria_exito', { count: mapped.length });
      } catch {
        const stored = localStorage.getItem('debug_logs');
        if (stored) {
          try {
            setLogs(JSON.parse(stored).reverse());
            logEvento('cargar_auditoria_storage', {});
          } catch {
            setLogs([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const filtered = filter
    ? logs.filter((l) => {
        const ev = (l.evento || '').toUpperCase();
        if (filter === 'EXITO') return ev.includes('EXITO') && !ev.includes('ERROR');
        if (filter === 'ERROR') return ev.includes('ERROR');
        if (filter === 'RECHAZADO') return ev.includes('RECHAZADO') || ev.includes('ERROR');
        return true;
      })
    : logs;

  const stats = {
    total: logs.length,
    exito: logs.filter((l) => resultadoLabel(l.evento) === 'EXITO').length,
    rechazado: logs.filter((l) => resultadoLabel(l.evento) === 'RECHAZADO').length,
  };

  const dotClass = (ev) => {
    const e = (ev || '').toUpperCase();
    if (e.includes('ERROR')) return 'log-dot-err';
    if (e.includes('EXITO')) return 'log-dot-ok';
    if (e.includes('RECHAZADO')) return 'log-dot-warn';
    return 'log-dot-info';
  };

  const pillClass = (ev) => {
    const e = (ev || '').toUpperCase();
    if (e.includes('ERROR') || e.includes('RECHAZADO')) return 'pill-red';
    if (e.includes('EXITO')) return 'pill-ok';
    return 'pill-pending';
  };

  const getResultado = (ev) => {
    const e = (ev || '').toUpperCase();
    if (e.includes('ERROR') || e.includes('RECHAZADO')) return 'RECHAZADO';
    if (e.includes('EXITO')) return 'EXITO';
    return '—';
  };

  return (
    <div className="panel active">
      <div className="panel-title">🔎 Auditoría Transversal</div>
      <div className="panel-sub">
        Log SOA · correlationId · timestamps · EXITO / ERROR / RECHAZADO
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="label">Operaciones</div>
          <div className="val">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">Exitosas</div>
          <div className="val" style={{ color: 'var(--verde-fresco)' }}>{stats.exito}</div>
        </div>
        <div className="stat-card">
          <div className="label">Rechazadas</div>
          <div className="val" style={{ color: 'var(--rojo-terracota)' }}>{stats.rechazado}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Log de Operaciones</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 180 }}
          >
            <option value="">Todos</option>
            <option value="EXITO">Solo ÉXITO</option>
            <option value="ERROR">Solo ERROR</option>
            <option value="RECHAZADO">Solo RECHAZADO</option>
          </select>
        </div>

        {loading ? (
          <p className="empty-state">Cargando logs de auditoría...</p>
        ) : (
          <div className="scrollbox" style={{ maxHeight: 380 }}>
            {filtered.length === 0 ? (
              <p className="empty-state">Sin entradas</p>
            ) : (
              filtered.map((l, i) => (
                <div className="log-entry" key={i}>
                  <div className={`log-dot ${dotClass(l.evento)}`}></div>
                  <div className="log-time">
                    {l.timestamp ? new Date(l.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                  <div className="log-msg">
                    <span className="tag">{(l.evento || '').split(' · ')[0]}</span>{' '}
                    <strong>{(l.evento || '').split(' · ').slice(1).join(' · ') || l.evento}</strong>{' '}
                    <span className="log-meta">· {typeof l.datos === 'string' ? l.datos : JSON.stringify(l.datos)?.slice(0, 60)}</span>
                  </div>
                  <span className={`pill ${pillClass(l.evento)}`}>
                    {getResultado(l.evento)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}