import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <main className="page">
      <div className="card">
        <h1>MercadoLink B2B</h1>
        <p>
          Plataforma mayorista para la Asociación de Comerciantes del Mercado Popular
          Aspropa. Compra productos del catálogo, crea pedidos B2B y paga con Izipay
          (sandbox).
        </p>

        <div className="alert alert-info">
          <strong>Demo:</strong> cliente@aspropa.pe / password123 (rol CLIENTE_MAYORISTA)
        </div>

        <p className="hint">
          Reglas: mínimo 10 unidades totales y S/ 50.00 por pedido.
        </p>

        <p>
          {isAuthenticated ? (
            <>
              <Link className="btn-primary" to="/productos">
                Ver catálogo
              </Link>{' '}
              <Link className="btn-secondary" to="/pedidos">
                Mis pedidos
              </Link>
            </>
          ) : (
            <Link className="btn-primary" to="/login">
              Iniciar sesión
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
