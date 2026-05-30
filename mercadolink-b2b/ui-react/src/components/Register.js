import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const ROLES = [
  'CLIENTE_MAYORISTA',
  'VENDEDOR',
  'PROVEEDOR',
  'ADMINISTRADOR',
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    documento: '',
    rol: 'CLIENTE_MAYORISTA',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authAPI.register(
        form.nombre,
        form.email,
        form.password,
        form.documento,
        form.rol
      );
      setSuccess('Registro exitoso. Redirigiendo al login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen">
    <main className="page" style={{ width: '100%', maxWidth: 420 }}>
      <div className="card">
        <h2>Registro</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre comercial</label>
            <input
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña (mín. 8)</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="documento">Documento (RUC/DNI)</label>
            <input
              id="documento"
              name="documento"
              value={form.documento}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="rol">Rol</label>
            <select id="rol" name="rol" value={form.rol} onChange={handleChange}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrar'}
          </button>
        </form>
        <p className="hint" style={{ marginTop: 16 }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </main>
    </div>
  );
}
