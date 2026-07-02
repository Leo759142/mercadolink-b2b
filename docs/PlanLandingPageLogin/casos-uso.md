# Plan Landing y Login — Mejores Casos de Uso

## Objetivo
Transformar la landing actual en un gateway efectivo hacia la app, y el login en una puerta de acceso confiable, rápida y contextual.

## Casos de uso deseados

### 1. Landing como vendedor de valor
- Visitante entra a `/` y entiende en 5 segundos qué hace MercadoLink.
- Ve productos reales en el carrusel.
- Click en "Entrar a la App" y aterriza en login sin fricción.

### 2. Selección rápida de demo por rol
- Landing muestra los 4 roles con íconos.
- Click en un rol → prefill email/password en login.
- Login hace submit automático y va a dashboard.

### 3. Login resiliente
- Intento fallido -> mensaje claro sin stack trace.
- Sesión expirada -> limpiar datos, redirigir a login.
- 401/400/404/5xx -> handling diferenciado.

### 4. Onboarding post-login
- Primera vez -> Dashboard con tooltips.
- Segundo login -> flujo directo.

### 5. Navegación contextual
- Si ya tengo token abriendo `/app`, ir directo a dashboard.
- Si no, mostrar login.

## Mejores prácticas sugeridas

- No pedir creación de cuenta en la landing.
- Mostrar solo acciones que generan valor inmediato.
- CTA único y visible.
- Credenciales demo visibles pero copiables.
- Logout siempre accesible desde AppShell.
