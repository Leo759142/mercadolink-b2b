# Mejoras Seguridad y Robustez Login/Landing

## 1. Seguridad Landing

### Headers
```java
// En SecurityConfig o WebConfig
http.headers()
  .contentSecurityPolicy("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
  .frameOptions().sameOrigin()
  .httpStrictTransportSecurity();
```

### Sin datos sensibles
- No exponer IDs de BD en landing
- No mostrar rutas internas
- Minimizar información de error

## 2. Seguridad Login

### Frontend
```javascript
// Sanitizar email
const sanitizeEmail = (email) => email.trim().toLowerCase();

// No loguear password
const doLogin = async (email, password) => {
  console.log('[LOGIN] Intentando login para:', sanitizeEmail(email));
  // No hacer console.log(password)
};
```

### Backend
- Rate limiting en `/api/v1/auth/login`
- Bloqueo temporal después de 5 intentos fallidos
- Logs de seguridad (sin passwords)
- JWT con expiración corta (15min)
- Refresh token de larga duración (7 días)

## 3. Manejo de Sesión

### Token Storage
```javascript
// Preferir httpOnly cookie (pendiente)
// Mientras tanto: localStorage con encryption simple
const encryptToken = (token) => {
  return btoa(token); // básico, mejora con crypto-js
};

const decryptToken = (encrypted) => {
  return atob(encrypted);
};
```

### Validación de token
```javascript
// En api.js interceptor
const validateToken = async () => {
  try {
    await apiClient.get('/auth/validate');
  } catch {
    clearSession();
  }
};
```

## 4. Logout Global

### Multi-tab
```javascript
// Escuchar storage events
window.addEventListener('storage', (e) => {
  if (e.key === 'token' && !e.newValue) {
    window.location.reload();
  }
});
```

## 5. Logs y Auditoría

### Frontend logs
```javascript
const logSecurityEvent = (event, data) => {
  console.log('[SECURITY]', event, data);
  // Enviar a backend para auditoria
};
```

### Backend logs
- Login exitoso: timestamp, email, IP, user-agent
- Login fallido: timestamp, email, razón
- Logout: timestamp, user

## 6. Protección XSS

### Sanitización
```javascript
// Evitar innerHTML con datos de usuario
// Usar textContent o React escape automático
```

### CSP Header
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

## 7. Protección CSRF

### Estado actual
- CSRF deshabilitado globalmente
- Usar solo para APIs stateless (JWT)

### Mejora (futuro)
- Si se agrega sesión, habilitar CSRF con cookie token

## 8. Timeouts

### API Client
```javascript
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10s max
});
```

### Login específico
```javascript
const doLogin = async (email, password) => {
  try {
    const { data } = await authAPI.login(email, password, {
      timeout: 15000, // override para login
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      setError('Tiempo de espera agotado');
    }
  }
};
```

## 9. Offline Handling

### Service Worker (futuro)
```javascript
// Cache de assets estáticos
// Mostrar mensaje "Sin conexión" si API falla
```

###detectar offline
```javascript
window.addEventListener('online', () => setOnline(true));
window.addEventListener('offline', () => setOnline(false));
```

## 10. Refresh Token Strategy

### Backend
```java
// Endpoint refresh
@PostMapping("/auth/refresh")
public TokenResponse refresh(@CookieValue String refreshToken) {
  // Validar refresh token
  // Generar nuevo JWT
  // Retornar nuevo token
}
```

### Frontend
```javascript
//Interceptor renovación
let isRefreshing = false;
let refreshQueue = [];

apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const { data } = await refreshToken();
      refreshQueue.forEach(cb => cb(data.token));
      refreshQueue = [];
      return apiClient.request(error.config);
    } catch {
      clearSession();
      navigate('/app');
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
});
```

## Checklist Seguridad

- [ ] CSRF apropiado para el modelo de auth
- [ ] Rate limiting en login
- [ ] Password hashing bcrypt (backend)
- [ ] JWT con expiración corta
- [ ] Refresh token seguro (httpOnly cookie)
- [ ] Logs de seguridad (sin passwords)
- [ ] XSS protection (CSP, sanitización)
- [ ] HTTPS obligatorio en producción
- [ ] No exponer stack traces en producción
- [ ] Validación de entrada en backend
