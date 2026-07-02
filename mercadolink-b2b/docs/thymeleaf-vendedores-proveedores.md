# Plan de Implementación: Interfaces Thymeleaf para Vendedores y Proveedores

## 1. Resumen Ejecutivo

Este documento propone la implementación de interfaces Thymeleaf amigables para los roles **VENDEDOR** y **PROVEEDOR** en el sistema MercadoLink B2B, integradas en la página de inicio del sistema.

## 2. Arquitectura Actual

### 2.1 Stack Tecnológico
- **Backend**: Spring Boot 3.3.4 + Thymeleaf
- **Base de datos**: H2 (en memoria para dev)
- **Seguridad**: JWT + Spring Security

### 2.2 Modelo de Roles

```
Actor (tabla: actores)
├── Roles: VENDEDOR, PROVEEDOR, CLIENTE_MAYORISTA, ADMINISTRADOR
├── Atributos: nombreComercial, email, documento, puesto (vendedores), rol, activo
└── Relaciones: pertenece a Puesto (solo vendedores)

Proveedor (tabla: proveedores)
├── Atributos: razonSocial, ruc, estado, nombreContacto, telefono, email, direccion, distrito
└── Estado: EN_EVALUACION, ACTIVO, SUSPENDIDO
```

### 2.2 Endpoint Activo Actual
- `/productos` - UI Thymeleaf con consumo API REST via JavaScript
- `/api/v1/*` - APIs REST actuales

## 3. Funcionalidades por Rol

### 3.1 VENDEDOR

**Funciones principales:**
- Gestión de pedidos (ver, aceptar, rechazar, despachar)
- Gestión de inventario por puesto
- Notificaciones de stock bajo

**Data necesaria:**
- Pedidos (filtrado por puesto)
- Productos del catálogo
- Inventario por puesto
- Puesto asignado

### 3.2 PROVEEDOR

**Funciones principales:**
- Gestión de productos propios
- Ver pedidos que incluyen sus productos
- Gestión de perfil de proveedor
- Recepciones de mercancía

**Data necesaria:**
- Productos publicados (filtrado por proveedor)
- Pedidos de proveedor
- Perfil de proveedor
- Categorías de proveedor

## 4. Cambios Propuestos

### 4.1 Nuevos Controllers UI

```java
// FrontendVendedorController.java
@Controller
@RequestMapping("/vendedor")
public class FrontendVendedorController {
    @GetMapping({"/", "/pedidos"})
    public String pedidos(Model model, Authentication auth) { ... }
    
    @GetMapping("/inventario")
    public String inventario(Model model, Authentication auth) { ... }
}

// FrontendProveedorController.java
@Controller
@RequestMapping("/proveedor")
public class FrontendProveedorController {
    @GetMapping({"/", "/productos"})
    public String productos(Model model, Authentication auth) { ... }
    
    @GetMapping("/pedidos")
    public String pedidos(Model model, Authentication auth) { ... }
    
    @GetMapping("/perfil")
    public String perfil(Model model, Authentication auth) { ... }
}
```

### 4.2 Templates Thymeleaf

| Archivo | Rol | Propósito |
|---------|-----|-----------|
| `vendedor/pedidos.html` | VENDEDOR | Lista de pedidos del puesto |
| `vendedor/inventario.html` | VENDEDOR | Gestión de stock |
| `proveedor/productos.html` | PROVEEDOR | Catálogo de productos propios |
| `proveedor/pedidos.html` | PROVEEDOR | Pedidos que incluyen sus productos |
| `proveedor/perfil.html` | PROVEEDOR | Edición de perfil proveedor |

### 4.3 Extensión de APIs (si necesario)

```java
// Agregar a ProductoController si no existen:
@GetMapping("/proveedor/mis-productos")  // Ya existe
@PreAuthorize("hasAnyRole('PROVEEDOR','ADMINISTRADOR')")

// Agregar InventarioController endpoints:
@GetMapping("/api/v1/inventario/puesto/{puestoId}")
@PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
```

## 5. Modelo de Datos Detallado

### 5.1 Entidades Involucradas

| Entidad | Uso VENDEDOR | Uso PROVEEDOR |
|---------|--------------|---------------|
| `Actor` | ✅ Principal (con puesto) | ✅ Principal |
| `Puesto` | ✅ Obligatorio | ❌ No requerido |
| `Pedido` | ✅ Lectura y cambio de estado | ✅ Sólo lectura |
| `Producto` | ✅ Lectura | ✅ CRUD limitado |
| `Inventario` | ✅ CRUD | ❌ Solo consulta |
| `Proveedor` | ❌ No directo | ✅ Perfil extendido |

### 5.2 Posibles Cambios en Base de Datos

**Opcional - Vendedor con datos extendidos:**
```sql
ALTER TABLE actores ADD COLUMN IF NOT EXISTS tipo_vendedor VARCHAR(30);
-- Valores: FIJO, VISITANTE, ENCARGADO
```

**Relación Actor-Proveedor (evaluar):**
Actualmente los productos tienen `proveedor` como `Actor`. La tabla `proveedores` es independiente.
- Opcional: vincular `Actor` con `Proveedor` cuando rol=PROVEEDOR

## 6. Wireframes de Interfaces (Amigables)

### 6.1 Dashboard Vendedor (`/vendedor/`)

```
┌─────────────────────────────────────────────────────────┐
│  🏪 MERCADOLINK B2B - Panel de Vendedor                  │
│  Bienvenido, Don Ramiro                                │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │📦 PEDIDOS  │  │📊 INVENTARIO│  │👤 PERFIL   │         │
│  │(3 nuevos)  │  │(2 alertas) │  │(Editar datos)│        │
│  └────────────┘  └────────────┘  └────────────┘         │
├─────────────────────────────────────────────────────────┤
│  📋 Pedidos recientes de Puesto A-12                    │
│  ┌───────────────────────────────────────────────────┐ │
│  | #Pedido | Cliente       | Total  | Estado    | Acción │
│  |--------|----------------|--------|-----------|------│
│  | P001   | Mayorista SAC  | S/180  | PENDIENTE | ✔ ✗  │
│  | P002   | Bodega SA      | S/240  | PAGADO    | Ver  │
│  | P003   | Distribuidora   | S/150  | CONFIRMADO│ Ver  │
│  └───────────────────────────────────────────────────┘
│                                                         │
│  ⚠️ Alertas de inventario:                               │
│  - Arroz: stock bajo (20 unidades, mínimo: 15)          │
│  - Azúcar: disponible (65 unidades)                      │
└─────────────────────────────────────────────────────────┘

[Ver todos los pedidos] [Actualizar stock]
```

### 6.2 Dashboard Proveedor (`/proveedor/`)

```
┌─────────────────────────────────────────────────────────┐
│  🚚 MERCADOLINK B2B - Panel de Proveedor               │
│  Bienvenido, Distribuidora Norte SAC                     │
├─────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │📦 PRODUCTOS│  │📋 PEDIDOS  │  │🏢 PERFIL   │         │
│  │(3 activos) │  │(5 nuevos)  │  │(Ver/Editar)│        │
│  └────────────┘  └────────────┘  └────────────┘         │
├─────────────────────────────────────────────────────────┤
│  📝 Mis productos publicados en el catálogo              │
│  ┌───────────────────────────────────────────────────┐ │
│  | SKU    | Producto        | Precio | Stock | Acción │
│  |--------|-----------------|--------|-------|--------│
│  | ARZ-001| Arroz 50kg      | S/180  | 100   | ✎ 🗑  │
│  | AZU-001| Azúcar 50kg      | S/160  | 80    | ✎ 🗑  │
│  | ACE-001| Aceite vegetal   | S/110  | 50    | ✎ 🗑  │
│  └───────────────────────────────────────────────────┘
│                                                         │
│  🛒 Pedidos con mis productos:                         │
│  - Pedido P001: 5 sacos de arroz                       │
│  - Pedido P003: 2 cajas de aceite                      │
└─────────────────────────────────────────────────────────┘

[+ Nuevo Producto] [Ver todos los pedidos]
```

### 6.3 Integración en Home Page (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  🏪 MERCADOLINK B2B                                     │
│  Interfaz ligera orientada a Spring Boot                 │
├─────────────────────────────────────────────────────────┤
│  👋 ¿Eres cliente nuevo?                               │
│  [ Registrarse como Vendedor ] [ Registrarse como Proveedor ]│
│                                                         │
│  🔑 ¿Ya tienes cuenta?                                 │
│  [ Iniciar sesión ]                                     │
├─────────────────────────────────────────────────────────┤
│  📊 Dashboard (después de login)                       │
│  Vendedor → [Ver pedidos, gestionar inventario]         │
│  Proveedor → [Mis productos, pedidos recibidos]         │
├─────────────────────────────────────────────────────────┤
│  Enlaces: Swagger UI | H2 Console | UI React (B2B)      │
└─────────────────────────────────────────────────────────┘
```

## 7. Checklist de Implementación

### Fase 1: Estructura Base
- [ ] Crear `FrontendVendedorController`
- [ ] Crear `FrontendProveedorController`
- [ ] Agregar layouts base con Thymeleaf Layout Dialect

### Fase 2: Vendedor
- [ ] Template: `vendedor/pedidos.html`
- [ ] Template: `vendedor/inventario.html`
- [ ] Agregar endpoints API: inventario por puesto
- [ ] Validar roles en templates

### Fase 3: Proveedor
- [ ] Template: `proveedor/productos.html`
- [ ] Template: `proveedor/pedidos.html`
- [ ] Template: `proveedor/perfil.html`
- [ ] Enlazar Actor con Proveedor (opcional)

### Fase 4: Seguridad
- [ ] Validar acceso por rol en controllers
- [ ] Agregar middleware de autorización UI

## 8. Consideraciones Técnicas

### 8.1 Autenticación
- Los templates deben validar sesión JWT activa
- Mostrar opciones según rol (`sec:authorize`)

### 8.2 Integración con API
- Usar `data-` attributes para inyectar URLs
- Reutilizar endpoints existentes cuando sea posible

### 8.3 Versionado
- Branch: `feature/thymeleaf-vendedores-proveedores`
- Commits atómicos por funcionalidad

## 9. Pruebas

### 9.1 Tests a Realizar
- [ ] Autenticación con roles VENDEDOR/PROVEEDOR
- [ ] Carga de datos en templates
- [ ] Operaciones CRUD desde UI
- [ ] Validación de permisos

## 10. Rollback

En caso de rollback, basta con eliminar:
- Controllers: `FrontendVendedorController`, `FrontendProveedorController`
- Templates: `/templates/vendedor/*.html`, `/templates/proveedor/*.html`
- No hay cambios estructurales en BD críticos