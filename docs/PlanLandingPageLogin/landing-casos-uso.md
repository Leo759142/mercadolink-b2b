# Landing Page - Mejoras y Casos de Uso

## 1. Estructura actual

### Secciones existentes
- Header con título y CTA principal.
- Productos destacados en carrusel horizontal.
- Roles explicados (Vendedor, Proveedor, Mayorista, Admin).
- Stats rápidas.

### Casos de uso atendidos
1. Visitante nuevo conoce el producto desde `/`.
2. Usuario accede directamente a la app desde `/app`.
3. Usuario ve productos antes de loguearse.
4. Usuario elige su rol demo rápido.

## 2. Mejoras sugeridas

### 2.1 Hero más conversor
- Título corto orientado al beneficio.
- Subtítulo con propuesta de valor clara.
- CTA visible sin scroll.
- Ejemplo: "Compra y vende en el mercado mayorista digital de Aspropa".

### 2.2 Social proof mínimo
- Stats actualizados: productos activos, proveedores activos, vendedores.
- Frase de confianza ejemplo: "Plataforma usada por actores del Mercado Popular".

### 2.3 Guía rápida por rol
- Cada tarjeta de rol muestra qué hace y un acceso rápido.
- Acciones sugeridas por rol:
  - Vendedor: revisar inventario, crear pedido
  - Proveedor: publicar producto, ver pedidos
  - Mayorista: explorar catálogo, hacer pedido
  - Admin: supervisar actores y reportes

### 2.4 Accesos rápidos contextuales
- Si hay token activo, CTA a `/dashboard` directo.
- Si no hay token, mantener acceso público a catálogo.

### 2.5 Sección de ayuda
- Link a guía o docs.
- Contacto rápido de soporte Aspropa.

## 3. Pautas de diseño
- Colores consistentes con la app: fondo oscuro, acentos claros.
- Tipografía legible, sin ruido innecesario.
- Espaciado generoso para escaneo rápido.
- Botones con estados hover/focus claros.

## 4. Próximos pasos
- Agregar tests de usabilidad básica.
- Definir métricas de conversión.
- Iterar copy según retroalimentación.
