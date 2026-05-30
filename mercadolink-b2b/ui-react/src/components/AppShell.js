import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { badgeClassForRol, canAccess, clearSession, getSession } from '../utils/auth';

const NAV = [
  { id: 'dashboard', path: '/', icon: '🏠', label: 'Inicio', module: 'dashboard' },
  { id: 'productos', path: '/productos', icon: '🛒', label: 'Catálogo', module: 'productos' },
  { id: 'inventario', path: '/inventario', icon: '📦', label: 'Inventario', module: 'inventario' },
  { id: 'pedidos', path: '/pedidos', icon: '📋', label: 'Mis Pedidos', module: 'pedidos' },
  { id: 'proveedores', path: '/proveedores', icon: '🤝', label: 'Proveedores', module: 'proveedores' },
  { id: 'logistica', path: '/logistica', icon: '🚚', label: 'Logística', module: 'logistica' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(getSession());
  const [time, setTime] = useState('');

  useEffect(() => {
    const refresh = () => setSession(getSession());
    window.addEventListener('auth-change', refresh);
    return () => window.removeEventListener('auth-change', refresh);
  }, []);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const logout = () => {
    clearSession();
    navigate('/login');
  };

  const rolLabel = session.rol?.replace(/_/g, ' ') || '—';

  return (
    <div id="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo pulse">
            🛒 MercadoLink{' '}
            <span className={`badge ${badgeClassForRol(session.rol)}`}>{rolLabel}</span>
          </div>
          <span className="topbar-user">👋 {session.nombreComercial}</span>
        </div>
        <div className="topbar-right">
          <span className="live-time">🕐 {time}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            🚪 Salir
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="nav-section" style={{ marginTop: '0.5rem' }}>📌 PRINCIPAL</div>
          {NAV.filter((n) => canAccess(n.module, session.rol)).map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard') ? 'active' : ''
              }`}
            >
              <span className="ni">{item.icon}</span> {item.label}
            </Link>
          ))}
          
          <div className="nav-section">ℹ️ AYUDA</div>
          <a href="/swagger-ui.html" target="_blank" rel="noopener noreferrer" className="nav-item">
            📖 API Docs
          </a>
        </aside>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}