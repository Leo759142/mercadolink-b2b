# 📋 REFACTORIZACIÓN MERCADOLINK B2B - PROGRESO Y PRÓXIMOS PASOS

## ✅ COMPLETADO

### Backend - Entidades
- ✅ **Actor.java**: Agregado campo `proveedor` con relación @OneToOne
- ✅ **Proveedor.java**: 
  - Agregado campo `actor` con relación @OneToOne
  - Agregados campos `fechaAprobacion` y `aprobadoPor` para auditoría
- ✅ **ItemPedido.java**:
  - Agregado enum `EstadoItem` (PENDIENTE, SURTIDO, ENTREGADO, RECHAZADO)
  - Agregado campo `estadoItem`
  - Agregado campo `fechaSurtimiento`
- ✅ **Compilación exitosa**
- ✅ **Migración SQL creada** (V001__refactor_actor_proveedor.sql)

---

## 🔄 EN PROGRESO

### Backend - Servicios (CRÍTICO)
**Objetivo**: Simplificar flujo de compra - Sistema elige puesto automáticamente

#### 1. **PedidoService.crearPedido()** - CAMBIOS REQUERIDOS
```java
ANTES:
  ItemPedidoRequest contiene: productoId, puestoId, cantidad
  → Cliente especifica PUESTO ❌ MALO

DESPUÉS:
  ItemPedidoRequest contiene: productoId, cantidad (sin puestoId)
  → Sistema busca puesto automáticamente ✅ BIEN
```

**Cambios específicos:**
- [ ] Eliminar campo `puestoId` de `ItemPedidoRequest`
- [ ] Crear método `InventarioService.buscarPuestoConStock(productoId, cantidad)`
- [ ] Refactorizar lógica para elegir puesto automáticamente
- [ ] Manejar caso: "No hay stock en ningún puesto"

#### 2. **InventarioService** - NUEVOS MÉTODOS
```java
// Buscar puesto con stock disponible para un producto
public Inventario buscarInventarioDisponible(String productoId, int cantidad)
    throws BusinessException

// Validar stock antes de crear pedido
public void validarStockDisponible(String productoId, int cantidad)
    throws BusinessException
```

#### 3. **Seguridad de Roles** - AJUSTES
```java
// Permitir solo CLIENTE_MAYORISTA crear pedidos B2B
// VENDEDOR puede crear pedidos solo si es para comprar stock (no para vender)
// Validar rol en backend siempre

CAMBIO:
- ❌ QUITAR: if (cliente.getRol() != Rol.CLIENTE_MAYORISTA && cliente.getRol() != Rol.VENDEDOR)
- ✅ HACER: if (cliente.getRol() != Rol.CLIENTE_MAYORISTA)
  // Excepto si es VENDEDOR comprando para su puesto (necesita flag especial)
```

---

## ⏳ PRÓXIMOS PASOS (Orden Recomendado)

### Fase 1: Backend - Servicios (CRÍTICO)
1. **Modificar ItemPedidoRequest**
   - Archivo: `src/main/java/pe/aspropa/mercadolink/dto/ItemPedidoRequest.java`
   - Cambio: Remover campo `puestoId`
   - Impacto: Afecta Controllers que usan este DTO

2. **Refactorizar PedidoService.crearPedido()**
   - Agregar lógica de búsqueda automática de puesto
   - Actualizar validaciones
   - Agregar logs

3. **Agregar métodos a InventarioService**
   - `buscarInventarioDisponible()`
   - `validarStockDisponible()`

4. **Actualizar Controllers**
   - `PedidoController.crearPedido()` - Documentar sin puestoId
   - Validar en backend que no venga puestoId

### Fase 2: Backend - Endpoints Nuevos
1. **GET /api/v1/productos/catalogo** 
   - Para CLIENTE_MAYORISTA ver solo productos disponibles
   
2. **POST /api/v1/mayoristas/registrar**
   - Solicitar acceso como mayorista
   
3. **GET /api/v1/pedidos/mi-puesto** (mejorado)
   - Para VENDEDOR ver pedidos de su puesto solo
   
4. **PATCH /api/v1/pedidos/{id}/items/{itemId}/surtir**
   - Para PROVEEDOR confirmar surtimiento

### Fase 3: Frontend - Componentes por Rol
1. **DashboardMayorista**
   - Catálogo simplificado (sin puestos)
   - Formulario: Producto + Cantidad (sin puesto)
   - Carrito de compra

2. **DashboardProveedor**
   - Ver productos propios
   - Ver pedidos que incluyen sus productos
   - Marcar como surtido

3. **DashboardVendedor**
   - Gestionar inventario del puesto
   - Ver/confirmar/rechazar pedidos
   - Despachar

### Fase 4: Testing
- [ ] Caso: CLIENTE_MAYORISTA crea pedido sin puesto ✓
- [ ] Caso: Sistema busca puesto con stock ✓
- [ ] Caso: No hay stock → rechaza ✓
- [ ] Caso: VENDEDOR no puede crear pedido B2B
- [ ] Caso: PROVEEDOR ve solo sus productos

---

## 📊 IMPACTO DE CAMBIOS

### DTOs Afectados
```
ItemPedidoRequest:
  - ANTES: { productoId, puestoId, cantidad }
  - DESPUÉS: { productoId, cantidad }
  - IMPACTO: Controllers, Frontend
```

### Servicios Afectados
```
PedidoService: Cambios en lógica de reserva
InventarioService: Nuevos métodos búsqueda
ActorService: Validaciones de rol
```

### Controllers Afectados
```
PedidoController.crearPedido()
ProductoController.listar() → necesita filtro por disponibilidad
```

### Tablas BD
```
actores: NUEVA COLUMNA proveedor_id
proveedores: NUEVAS COLUMNAS actor_id, fecha_aprobacion, aprobado_por
items_pedido: NUEVAS COLUMNAS estado_item, fecha_surtimiento
```

---

## 🎯 PRÓXIMA ACCIÓN INMEDIATA

**Modificar ItemPedidoRequest para remover puestoId** → Esto triggerea los cambios en cascada en:
- PedidoService
- PedidoController
- Frontend (NuevoPedidoModal.js)

¿Continuamos?
