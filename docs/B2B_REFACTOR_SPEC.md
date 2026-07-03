# 🚀 ESPECIFICACIÓN MERCADOLINK B2B - REFACTORIZACIÓN

## VISIÓN GENERAL
MercadoLink es una plataforma **B2B clara y simple** donde:
- **PROVEEDOR** crea catálogo de productos
- **VENDEDOR** gestiona stock en puestos
- **CLIENTE_MAYORISTA** compra en cantidad mínima (B2B)

## MATRIZ DE ROLES Y PERMISOS

### ADMINISTRADOR
- Acceso total a todo el sistema
- Gestionar usuarios, roles, configuración
- Aprobar nuevos proveedores/mayoristas

### PROVEEDOR
**¿Qué es?** Empresa que proporciona productos al catálogo

**Flujo:**
```
1. Registra/login
2. Crea productos (con descripción, precio, stock mínimo)
3. Espera a que VENDEDOR los compre para su puesto
4. Ve pedidos que incluyen sus productos
5. Surtimiento: Confirma que envía el producto
6. Genera guía de remisión
```

**Permisos:**
- ✅ Crear/editar/ver sus propios productos
- ✅ Ver pedidos que incluyen sus productos (estado general)
- ✅ Marcar productos como "surtido/enviado"
- ❌ Crear pedidos
- ❌ Ver inventario de otros
- ❌ Ver datos de cliente mayorista
- ❌ Cambiar estados de pedido

**Endpoints:**
```
GET  /api/v1/productos/propios
POST /api/v1/productos
PATCH /api/v1/productos/{id}
GET  /api/v1/pedidos/con-mis-productos
PATCH /api/v1/pedidos/{id}/items/{itemId}/surtir
```

---

### VENDEDOR
**¿Qué es?** Responsable de un PUESTO en el mercado

**Flujo:**
```
1. Registra/login (vinculado a su puesto)
2. Ve su inventario: qué tiene, cantidad, mínimos
3. Compra productos a proveedores (crea pedidos como comprador)
4. Recibe en su puesto
5. Confirma/rechaza pedidos de clientes mayoristas dirigidos a su puesto
6. Despacha desde su puesto
7. Marca como entregado
```

**Permisos:**
- ✅ Ver inventario de su puesto
- ✅ Actualizar stock (recepción, ajustes)
- ✅ Crear pedidos para comprar (como cliente B2B)
- ✅ Ver pedidos dirigidos a su puesto
- ✅ Confirmar/rechazar/despachar pedidos
- ❌ Ver inventario de otros puestos
- ❌ Ver datos de clientes
- ❌ Ver productos de otros proveedores (excepto en catálogo)

**Endpoints:**
```
GET  /api/v1/inventario/mi-puesto
PATCH /api/v1/inventario/mi-puesto/actualizar
GET  /api/v1/pedidos/mi-puesto
PATCH /api/v1/pedidos/{id}/confirmar
PATCH /api/v1/pedidos/{id}/rechazar
PATCH /api/v1/pedidos/{id}/despachar
```

---

### CLIENTE_MAYORISTA
**¿Qué es?** Cliente que compra en cantidad mínima (B2B)

**Flujo:**
```
1. Solicita acceso como mayorista (se espera aprobación)
2. Recibe aprobación
3. Ve catálogo de productos disponibles
4. Crea pedido: selecciona productos y cantidad
5. Paga (Culqi/Izipay)
6. Espera confirmación de vendedor
7. Espera despacho
8. Recibe y confirma
```

**Permisos:**
- ✅ Ver catálogo (solo productos con stock)
- ✅ Ver precios
- ✅ Crear pedidos
- ✅ Ver sus pedidos
- ✅ Pagar
- ✅ Confirmar recepción
- ❌ Ver datos de otros clientes
- ❌ Ver datos de vendedores/proveedores
- ❌ Cambiar precios
- ❌ Ver inventario

**Endpoints:**
```
POST /api/v1/mayoristas/registrar
GET  /api/v1/productos/catalogo
POST /api/v1/pedidos
GET  /api/v1/pedidos/mios
PATCH /api/v1/pedidos/{id}/confirmar-recepcion
```

---

## FLUJO DE COMPRA B2B - PASO A PASO

### ESCENARIO: Cliente mayorista compra arroz

```
┌─────────────────────────────────────────────────────────┐
│ CLIENTE MAYORISTA                                        │
│                                                          │
│ 1. Va a catálogo                                       │
│    GET /api/v1/productos/catalogo                     │
│    ↓                                                    │
│    [Arroz Integral 5kg | S/25 | Stock: 150]          │
│    [Azúcar 1kg | S/3 | Stock: 500]                   │
│                                                          │
│ 2. Crea pedido:                                        │
│    POST /api/v1/pedidos                               │
│    {                                                    │
│      "items": [                                         │
│        { "productoId": "prod-001", "cantidad": 50 },  │
│        { "productoId": "prod-002", "cantidad": 20 }   │
│      ]                                                  │
│    }                                                    │
│                                                          │
│ ⚠️  IMPORTANTE: NO especifica PUESTO                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND (PedidoService)                                 │
│                                                          │
│ 1. Valida cliente es CLIENTE_MAYORISTA                 │
│ 2. Para cada item:                                     │
│    a) Obtiene Producto(id=prod-001)                   │
│    b) Busca Inventario con stock:                      │
│       SELECT * FROM inventario                         │
│       WHERE producto_id = 'prod-001'                  │
│       AND cantidad_disponible >= 50                   │
│       ORDER BY cantidad_disponible DESC               │
│       LIMIT 1                                          │
│       → Encuentra Puesto A-01 con 150 unidades      │
│    c) Crea ItemPedido:                                │
│       ItemPedido {                                      │
│         pedido_id = nuevo-pedido                       │
│         producto_id = prod-001                         │
│         puesto_id = A-01  ← SISTEMA ELIGE            │
│         cantidad = 50                                  │
│         precio_unitario = 25                           │
│       }                                                 │
│    d) Reserva stock:                                   │
│       UPDATE inventario                                │
│       SET cantidad_reservada = cantidad_reservada + 50│
│       WHERE producto_id = 'prod-001'                  │
│       AND puesto_id = 'A-01'                          │
│ 3. Valida mínimos:                                    │
│    - Total unidades >= 10 ✓ (70 >= 10)               │
│    - Total monto >= S/50 ✓ (1250 + 60 = 1310)       │
│ 4. Estado → PENDIENTE_PAGO                            │
│ 5. Retorna: { pedidoId, total, items_con_puestos }   │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENTE MAYORISTA                                        │
│                                                          │
│ 3. Paga                                               │
│    POST /api/v1/pagos/culqi                           │
│    { pedidoId, token }                                │
│    → Backend cambia estado a PAGADO                   │
│    → CONFIRMA reservas (no libera)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ VENDEDOR (Puesto A-01)                                 │
│                                                          │
│ 1. Ve pedidos pendientes:                             │
│    GET /api/v1/pedidos/mi-puesto                      │
│    ↓                                                    │
│    [PedidoId-123 | Estado: PAGADO]                    │
│    Items:                                              │
│      - 50x Arroz Integral 5kg (PROVEEDOR-A)          │
│      - 20x Azúcar 1kg (PROVEEDOR-B)                  │
│                                                          │
│ 2. Confirma que puede despachar:                      │
│    PATCH /api/v1/pedidos/{id}/confirmar              │
│    → Estado → CONFIRMADO                             │
│                                                          │
│ 3. Genera guía de remisión                            │
│    Notifica a proveedores: "Surtir esto"             │
│                                                          │
│ 4. Surtidores (proveedores) confirman:               │
│    PATCH /api/v1/pedidos/{id}/items/{itemId}/surtir  │
│    → Item marca como SURTIDO                          │
│                                                          │
│ 5. Vendedor marca como enviado:                       │
│    PATCH /api/v1/pedidos/{id}/despachar              │
│    → Estado → EN_DESPACHO                             │
│    → Libera stock definitivamente                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ CLIENTE MAYORISTA (cuando recibe)                       │
│                                                          │
│ 1. Recibe mercancía                                    │
│ 2. Confirma recepción:                                │
│    PATCH /api/v1/pedidos/{id}/confirmar-recepcion    │
│    → Estado → ENTREGADO                              │
│    → Notifica satisfacción (score)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## CAMBIOS EN ENTIDADES (Base de Datos)

### ANTES (Confuso)
```
actores (tabla)
├── id, nombre_comercial, email, documento
├── rol (ENUM: VENDEDOR, PROVEEDOR, CLIENTE_MAYORISTA, ADMIN)
├── password_hash, activo
├── puesto_id (FK) ← Solo para VENDEDOR
└── ❌ Sin relación con tabla proveedores

proveedores (tabla fantasma)
├── id, razon_social, ruc, email, telefono
├── estado (EN_EVALUACION, ACTIVO, SUSPENDIDO)
├── nombre_contacto, direccion, distrito
└── ❌ Sin relación con actores

productos
├── id, codigo, descripcion, precio
├── proveedor_id (FK a Actor)
└── activo

items_pedido
├── id, pedido_id, producto_id
├── puesto_id (FK) ← Cliente debe especificar
├── cantidad, precio_unitario
```

### DESPUÉS (Claro)
```
actores (tabla)
├── id, nombre_comercial, email, documento
├── rol (ENUM)
├── password_hash, activo, fecha_registro
├── proveedor_id (FK, UNIQUE para PROVEEDOR) ← NUEVO VÍNCULO
└── puesto_id (FK, UNIQUE para VENDEDOR)

proveedores (tabla consolidada)
├── id, actor_id (FK, 1:1, UNIQUE) ← VÍNCULO CLARO
├── razon_social, ruc (UNIQUE)
├── email, telefono
├── direccion, distrito
├── estado (EN_EVALUACION, ACTIVO, SUSPENDIDO)
├── nombre_contacto
├── fecha_registro, fecha_aprobacion
├── aprobado_por (FK a admin)

productos
├── id, codigo, descripcion
├── proveedor_id (FK a proveedores) ← MÁS CLARO
├── precio, precio_mayorista (opcional)
├── stock_minimo, activo
├── fecha_creacion

items_pedido
├── id, pedido_id, producto_id
├── puesto_id (FK) ← SISTEMA ELIGE (no cliente)
├── cantidad, precio_unitario
├── estado_item (PENDIENTE, SURTIDO, ENTREGADO, RECHAZADO)
├── fecha_surtimento

inventario
├── id, producto_id (FK), puesto_id (FK)
├── cantidad_actual, cantidad_reservada, cantidad_minima
├── fecha_ultima_actualizacion
├── UNIQUE(producto_id, puesto_id)
```

---

## DOCUMENTACIÓN DE API (OpenAPI 3.0)

### CATÁLOGO (Público)
```
GET /api/v1/productos/catalogo
  Respuesta:
  {
    "items": [
      {
        "id": "prod-001",
        "nombre": "Arroz Integral 5kg",
        "proveedor": "Agrícola Santa",
        "precio": 25.00,
        "disponible": 150,
        "minimo_compra": 5,
        "imagen": "url"
      }
    ],
    "total": 150,
    "page": 1
  }
```

### CREAR PEDIDO (CLIENTE_MAYORISTA)
```
POST /api/v1/pedidos
  Requisitos:
  - Cliente debe tener rol CLIENTE_MAYORISTA
  - Cantidad total >= 10 unidades
  - Monto total >= S/50
  
  Request:
  {
    "items": [
      { "productoId": "prod-001", "cantidad": 50 },
      { "productoId": "prod-002", "cantidad": 20 }
    ]
  }
  
  Response:
  {
    "pedidoId": "ped-123",
    "estado": "PENDIENTE_PAGO",
    "items": [
      {
        "productoId": "prod-001",
        "puestoId": "A-01",  ← SISTEMA ELIGIÓ
        "cantidad": 50,
        "precioUnitario": 25,
        "subtotal": 1250
      }
    ],
    "monoTotal": 1310,
    "urlPago": "https://culqi.com/..."
  }
```

### VER PEDIDOS (VENDEDOR)
```
GET /api/v1/pedidos/mi-puesto
  Respuesta:
  {
    "items": [
      {
        "pedidoId": "ped-123",
        "estado": "PAGADO",
        "cliente": "Comercial XYZ",
        "monoTotal": 1310,
        "fechaPago": "2026-07-03",
        "items": [
          {
            "producto": "Arroz Integral 5kg",
            "proveedor": "Agrícola Santa",
            "cantidad": 50,
            "estado": "PENDIENTE"  ← Para este puesto
          }
        ]
      }
    ]
  }
```

---

## SEGURIDAD

### Validaciones Backend (CRÍTICAS)
- ✅ Siempre validar rol del usuario en backend
- ✅ Nunca confiar en JWT decodificado solo
- ✅ Verificar propiedad antes de acceso (Tu pedido, tu puesto, tu inventario)
- ✅ Registrar auditoría de cambios sensibles

### Validaciones Frontend
- ✅ Mostrar/ocultar UI según rol
- ✅ Proteger rutas con PrivateRoute + RoleRoute
- ⚠️ NO es suficiente - backend decide

---

## TESTING - CASOS CRÍTICOS

- [ ] PROVEEDOR no puede ver otros inventarios
- [ ] VENDEDOR puede comprar pero solo despacha su puesto
- [ ] CLIENTE no puede cambiar precios
- [ ] Pedido sin pago no se puede confirmar
- [ ] Stock se libera cuando se rechaza pedido
- [ ] Stock se decrementa cuando se despacha
