# Mejoras Navegación y Transiciones

## 1. Flujo Landing → App → Login

### Estado actual
- Landing: `/index.html` (Thymeleaf)
- App: `/app` (React SPA)
- Login: `/login` (dentro de SPA)
- Spring Boot sirve landing y SPA

### Problema
- No hay transición visual entre landing y app
- Login aparece de golpe sin contexto

### Solución
```javascript
// En App.js
const isAuthenticated = !!localStorage.getItem('token');

if (!isAuthenticated) {
  return <Login />;
}

return (
  <Routes>
    <Route path="/" element={<AppShell />}>
      <Route index element={<Dashboard />} />
      {/* ... */}
    </Route>
  </Routes>
);
```

### Redirect inteligente
```javascript
// En landing, link a /app
// Si hay token, ir a dashboard
// Si no, mostrar login (SPA)

const checkSession = () => {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = '/app#/dashboard';
  } else {
    window.location.href = '/app';
  }
};
```

## 2. Skeleton Loading

### AppShell
```jsx
const [sessionReady, setSessionReady] = useState(false);

useEffect(() => {
  const init = async () => {
    // Verificar token validez
    await validateToken();
    setSessionReady(true);
  };
  init();
}, []);

if (!sessionReady) {
  return <SkeletonAppShell />;
}
```

### Componente Skeleton
```jsx
const SkeletonAppShell = () => (
  <div className="app-shell">
    <div className="skeleton-topbar" />
    <div className="skeleton-sidebar" />
    <div className="skeleton-content">
      <div className="skeleton-card" />
      <div className="skeleton-card" />
    </div>
  </div>
);
```

## 3. Transiciones

### CSS Transitions
```css
.page-transition {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### React Transition Group (opcional)
```jsx
import { CSSTransition } from 'react-transition-group';

<CSSTransition
  in={true}
  timeout={300}
  classNames="page-transition"
  unmountOnExit
>
  <Dashboard />
</CSSTransition>
```

## 4. Breadcrumbs/Navegación

### Mejora AppShell
```jsx
const Breadcrumbs = () => {
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  return (
    <nav className="breadcrumbs">
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && ' / '}
          <Link to={`/${segments.slice(0, i+1).join('/')}`}>
            {seg.charAt(0).toUpperCase() + seg.slice(1)}
          </Link>
        </span>
      ))}
    </nav>
  );
};
```

## 5. Estado Vacío

### Mejorar pantallas sin datos
```jsx
const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
    {action && <button onClick={action}>{action.label}</button>}
  </div>
);

// Uso en Productos
<Productos />
  {productos.length === 0 && (
    <EmptyState
      icon="📭"
      title="Sin productos"
      description="Comienza agregando productos al catálogo"
      action={{ label: 'Agregar producto', onClick: abrirModal }}
    />
  )}
```

## 6. Notificaciones Toast

### Global Toast System
```jsx
const ToastContainer = () => {
  const toasts = useToastStore(state => state.toasts);
  
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.icon}</span>
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
};
```

## 7. Logout Mejorado

### Confirmación
```jsx
const handleLogout = () => {
  if (confirm('¿Cerrar sesión?')) {
    clearSession();
    navigate('/app');
  }
};
```

### Limpieza completa
```javascript
export const clearSession = () => {
  // localStorage
  ['token', 'nombreComercial', 'rol', 'actorId', 'puestoId'].forEach(k => 
    localStorage.removeItem(k)
  );
  
  // sessionStorage (si hay)
  sessionStorage.clear();
  
  // Eventos
  window.dispatchEvent(new Event('auth-change'));
};
```

## 8. Manejo de Sesión Expirada

### Interceptor
```javascript
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = '/app';
    }
    return Promise.reject(error);
  }
);
```

### Backend (pendiente)
- Implementar refresh token
- Endpoint `/auth/refresh`

## 9. Deep Linking

### Soportar URLs directas
```javascript
// En App.js
const rutaInicial = localStorage.getItem('token') 
  ? location.hash.slice(1) || '/dashboard' 
  : '/login';
```

## 10. Analytics (futuro)

### Métricas a trackear
- Landing → App conversion rate
- Time on page
- Role selection distribution
- Login success rate
- Drop-off points

```javascript
const trackEvent = (name, data) => {
  if (window.gtag) {
    window.gtag('event', name, data);
  }
};

// Uso
<a href="/app" onClick={() => trackEvent('cta_click', { location: 'hero' })}>
  Entrar a la App
</a>
```
