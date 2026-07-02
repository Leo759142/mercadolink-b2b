import React, { useCallback, useEffect, useState } from 'react';
import { culqiAPI } from '../api';

const SANDBOX = process.env.NODE_ENV === 'development';

function logEvento(evento, datos) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, evento, datos };
  const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-100)));
  console.log(`[DEBUG] ${evento}`, datos);
}

export default function CulqiCheckout({ open, onClose, pedidoId, monto, onPagoCompleto }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testCard, setTestCard] = useState({
    numero: '4111111111111111',
    cvv: '123',
    expMes: '12',
    expAno: '25',
  });

  const cargarConfig = useCallback(async () => {
    try {
      const { data } = await culqiAPI.config();
      setConfig(data);
    } catch (err) {
      logEvento('culqi_config_error', { error: err.message });
      // Fallback para desarrollo
      setConfig({ publicKey: 'pk_test_demo', realMode: false });
    }
  }, []);

  useEffect(() => {
    if (open) {
      cargarConfig();
      setError('');
    }
  }, [open, cargarConfig]);

  const simularPago = async () => {
    setLoading(true);
    setError('');
    logEvento('culqi_checkout_simular', { pedidoId, monto });

    try {
      const orderId = await crearPago();
      const transactionId = 'TX-SIM-' + Date.now();
      const amount = monto.toFixed(2);

      await culqiAPI.webhook({ orderId, chargeId: 'ch-sim-' + Date.now(), transactionId, status: 'APROBADO', amount });
      logEvento('culqi_checkout_webhook_enviado', { orderId });

      onPagoCompleto?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const crearPago = async () => {
    const { data } = await culqiAPI.iniciar(pedidoId, monto);
    return data.orderId;
  };

  const irACheckoutReal = async () => {
    setLoading(true);
    setError('');
    try {
      const orderId = await crearPago();
      const checkoutUrl = `https://checkout.culqi.com/${orderId}`;
      logEvento('culqi_checkout_redirigir', { checkoutUrl });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isReal = config?.realMode;

  return (
    <div className="modal-bg open" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 480 }}>
        <h3>💳 Pago con Culqi</h3>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card-group" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Pedido: <code>{pedidoId?.slice(0, 8)}…</code>
          </p>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>
            Total: S/ {Number(monto).toFixed(2)}
          </p>
        </div>

        {isReal ? (
          <div style={{ textAlign: 'center' }}>
            <button type="button" className="btn btn-primary btn-lg" disabled={loading} onClick={irACheckoutReal}>
              {loading ? 'Redirigiendo…' : 'Pagar con Culqi (producción)'}
            </button>
            <small style={{ display: 'block', marginTop: 8, color: 'var(--text-muted)' }}>
              Serás redirigido a checkout.culqi.com
            </small>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.85rem', marginBottom: 8 }}>
              <strong>Modo prueba - Simula el pago</strong>
            </p>

            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <div className="form-group">
                <label>Tarjeta (test)</label>
                <input
                  type="text"
                  value={testCard.numero}
                  onChange={(e) => setTestCard({ ...testCard, numero: e.target.value })}
                  placeholder="4111111111111111"
                  maxLength={16}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>MM</label>
                  <input
                    type="text"
                    value={testCard.expMes}
                    onChange={(e) => setTestCard({ ...testCard, expMes: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>YY</label>
                  <input
                    type="text"
                    value={testCard.expAno}
                    onChange={(e) => setTestCard({ ...testCard, expAno: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input
                    type="text"
                    value={testCard.cvv}
                    onChange={(e) => setTestCard({ ...testCard, cvv: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-success btn-lg" disabled={loading} onClick={simularPago}>
              {loading ? 'Procesando…' : 'Simular pago aprobado'}
            </button>
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}