# Accesibilidad - Landing y Login

## 1. Pautas
- Todos los inputs tienen label asociado.
- Botones con texto o aria-label.
- Contraste >= 4.5:1 en texto normal.
- Estados de foco visibles.
- Jerarquía de headings respetada.

## 2. Mejoras landing
- Links accesibles para CTAs.
- Carrusel con controles accesibles por teclado.
- Secciones semánticas (`<section>`, `<h2>`).

## 3. Mejoras login
- Labels: "Email del negocio", "Contraseña".
- Botón submit con texto descriptivo.
- Errores asociados a campos via `aria-describedby`.
- Mensaje de error general con rol `alert`.

## 4. Próximos pasos
- Pruebas con lectores de pantalla.
- Test de contraste.
- Navegación por teclado completa.
