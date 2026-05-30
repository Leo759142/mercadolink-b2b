import React, { useCallback, useEffect, useState } from 'react';
import { izipayAPI, pagosAPI, pedidosAPI } from '../api';
import {
  FLUJO_LOGISTICO,
  labelEstado,
  pillClass,
  siguientesEstados,
} from '../utils/pedidos';
import NuevoPedidoModal from './NuevoPedidoModal';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
  console.log(`[DEBUG] ${evento}`, datos);
}

const PUEDE_GESTIONAR_ESTADO = ['VENDEDOR', 'ADMINISTRADOR'];
const PUEDE_CREAR = ['CLIENTE_MAYORISTA', 'VENDEDOR', 'ADMINISTRADOR'];

export default function Pedidos() {
  const rol = localStorage.getItem('rol');
  const [pedidos, setPedidos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [accionId, setAccionId] = useState(null);

  const cargar = useCallback(async () => {
    logEvento('cargar_pedidos_inicio', {});
    setError('');
    try {
      const { data } = await pedidosAPI.misPedidos();
      logEvento('cargar_pedidos_exito', { count: data.length });
      setPedidos(data);
      setSelected((prev) =>
        prev ? data.find((p) => p.id === prev.id) || null : null
      );
    } catch (err) {
      logEvento('cargar_pedidos_error', { error: err.message, stack: err.stack });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const iniciarPago = async (pedidoId) => {
    logEvento('iniciar_pago', { pedidoId });
    setAccionId(pedidoId);
    setError('');
    setInfo('');
    try {
      const { data } = await pagosAPI.iniciar(pedidoId);
      logEvento('iniciar_pago_exito', { orderId: data.orderId, monto: data.monto });
      setInfo(`Pago iniciado: ${data.orderId} — S/ ${Number(data.monto).toFixed(2)}`);
      localStorage.setItem(`pago_${pedidoId}`, data.orderId);
      await cargar();
    } catch (err) {
      logEvento('iniciar_pago_error', { error: err.message, stack: err.stack });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

  const simularPagoAprobado = async (pedido) => {
    logEvento('simular_pago_inicio', { pedidoId: pedido.id, monto: pedido.montoTotal });
    setAccionId(pedido.id);
    setError('');
    setInfo('');
    try {
      let orderId = localStorage.getItem(`pago_${pedido.id}`);
      let monto = pedido.montoTotal;
      if (!orderId) {
        logEvento('simular_pago_iniciar_sesion', { pedidoId: pedido.id });
        const iniciar = await pagosAPI.iniciar(pedido.id);
        orderId = iniciar.data.orderId;
        monto = iniciar.data.monto;
      }
      const amount = Number(monto).toFixed(2);
      const transactionId = `TX-${Date.now()}`;
      logEvento('simular_pago_firmar', { orderId, transactionId, amount });
      const firmar = await izipayAPI.firmar({
        orderId,
        transactionId,
        status: 'APROBADO',
        amount,
      });
      logEvento('simular_pago_webhook', { orderId, transactionId });
      await izipayAPI.webhook({
        orderId,
        transactionId,
        status: 'APROBADO',
        amount,
        signature: firmar.data.signature,
      });
      logEvento('simular_pago_exito', { pedidoId: pedido.id });
      setInfo('Webhook enviado. El pedido pasará a PAGADO en unos segundos.');
      setTimeout(cargar, 2000);
    } catch (err) {
      logEvento('simular_pago_error', { error: err.message, stack: err.stack });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

  const avanzarEstado = async (pedido, nuevoEstado) => {
    logEvento('avanzar_estado', { pedidoId: pedido.id, nuevoEstado });
    setAccionId(pedido.id);
    setError('');
    setInfo('');
    try {
      await pedidosAPI.cambiarEstado(pedido.id, nuevoEstado);
      logEvento('avanzar_estado_exito', { pedidoId: pedido.id, nuevoEstado });
      setInfo(`Estado actualizado: ${labelEstado(nuevoEstado)}`);
      await cargar();
    } catch (err) {
      logEvento('avanzar_estado_error', { error: err.message, stack: err.stack });
      setError(err.message);
    } finally {
      setAccionId(null);
    }
  };

  const resumenItems = (p) => {
    if (!p.items?.length) return '—';
    return p.items
      .map(
        (it) =>
          `${it.producto?.descripcion || '?'} ×${it.cantidad}`
      )
      .join(', ');
  };

  if (loading) {
    return (
      <div className="panel active">
        <div className="card">Cargando pedidos…</div>
      </div>
    );
  }

  return (
    <div className="panel active">
      <div className="panel-title">Gestión de pedidos B2B</div>
      <div className="panel-sub">
        Crear, pagar (Izipay sandbox) y avanzar estados logísticos
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Mis pedidos</span>
          <div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cargar}>
              Actualizar
            </button>
            {PUEDE_CREAR.includes(rol) && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setModalOpen(true)}
              >
                + Nuevo pedido
              </button>
            )}
          </div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ítems</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay pedidos</td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code>{p.id.slice(0, 8)}…</code>
                  </td>
                  <td style={{ maxWidth: 200 }}>{resumenItems(p)}</td>
                  <td>S/ {Number(p.montoTotal).toFixed(2)}</td>
                  <td>
                    <span className={`pill ${pillClass(p.estado)}`}>
                      {labelEstado(p.estado)}
                    </span>
                  </td>
                  <td>{new Date(p.fechaCreacion).toLocaleString('es-PE')}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelected(p)}
                    >
                      Ver flujo
                    </button>
                    {p.estado === 'PENDIENTE_PAGO' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={accionId === p.id}
                          onClick={() => iniciarPago(p.id)}
                        >
                          Pago
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={accionId === p.id}
                          onClick={() => simularPagoAprobado(p)}
                        >
                          Simular OK
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Flujo — <code>{selected.id.slice(0, 8)}…</code>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelected(null)}
            >
              Cerrar
            </button>
          </div>
          <div className="flow-steps">
            {FLUJO_LOGISTICO.map((step, i) => {
              const idxActual = FLUJO_LOGISTICO.indexOf(
                selected.estado === 'BORRADOR' ? 'PENDIENTE_PAGO' : selected.estado
              );
              const idx = FLUJO_LOGISTICO.indexOf(step);
              let cls = 'step';
              if (idx < idxActual || selected.estado === step) cls += ' done';
              if (selected.estado === step) cls += ' current';
              return (
                <React.Fragment key={step}>
                  {i > 0 && <span className="step-arrow">→</span>}
                  <div className={cls}>{labelEstado(step)}</div>
                </React.Fragment>
              );
            })}
          </div>
          {PUEDE_GESTIONAR_ESTADO.includes(rol) && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {siguientesEstados(selected.estado)
                .filter((e) => e !== 'PAGADO' && e !== 'RECHAZADO')
                .map((est) => (
                  <button
                    key={est}
                    type="button"
                    className="btn btn-success btn-sm"
                    disabled={accionId === selected.id}
                    onClick={() => avanzarEstado(selected, est)}
                  >
                    → {labelEstado(est)}
                  </button>
                ))}
            </div>
          )}
          <p className="hint" style={{ marginTop: 8 }}>
            PAGADO/RECHAZADO se aplican vía webhook Izipay. Estados logísticos: vendedor o
            admin.
          </p>
        </div>
      )}

      <NuevoPedidoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setInfo('Pedido creado correctamente');
          cargar();
        }}
      />
    </div>
  );
}
