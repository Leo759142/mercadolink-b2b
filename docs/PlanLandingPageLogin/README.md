# Plan de Mejoras UX — Landing Page + Login

## Estado actual
- Landing en `/index.html` (Thymeleaf) sirve como puerta de acceso y carrusel de productos.
- Login React en `/login` (ruta dentro de `/app`).
- Spring Boot sirve landing directa + SPA React bajo `/app/**`.

Hallazgos previos:
- Landing no convierte a app con claridad.
- Login no muestra valor ni contexto de rol.
- Falta transición visual entre landing y app.
- Sin feedback post-login ni manejo de sesiones expiradas.
- No hay branding ni social proof mínimo.

## 1. Mejoras Landing Page (`index.html`)

### 1.1 Hero con CTA principal
- Headline claro: "El mercado mayorista digital para Aspropa"
- Subheadline con propuesta de valor: pedidos, inventario, logística en un solo lugar.
- CTA primario: "Entrar a la App" con enlace directo a `/app`.
- CTA secundario: "Ver catálogo público" → carrusel o tabla ligera.

### 1.2 Sección de beneficios (íconos + texto corto)
| Beneficio | Texto |
|-----------|-------|
| Pedidos rápidos | "Compra por catálogo con entrega coordinada" |
| Sin papel | "Control digital de pedidos e inventario" |
| Multi-rol | "Acceso para vendedores, proveedores y mayoristas" |
| Seguro | "Acceso protegido por JWT y validación por rol" |

### 1.3 Stats sociales (si hay datos)
- Cantidad de productos activos.
- Cantidad de proveedores registrados.
- Pedidos procesados (demo o real).

### 1.4 Carrusel de productos destacados (ya existe)
- Mostrar SKU, precio, proveedor, categoría.
- Botón "Solicitar" directo al login.

### 1.5 Sección de roles (ayuda al usuario a elegir demo)
| Rol | Icono | Acción |
|-----|-------|--------|
| Vendedor | 🏪 | Ir a login con rol vendedor |
| Proveedor | 🚚 | Ir a login con rol proveedor |
| Mayorista | 🛒 | Ir a login con rol mayorista |
| Admin | 🛡️ | Ir a login con rol admin |

### 1.6 Footer
- Versión del sistema.
- Enlace a docs API.
- Contacto Aspropa (placeholder).

## 2. Mejoras Login React

### 2.1 Estado del arte actual
- Login existe y funciona con JWT.
- Tiene quick login por roles.
- Falta: feedback de éxito, estados de carga visibles, manejo de sesión expirada, branding Aspropa.

### 2.2 Mejoras propuestas

#### A. Recordatorio de contraseña demo
- Mostrar credenciales demo de forma visible (ya lo hace).
- Botón copiar al portapapeles por seguridad (opcional).

#### B. Recordarme /persistencia
- Persistir token en `localStorage` (ya está).
- Verificar expiración y renovar si aplica (Pendiente backend).

#### C. Redirección post-login contextual
- Si el token expira, redirigir a login con mensaje.
- Mostrar nombre y rol después de login (ya está en AppShell).
- Mantener ubicación previa con `location.state?.from` (ya está).

#### D. Control de errores
- 401 → sesión expirada → limpiar storage y redirigir a login.
- 400/404 → mensaje amistoso, sin crashear.
- 5xx → "Servicio ocupado, intenta en 1 minuto".

#### E. Onboarding (solo primera vez)
- Mostrar mini-guía por pasos (dashboard, primer pedido) para usuarios nuevos.

## 3. Mejoras de Navegación y Transición

### 3.1 Transición landing → app
- Botón landing → `/app` (SPA).
- Si ya hay sesión activa, ir directo a dashboard.
- Si no, mostrar login React.

### 3.2 Skeleton y loading
- Landing no bloqueante (renderiza rápido).
- Login muestra spinner durante autenticación.
- AppShell mantiene reloj y sesión activa.

## 4. Seguridad y Robustez

### 4.1 Login seguro
- No mostrar passwords en consola.
- Sanitizar inputs (email y password).
- Validar email con regex simple antes de enviar.
- Rate limiting en backend (pendiente, sugerir Throttling).

### 4.2 Manejo de sesión
- Logout limpia storage y redirige a `/app` (loading de login).
- Si el token es inválido en AppShell, limpiar sesión y navegar a `/login`.

## 5. Accesibilidad (básica)

- Labels en inputs (`htmlFor`, `id`).
- Focus visible en botones.
- Contraste suficiente en landing y login.
- Navegación por teclado (no `onclick` en divs sin handler).

## 6. Plan de Implementación Rápida

### Fase 1 — Landing mejorada
1. Actualizar `index.html` con hero, beneficios, stats, roles clickeables.
2. Botón "Entrar a la App" prominente.
3. Carrusel con cards clickeables (ir al login con prefilled context).

### Fase 2 — Login pulido
1. Estados de carga y error claros.
2. Validación de email formato.
3. Manejo de 401 con redirect y limpieza.
4. Onboarding mínimo en Dashboard post-login.

### Fase 3 — Transición suave
1. Redirección inteligente `/app` → dashboard o login.
2. Skeleton en AppShell mientras carga sesión.
3. Logout con confirmación simple.

## 7. Métricas de Éxito
- Tiempo de carga landing < 2s.
- Tasa de conversión landing → login > 60%.
- Tasa de éxito de login > 95%.
- Errores 500/401 < 1% del total.

## 8. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Crash en landing por datos vacíos | usar `th:if` y fallbacks |
| Login infinito loading | timeout en authAPI + cancelación |
| Token expirado sin feedback | interceptor 401 en apiClient |
| UX confusa post-logout | redirigir a landing `/` en vez de `/login` |
