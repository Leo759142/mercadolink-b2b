# Entidades y Relaciones - Vendedores y Proveedores

## Diagrama de Entidades Actual

```
┌─────────┐         ┌──────────┐
│  Actor  │────────▶│  Puesto  │
│(id)    │         │(id)      │
│nombreComercial  │ │nombre    │
│email          │ │numero    │
│documento      │ │seccion   │
│rol: VENDEDOR  │ └──────────┘
│activo         │
└─────────┘

┌──────────┐         ┌───────────┐
│Producto  │────────▶│  Actor    │
│(id)      │         │(id)       │
│codigo    │         │(proveedor)│
│descripcion│        │rol: PROVEEDOR
│precio    │         └───────────┘
│activo    │
└──────────┘

┌──────────┐
│Proveedor │
│(id)      │
│razonSocial│
│ruc       │
│estado    │
│nombreContacto
│telefono  │
│email     │
│direccion │
│distrito  │
└──────────┘
```

## Análisis de Relación Actor ↔ Proveedor

### Estado Actual
- `Actor` tiene rol `PROVEEDOR`
- Tabla `proveedores` es independiente
- `Producto.proveedor` referencia `Actor` (no `Proveedor`)
- No hay vínculo directo entre `Actor` y `Proveedor`

### Propuesta de Unificación (Opcional)

```java
// Opción 1: Mantener separado (recomendado inicialmente)
// Proveedor sigue siendo entidad independiente
// Actor con rol PROVEEDOR puede existir sin registro en tabla proveedores

// Opción 2: Vincular (a evaluar)
@Entity
public class Proveedor {
    @OneToOne
    @JoinColumn(name = "actor_id")
    private Actor actor;  // Relación 1:1
    // ... resto campos
}
```

## Campos por Rol

### Actor - VENDEDOR
| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| id | ✔ | UUID |
| nombreComercial | ✔ | Nombre del puesto/negocio |
| email | ✔ | Login |
| documento | ✔ | DNI |
| passwordHash | ✔ | BCrypt |
| rol | ✔ | VENDEDOR |
| puesto | ✔ | Puesto asignado |
| activo | ✔ | Estado de cuenta |

### Actor - PROVEEDOR
| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| id | ✔ | UUID |
| nombreComercial | ✔ | Nombre comercial |
| email | ✔ | Login |
| documento | ✔ | RUC o DNI |
| passwordHash | ✔ | BCrypt |
| rol | ✔ | PROVEEDOR |
| activo | ✔ | Estado de cuenta |

### Proveedor (extensión)
| Campo | Requerido | Usado por |
|-------|-----------|-----------|
| razonSocial | ✔ | PROVEEDOR |
| ruc | ✔ | PROVEEDOR |
| estado | ✔ | ADMIN (gestión) |
| nombreContacto | ✖ | PROVEEDOR |
| telefono | ✖ | PROVEEDOR |
| email | ✖ | PROVEEDOR |
| direccion | ✖ | PROVEEDOR |
| distrito | ✖ | PROVEEDOR |

## Queries Comunes

### Pedidos por Puesto (VENDEDOR)
```java
// En PedidoRepository
@Query("SELECT p FROM Pedido p JOIN p.items i JOIN i.puesto pu WHERE pu.id = :puestoId")
List<Pedido> findByPuestoId(@Param("puestoId") String puestoId);
```

### Productos por Proveedor (PROVEEDOR)
```java
// En ProductoRepository (ya existe)
List<Producto> findByProveedorId(String proveedorId);
```

### Inventario por Puesto (VENDEDOR)
```java
// En InventarioRepository
List<Inventario> findByPuestoId(String puestoId);
```