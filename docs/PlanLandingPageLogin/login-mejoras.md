# Mejoras UX Login - Plan Detallado

## Estado Actual
- Login React en `/login`
- Quick login por roles (vendedor, proveedor, mayorista, admin)
- Formulario email/password
- Persistencia en localStorage

## 1. Problemas Identificados

### a) Falta branding Aspropa
- Sin logo visible (solo emoji 🛒)
- Sin colores institucionales destacados
- Sin misión/visión breve

### b) Flujo de error pobre
- Solo muestra mensaje genérico
- No indica si es email incorrecto o password
- No hay recuperación de cuenta

### c) Sin "Recordarme"
- Token expira y usuario debe loguear de nuevo
- No hay refresh token automático (pendiente backend)

### d) Sin Onboarding
- Usuario nuevo no sabe qué hacer después de login
- No hay tour guiado

## 2. Mejoras Propuestas

### 2.1 Branding

```jsx
<div className="login-branding">
  <img src="/logo-aspropa.png" alt="Aspropa" className="login-logo" />
  <h1>MercadoLink</h1>
  <p className="login-tagline">El mercado mayorista digital para Aspropa</p>
</div>
```

### 2.2 Separador visual
```jsx
<hr className="login-separator">
<span className="separator-text">o acceder con credenciales</span>
```

### 2.3 Validación frontend
```jsx
const validarFormulario = () => {
  const errores = {};
  
  if (!email) errores.email = 'Email requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = 'Email inválido';
  }
  
  if (!password) errores.password = 'Contraseña requerida';
  else if (password.length < 6) {
    errores.password = 'Mínimo 6 caracteres';
  }
  
  return errores;
};
```

### 2.4 Manejo de errores mejorado
```jsx
const getErrorMessage = (err) => {
  const status = err.response?.status;
  const message = err.response?.data?.message || err.message;
  
  switch (status) {
    case 401:
      return 'Email o contraseña incorrectos';
    case 403:
      return 'Cuenta desactivada. Contacta al administrador';
    case 404:
      return 'Usuario no encontrado';
    case 0:
      return 'No hay conexión con el servidor';
    default:
      return message || 'Error inesperado';
  }
};
```

### 2.5 Loading states
```jsx
{loading && (
  <div className="loading-overlay">
    <div className="spinner" />
    <p>Verificando credenciales...</p>
  </div>
)}
```

### 2.6 Recuperación de contraseña (futuro)
- Link "¿Olvidaste tu contraseña?"
- Modal con email de recuperación
- Backend: endpoint `/auth/forgot-password`

### 2.7 Sesión extendida
```javascript
// En api.js interceptor
if (error.response?.status === 401 && !isRefreshing) {
  isRefreshing = true;
  try {
    await refreshToken();
    return apiClient.request(error.config);
  } catch {
    clearSession();
    navigate('/login');
  } finally {
    isRefreshing = false;
  }
}
```

## 3. Accesibilidad Login

### Mejoras
- Labels asociados a inputs (`htmlFor`)
- Focus visible en botones
- Contraste WCAG AA (mínimo 4.5:1)
- Navegación por teclado (Enter submit, Tab entre campos)

## 4. Seguridad

### Mejoras
- No mostrar password en consola
- Sanitizar email antes de enviar
- Rate limiting en backend
- CSRF token (pendiente, actualmente deshabilitado globalmente)
- Logout en todos los tabs al cerrar sesión

## 5. Mobile Responsive

### Mejoras
- Inputs más grandes en móvil (min-height 48px)
- Botones full width
- Teclado tipo email en input email
- Evitar zoom en inputs (font-size >= 16px)

## 6. Testing

### Casos de prueba
1. Login exitoso con credenciales correctas
2. Error 401 con credenciales incorrectas
3. Error 0 sin conexión
4. Validación frontend (campos vacíos)
5. Quick login por rol
6. Redirección post-login
