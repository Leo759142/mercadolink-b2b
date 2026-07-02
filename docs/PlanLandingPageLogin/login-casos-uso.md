# Login - Mejoras y Casos de Uso

## 1. Flujo actual
- Usuario llega a `/login` dentro de `/app`.
- Elige quick login demo o ingresa email/password.
- `Login.js` envía POST a `/api/v1/auth/login`.
- Backend valida credenciales y retorna JWT.
- Frontend guarda token en `localStorage` y redirige al dashboard.

## 2. Casos de uso atendidos
1. Acceso rápido con credenciales demo.
2. Acceso por email/password real.
3. Redirección post-login a la ruta previa.

## 3. Mejoras sugeridas

### 3.1 Validaciones
- Validar formato email antes de enviar.
- Mostrar mensajes específicos por error.
- Evitar múltiples submits.

### 3.2 Estados
- Loading durante login.
- Error claro sin stack trace.
- Éxito con confirmación mínima.

### 3.3 Sesión
- Manejo de token expirado con redirect a login.
- Limpieza de storage al logout.
- Sincronización entre tabs.

### 3.4 Seguridad
- No loguear password en consola.
- Enviar credenciales solo por HTTPS.
- Sanitizar email antes de request.

## 4. Próximos pasos
- Añadir validación frontend.
- Añadir botón mostrar/ocultar password.
- Añadir recuperación de cuenta.
- Añadir soporte multi-idioma.
