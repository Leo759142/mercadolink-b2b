# 🚀 GUÍA RÁPIDA - EJECUTAR Y PROBAR MERCADOLINK B2B REFACTORIZADO

---

## 1️⃣ COMPILAR Y EMPACAR

```bash
cd mercadolink-b2b

# Opción A: Maven (recomendado para dev)
mvn clean compile                    # Solo compilar
mvn clean package -DskipTests       # Crear JAR

# Opción B: Ejecutar directamente
mvn spring-boot:run
```

**Resultado esperado**:
```
[INFO] BUILD SUCCESS
[INFO] Started MercadolinkB2bApplication in 3.452 seconds
Application running on http://localhost:8080
```

---

## 2️⃣ VERIFICAR BACKEND ACTIVO

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

**Respuesta esperada**:
```json
{"status":"UP"}
```

### Listar endpoints
```bash
curl http://localhost:8080/actuator/mappings | grep -i pedido
```

---

## 3️⃣ PROBAR FLUJO B2B (SIN puestoId)

### ✅ ANTES: Crear pedido CON puestoId (VIEJO - ahora no)
```bash
# ❌ ESTO NO FUNCIONA YA (forma antigua)
curl -X POST http://localhost:8080/api/v1/pedidos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { 
        "productoId": "prod-001",
        "cantidad": 50,
        "puestoId": "A-01"    # ← ❌ REMOVIDO - Ya no existe
      }
    ]
  }'
```

### ✅ DESPUÉS: Crear pedido SIN puestoId (NUEVO - correcto)
```bash
# ✓ ESTO FUNCIONA (forma nueva B2B)
curl -X POST http://localhost:8080/api/v1/pedidos \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { 
        "productoId": "prod-001",
        "cantidad": 50
        # ↑ Sistema elige puesto automáticamente
      },
      { 
        "productoId": "prod-002",
        "cantidad": 20
      }
    ]
  }'
```

**Respuesta esperada** (éxito):
```json
{
  "id": "PED-20260703-001",
  "estado": "PENDIENTE_PAGO",
  "items": [
    {
      "productoId": "prod-001",
      "cantidad": 50,
      "puestoId": "A-01",          # ← Sistema lo eligió
      "estadoItem": "PENDIENTE",   # ← Nuevo campo
      "precioUnitario": 25.00,
      "subtotal": 1250.00
    }
  ],
  "total": 1250.00,
  "timestamp": "2026-07-03T10:15:00Z"
}
```

**Respuesta esperada** (error - sin stock):
```json
{
  "error": "STOCK_INSUFICIENTE",
  "mensaje": "No hay stock disponible para prod-001. Solicitado: 1000, Disponible: 500",
  "disponible": 500,
  "solicitado": 1000
}
```

---

## 4️⃣ VALIDAR CAMBIOS EN BASE DE DATOS

### Ver estructura Actor-Proveedor
```sql
-- Si tienes acceso a H2 console:
SELECT a.id, a.rol, p.razon_social, p.estado, p.aprobado_por 
FROM actores a 
LEFT JOIN proveedores p ON a.id = p.actor_id 
WHERE a.rol = 'PROVEEDOR';
```

### Ver items con nuevo tracking
```sql
SELECT * FROM items_pedido 
WHERE estado_item = 'PENDIENTE' OR estado_item = 'SURTIDO'
ORDER BY fecha_surtimiento DESC;
```

---

## 5️⃣ CASOS DE PRUEBA MANUALES

### 🧪 Test 1: Cliente mayorista compra sin puesto
**Pasos**:
1. Autenticar como `CLIENTE_MAYORISTA`
2. POST `/api/v1/pedidos` con items (SIN puestoId)
3. ✅ Sistema elige puesto automáticamente
4. ✅ Respuesta incluye `puestoId` elegido por backend

**Validación**:
- [ ] No hay error 400 por puestoId faltante
- [ ] Response incluye puestoId en items
- [ ] Stock se reserva correctamente
- [ ] Logs muestran qué puesto se eligió

---

### 🧪 Test 2: Stock insuficiente en un puesto
**Pasos**:
1. Crear pedido: producto con 100 unidades total (50+30+20 en 3 puestos)
2. Solicitar 60 unidades
3. ✅ Sistema rechaza (cada puesto individual < 60)

**Validación**:
- [ ] Retorna error apropiado
- [ ] Mensaje dice cantidad disponible
- [ ] Stock NO se reserva

---

### 🧪 Test 3: Proveedor ve sus pedidos
**Pasos**:
1. Autenticar como `PROVEEDOR`
2. GET `/api/v1/pedidos/con-mis-productos`
3. ✅ Ve solo pedidos con sus productos
4. PATCH `/api/v1/pedidos/PED-123/items/{itemId}/surtir`
5. ✅ Marca como SURTIDO, registra timestamp

**Validación**:
- [ ] Filtra correctamente por proveedor
- [ ] Estadoitem = SURTIDO
- [ ] fechaSurtimiento populated
- [ ] Vendedor ve cambio (puesto)

---

### 🧪 Test 4: Vendedor confirma despacho
**Pasos**:
1. Autenticar como `VENDEDOR`
2. GET `/api/v1/pedidos/mi-puesto/A-01`
3. ✅ Solo ve pedidos para puesto A-01
4. PATCH `/api/v1/pedidos/PED-123/items/{itemId}/entregar`
5. ✅ Marca como ENTREGADO

**Validación**:
- [ ] Solo ve pedidos de su puesto
- [ ] Puede cambiar estado
- [ ] Auditoría registra quién y cuándo

---

## 6️⃣ VERIFICAR LOGS (Debugging)

### Logs de InventarioService
```bash
# En terminal o logs/mercadolink.log
grep "buscarInventarioDisponible" mercadolink.log
grep "Eligiendo puesto:" mercadolink.log
```

**Esperado**:
```
[INFO] InventarioService: buscarInventarioDisponible("prod-001", 50)
[INFO] InventarioService: Eligiendo puesto: A-01 (disponible: 150)
[DEBUG] InventarioService: Otros puestos: A-02(80), A-03(12)
```

### Logs de transacciones
```bash
grep "Pedido creado:" mercadolink.log
grep "Stock reservado:" mercadolink.log
```

---

## 7️⃣ PROBAR CON INSOMNIA/POSTMAN

### Import Collection
1. Descargar [mercadolink-b2b.postman_collection.json](./postman-collection.json)
2. Crear ambiente: `localhost:8080`
3. Ejecutar tests en orden:
   - [ ] Health check
   - [ ] Login (obtener token)
   - [ ] Crear producto (PROVEEDOR)
   - [ ] **Crear pedido SIN puestoId** ← NUEVO
   - [ ] Ver pedidos (VENDEDOR)
   - [ ] Confirmar surtimiento
   - [ ] Marcar entregado

---

## 8️⃣ PROBLEMAS COMUNES

### Error: "Method not found: findByProductoId"
**Causa**: InventarioRepository.java sin método nuevo  
**Solución**: Asegúrate que compiled con última versión
```bash
mvn clean compile -U   # Force update
```

### Error: "puestoId not recognized"
**Causa**: Cliente enviando DTO viejo con puestoId  
**Solución**: Usar nuevo ItemPedidoRequest sin puestoId
```json
// ❌ VIEJO
{ "productoId": "...", "cantidad": 50, "puestoId": "A-01" }

// ✅ NUEVO
{ "productoId": "...", "cantidad": 50 }
```

### Error: "No hay stock en ningún puesto"
**Causa**: Stock insuficiente en TODOS los puestos  
**Solución**: Revisar inventarios, crear más stock, o reducir cantidad

---

## 9️⃣ CHECKLIST FINAL

- [ ] Backend compila sin errores
- [ ] JAR generado exitosamente
- [ ] Servidor inicia en puerto 8080
- [ ] Health check retorna UP
- [ ] Puedo crear pedido SIN puestoId
- [ ] Sistema elige puesto automáticamente
- [ ] Respuesta incluye puestoId elegido
- [ ] Logs muestran selección de puesto
- [ ] Items tienen estado (PENDIENTE/SURTIDO/ENTREGADO)
- [ ] Migraciones SQL listas
- [ ] Documentación actualizada ✓

---

## 🎯 PRÓXIMO: FRONTEND

Cuando estés listo:
1. Remover componentes con `puestoId`
2. Crear `DashboardMayorista` (sin puestos)
3. Crear `DashboardProveedor` + `DashboardVendedor`
4. Testing E2E

**Ver**: [REFACTOR_RESUMEN_FINAL.md](REFACTOR_RESUMEN_FINAL.md) para detalles

---

**¿Listo? ¡Ejecuta: `mvn spring-boot:run`!** 🚀
