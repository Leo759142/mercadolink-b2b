# Plan de Mejoras UX Landing + Login

## 1. Objetivo
Crear una experiencia de entrada clara, confiable y útil para los usuarios de MercadoLink B2B, reduciendo fricción entre la landing y el primer uso real.

## 2. Problemas detectados y soluciones

| Problema | Solución propuesta |
|---------|-------------------|
| Landing con poca información | Agregar hero, stats, beneficios, roles explicados |
| Login dentro de la ruta `/app` mezclado | Rutas públicas y privadas separadas con `PublicRoute` |
| Sin redirección contextual post-login | Guardar `from` en state y redirigir ahí |
| Sin feedback visual en errores | Estados claros de loading y mensajes específicos |
| Carrusel de productos sin contexto | Cards con proveedor, categoría y precio visible |
| No hay valor explicado para nuevos visitantes | Sección de beneficios + roles accesibles |
| Landing y login sin marca fuerte | Tipografía, íconos, colores y copy orientados a Aspropa |

## 3. Cambios aplicados

### 3.1 Landing
- Hero con título, subtítulo y CTA principal.
- Stats rápidas: productos, proveedores, roles.
- Sección de beneficios con íconos.
- Sección de roles vendedor/proveedor/mayorista/admin.
- Carrusel mejorado de productos destacados.
- Botón principal `Entrar a la App` hacia `/app`.

### 3.2 Routing React
- `/` y `/login` ahora usan `PublicRoute`.
- Si el usuario ya tiene sesión, `/login` redirige automáticamente a `/dashboard`.
- Ruta comodín `*` redirige a `/dashboard` en vez de `/`.

### 3.3 Login
- Mantiene quick login por demo users.
- Loading state durante autenticación.
- Manejo básico de errores sin crash.

## 4. Próximas mejoras sugeridas

### 4.1 Onboarding
- Tooltip inicial en dashboard explicando módulos.
- Revisitación paso a paso para primer pedido.

### 4.2 Microinteracciones
- Animaciones suaves en cards.
- Transiciones entre páginas.
- Skeleton screens en AppShell.

### 4.3 Accesibilidad
- Labels en inputs.
- Focus states visibles.
- Textos alternativos en íconos.

### 4.4 Performance
- Lazy load de componentes no críticos.
- Preload de fuentes y assets del app shell.

## 5. Métricas a medir
- Tasa de conversión landing → login
- Tiempo hasta primer pedido
- Errores 401/403/5xx por sesión
- Cantidad de usuarios por rol
