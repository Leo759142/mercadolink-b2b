import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api';
import { DEMO_USERS, persistSession } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('cliente@aspropa.pe');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (mail, pass) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(mail, pass);
      persistSession(data);
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (key) => {
    const u = DEMO_USERS[key];
    setEmail(u.email);
    setPassword(u.password);
    doLogin(u.email, u.password);
  };

  return (
    <div id="login-screen">
      <div className="decorative-stripes"></div>
      <div className="login-box">
        <h1>🛒 MercadoLink B2B</h1>
        <div className="hand-title">¡Bienvenidos al mercado!</div>
        <p>Sistema de gestión para el Mercado Popular Aspropa</p>
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="role-grid">
          {Object.entries(DEMO_USERS).map(([key, u]) => (
            <button
              key={key}
              type="button"
              className="role-btn pulse"
              disabled={loading}
              onClick={() => quickLogin(key)}
            >
              <span className="icon">
                {key === 'vendedor' && '🏪'}
                {key === 'proveedor' && '🚚'}
                {key === 'mayorista' && '🛒'}
                {key === 'admin' && '🛡️'}
              </span>
              <span className="name">{u.label}</span>
              <span className="sub">{u.email}</span>
            </button>
          ))}
        </div>

        <hr className="sep" />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">📧 Email del negocio</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@aspropa.pe"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">🔒 Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? '🔄 Entrando...' : '→ Entrar al mercado'}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16, textAlign: 'center' }}>
          ¿Nuevo? <Link to="/register">📝 Regístrate aquí</Link><br />
          <small>Demo password: <code>password123</code></small>
        </p>
      </div>
      <p className="login-footer">v1.0 · Fase A · REST + JWT · ☕ Desarrollado con cariño para Aspropa</p>
    </div>
  );
}