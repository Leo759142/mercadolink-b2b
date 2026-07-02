# Mejoras UX Landing Page - Plan Detallado

## 1. Hero Section Mejorada

### Estructura actual
- Título: "MercadoLink B2B"
- Botón: "Entrar a la App"
- Carrusel de productos
- Grid de roles

### Propuesta de mejora
```html
<div class="hero-enhanced">
  <h1>MercadoLink B2B</h1>
  <p class="hero-subtitle">La plataforma comercial para el Mercado Popular Aspropa</p>
  
  <div class="cta-group">
    <a href="/app" class="btn btn-primary btn-lg">📱 Entrar a la App</a>
    <a href="#como-funciona" class="btn btn-secondary">ℹ️ Cómo funciona</a>
  </div>
  
  <div class="stats-mini">
    <div class="stat">
      <span class="stat-number" th:text="${productos.size()}">0</span>
      <span class="stat-label">Productos</span>
    </div>
    <div class="stat">
      <span class="stat-number" th:text="${proveedores.size()}">0</span>
      <span class="stat-label">Proveedores</span>
    </div>
    <div class="stat">
      <span class="stat-number">4</span>
      <span class="stat-label">Roles</span>
    </div>
  </div>
</div>
```

## 2. Beneficios con Iconos

### Adicionar sección
```html
<section class="benefits">
  <h2>¿Por qué MercadoLink?</h2>
  <div class="benefits-grid">
    <div class="benefit-card">
      <div class="benefit-icon">⚡</div>
      <h3>Pedidos rápidos</h3>
      <p>Crea pedidos en segundos desde el catálogo</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">📊</div>
      <h3>Control total</h3>
      <p>Inventario, precios y stock en tiempo real</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">🔒</div>
      <h3>Seguro</h3>
      <p>Acceso por roles con JWT y validación</p>
    </div>
    <div class="benefit-card">
      <div class="benefit-icon">🚚</div>
      <h3>Logística integrada</h3>
      <p>Seguimiento de envíos y recepciones</p>
    </div>
  </div>
</section>
```

## 3. Roles con Acciones Directas

### Mejora
- Cada tarjeta de rol debe tener un CTA hacia `/app` con prefill del rol
- Mostrar descripción corta de qué hace cada rol
- Iconos grandes y coloridos

```html
<div class="role-card" th:each="rol : ${roles}">
  <div class="role-icon" th:text="${rol.icono}">🏪</div>
  <h3 th:text="${rol.nombre}">Vendedor</h3>
  <p th:text="${rol.descripcion}">Gestiona tu puesto...</p>
  <a href="/app" class="btn btn-role" th:data-rol="${rol.key}">Acceder como ${rol.nombre}</a>
</div>
```

## 4. Carrusel Interactivo

### Features adicionales
- Auto-scroll cada 5s (pausable on hover)
- Indicadores de punto
- Cards con hover effect
- Botón "Ver más →" por producto

```javascript
let autoplay = setInterval(() => scrollCarousel(1), 5000);
carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
carousel.addEventListener('mouseleave', () => {
  autoplay = setInterval(() => scrollCarousel(1), 5000);
});
```

## 5. Footer Mejorado

```html
<footer class="landing-footer">
  <div class="footer-content">
    <div class="footer-section">
      <h4>MercadoLink B2B</h4>
      <p>Plataforma para Aspropa</p>
    </div>
    <div class="footer-section">
      <h4>Enlaces</h4>
      <a href="/app">App</a>
      <a href="/login">Login</a>
    </div>
    <div class="footer-section">
      <h4>Contacto</h4>
      <p>aspropa@mercado.pe</p>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© 2025 Aspropa - Todos los derechos reservados</p>
  </div>
</footer>
```

## 6. Login Mejorado

### Estados
- Loading: spinner con texto "Entrando..."
- Error: mensaje rojo con ícono
- Success: redirect inmediato

### Validaciones frontend
- Email regex antes de enviar
- Password mínimo 6 caracteres
- Campos requeridos con borde rojo si están vacíos

### Manejo de errores
```javascript
const handleError = (err) => {
  if (err.response?.status === 401) {
    setError('Credenciales incorrectas');
  } else if (err.response?.status === 0) {
    setError('No se pudo conectar al servidor');
  } else {
    setError(err.message || 'Error inesperado');
  }
};
```

## 7. Onboarding Post-Login

### Primer acceso
- Tooltip en Dashboard: "Bienvenido [nombre]"
- Guía de 3 pasos: Catálogo → Pedidos → Inventario
- Checkbox "No mostrar de nuevo"

### Implementación
```javascript
const esPrimerAcceso = !localStorage.getItem('onboarding-completado');
const [showOnboarding, setShowOnboarding] = useState(esPrimerAcceso);

const completarOnboarding = () => {
  localStorage.setItem('onboarding-completado', 'true');
  setShowOnboarding(false);
};
```

## 8. Accesibilidad

### Mejoras
- `htmlFor` en labels
- `alt` en SVGs
- Focus states visibles
- ARIA labels en botones de carrusel

## 9. Performance

### Optimizaciones
- CSS crítico inline
- Lazy load de componentes no esenciales
- Preconnect a API
- Service worker para offline (futuro)

## 10. A/B Testing Sugerencias

1. **CTA color**: Azul actual vs Verde
2. **Hero text**: Corto vs Extendido
3. **Carrusel vs Grid**: Horizontal vs Cuadrícula
4. **Quick login**: Con visibilidad de contraseña vs oculta
