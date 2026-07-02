# Endpoints API - Análisis para Thymeleaf Vendedores/Proveedores

## Endpoints Existentes (Reutilizables)

### Autenticación
| Método | Endpoint | Roles | Descripción | Usado por |
|--------|----------|-------|-------------|-----------|
| POST | `/api/v1/auth/registro` | Público | Registro de Actor | Ambas |
| POST | `/api/v1/auth/login` | Público | Login y obtención JWT | Ambas |

### VENDEDOR
| Método | Endpoint | Roles | Descripción | Estado |
|--------|----------|-------|-------------|--------|
| PATCH | `/api/v1/pedidos/{id}/estado` | VENDEDOR, ADMIN | Cambiar estado de pedidos | ✅ OK |

| Método | Endpoint | Roles | Descripción | Estado |
|--------|----------|-------|-------------|--------|
| GET | `/api/v1/puestos` | Público | Lista de puestos | ✅ OK |

**Pendiente:**
- GET `/api/v1/pedidos/puesto/{puestoId}` - Pedidos por puesto (no existe)
- GET `/api/v1/inventario/puesto/{puestoId}` - Inventario por puesto (no existe)

### PROVEEDOR
| Método | Endpoint | Roles | Descripción | Estado |
|--------|----------|-------|-------------|--------|
| GET | `/api/v1/productos` | Público | Lista todos los productos | ✅ OK |
| GET | `/api/v1/productos/mis-productos` | PROVEEDOR, ADMIN | Productos del proveedor | ✅ OK |
| POST | `/api/v1/productos` | PROVEEDOR, ADMIN | Crear producto | ✅ OK |
| PATCH | `/api/v1/productos/{id}/etiquetas` | PROVEEDOR, ADMIN | Actualizar etiquetas | ✅ OK |
| GET | `/api/v1/proveedores` | Público | Lista proveedores | ✅ OK |
| GET | `/api/v1/proveedores/{id}` | Público | Obtener proveedor | ✅ OK |
| POST | `/api/v1/proveedores` | ADMIN | Crear proveedor | ✅ OK |
| PUT | `/api/v1/proveedores/{id}` | ADMIN, PROVEEDOR | Actualizar proveedor | ✅ OK |

**Pendiente:**
- GET `/api/v1/pedidos/proveedor/mios` - Ya existe

## Propuesta de Nuevos Endpoints

### Inventario - VENDEDOR
```java
// InventoryController.java (si no existe)
@GetMapping("/api/v1/inventario/puesto/{puestoId}")
@PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
public List<Inventario> listarPorPuesto(@PathVariable String puestoId) {
    return inventarioRepository.findByPuestoId(puestoId);
}

@PatchMapping("/api/v1/inventario/{id}")
@PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
public Inventario actualizarStock(...) { ... }
```

### Pedidos - VENDEDOR
```java
// Agregar a PedidoController.java
@GetMapping("/api/v1/pedidos/puesto/{puestoId}")
@PreAuthorize("hasAnyRole('VENDEDOR','ADMINISTRADOR')")
public List<Pedido> listarPorPuesto(@PathVariable String puestoId) { ... }
```

## Notas de Implementación

1. **Thymeleaf + API REST**: La arquitectura actual usa JavaScript para consumir APIs
2. **Seguridad**: Los endpoints manejan autorización por rol vía `@PreAuthorize`
3. **Puesto en Actor**: Los vendedores tienen `puesto` asignado directamente en `Actor`