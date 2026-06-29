# MercadoLink B2B — Spring Boot

Backend B2B para la **Asociación de Comerciantes del Mercado Popular Aspropa** (proyecto SOA, Avance 1 del informe entregado). Una sola aplicación Spring Boot self-contained que expone una API REST, persiste en H2 local y integra Izipay como pasarela de pagos.

> Stack: Java 17 · Spring Boot 3.3 · Spring Security · Spring Data JPA · H2 · JWT (jjwt) · OpenAPI/Swagger UI · `@Async`

---

## 1. Cómo correrlo

```bash
# Compilar y ejecutar tests
mvn clean package

# Arrancar
java -jar target/mercadolink-b2b.jar
```

> Nota: este repositorio no incluye `mvnw`; ejecuta los comandos desde el directorio que contiene `pom.xml`.

Si prefiere ysted un modo temporal en memoria para pruebas rápidas, sobrescribe la URL de la datasource:

```bash
SPRING_DATASOURCE_URL=jdbc:h2:mem:mercadolink mvn clean package
```

Una vez levantado:

| Recurso      | URL                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Swagger UI   | http://localhost:8080/swagger-ui.html                                                                 |
| OpenAPI JSON | http://localhost:8080/v3/api-docs                                                                     |
| H2 Console   | http://localhost:8080/h2-console (JDBC:`jdbc:h2:file:./data/mercadolink`, user `sa`, pass vacío) |
| Health       | http://localhost:8080/actuator/health                                                                 |

### Usuarios precargados

`DataInitializer` siembra 4 actores (uno por rol) y un puesto con 3 productos al primer arranque. La contraseña de todos es `password123`.

| Email                    | Rol                                    |
| ------------------------ | -------------------------------------- |
| `admin@aspropa.pe`     | `ADMINISTRADOR`                      |
| `proveedor@aspropa.pe` | `PROVEEDOR`                          |
| `vendedor@aspropa.pe`  | `VENDEDOR` (asignado al puesto demo) |
| `cliente@aspropa.pe`   | `CLIENTE_MAYORISTA`                  |

---

## 2. Roles y restricciones (RBAC)

Los 4 roles del Avance 1 (sección 3.1.2) se aplican como authorities Spring Security (`ROLE_*`) y se enforzan con `@PreAuthorize` por endpoint.

| Rol                         | Capacidades clave                                                            |
| --------------------------- | ---------------------------------------------------------------------------- |
| **VENDEDOR**          | Actualizar inventario propio, confirmar pedidos, generar reportes del puesto |
| **PROVEEDOR**         | Publicar catálogo, actualizar precios B2B, recibir órdenes                 |
| **CLIENTE_MAYORISTA** | Crear pedidos B2B multi-puesto, pagar con Izipay, consultar pedidos          |
| **ADMINISTRADOR**     | Todas las anteriores + auditoría, resolver disputas, gobernanza             |

---

## 3. Endpoints principales

> Todos los endpoints (excepto login, register, webhook Izipay, swagger y h2-console) requieren `Authorization: Bearer <token>`.

### Auth

| Método  | Ruta                      | Descripción                    |
| -------- | ------------------------- | ------------------------------- |
| `POST` | `/api/v1/auth/login`    | Login con email/password → JWT |
| `POST` | `/api/v1/auth/register` | Registro de actor               |

### Catálogo

| Método  | Ruta                  | Roles                            |
| -------- | --------------------- | -------------------------------- |
| `GET`  | `/api/v1/productos` | autenticado                      |
| `POST` | `/api/v1/productos` | `PROVEEDOR`, `ADMINISTRADOR` |

### Inventario

| Método | Ruta                                                  | Roles                           |
| ------- | ----------------------------------------------------- | ------------------------------- |
| `GET` | `/api/v1/inventario/puesto/{puestoId}`              | autenticado                     |
| `PUT` | `/api/v1/inventario/{productoId}/puesto/{puestoId}` | `VENDEDOR`, `ADMINISTRADOR` |

### Pedidos

| Método   | Ruta                            | Roles                                          | Notas                            |
| --------- | ------------------------------- | ---------------------------------------------- | -------------------------------- |
| `POST`  | `/api/v1/pedidos`             | `CLIENTE_MAYORISTA`, `VENDEDOR`, `ADMIN` | Acepta header`Idempotency-Key` |
| `GET`   | `/api/v1/pedidos/{id}`        | autenticado                                    |                                  |
| `GET`   | `/api/v1/pedidos/mios`        | autenticado                                    |                                  |
| `PATCH` | `/api/v1/pedidos/{id}/estado` | `VENDEDOR`, `ADMIN`                        | Transiciones controladas         |

### Pagos (Izipay)

| Método  | Ruta                                 | Roles                                       |
| -------- | ------------------------------------ | ------------------------------------------- |
| `POST` | `/api/v1/pagos/iniciar/{pedidoId}` | autenticado                                 |
| `GET`  | `/api/v1/pagos/{orderId}`          | autenticado                                 |
| `POST` | `/api/v1/izipay/webhook`           | **público** (IPN, valida firma HMAC) |
| `POST` | `/api/v1/izipay/firmar`            | **sandbox** (helper para tests)       |

---

## 4. Flujo de prueba end-to-end (curl)

> Pre-requisito: `jq` para extraer el token (`sudo apt install jq`).

### a) Login como cliente mayorista

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@aspropa.pe","password":"password123"}' | jq -r .token)
echo $TOKEN
```

### b) Listar productos y obtener IDs

```bash
curl -s http://localhost:8080/api/v1/productos -H "Authorization: Bearer $TOKEN" | jq
```

Anota un `productoId` (p.ej. del arroz) y el `puestoId` (lo verás en los logs al arrancar la app, o consultando `GET /api/v1/inventario/puesto/...`).

### c) Crear pedido B2B (con idempotencia)

```bash
curl -s -X POST http://localhost:8080/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "items": [
      {"productoId":"<ID_ARROZ>","puestoId":"<ID_PUESTO>","cantidad":10}
    ],
    "observaciones": "Pedido de prueba"
  }' | jq
```

Captura el `id` del pedido.

### d) Iniciar pago

```bash
curl -s -X POST http://localhost:8080/api/v1/pagos/iniciar/<PEDIDO_ID> \
  -H "Authorization: Bearer $TOKEN" | jq
```

Recibirás `orderId`, `formToken` y `publicKey`. En producción el frontend usaría el `formToken` para abrir el formulario de Izipay; en sandbox simulamos el callback.

### e) Simular el IPN/Webhook de Izipay

**1.** Generar la firma HMAC con el helper de sandbox:

```bash
SIG=$(curl -s -X POST http://localhost:8080/api/v1/izipay/firmar \
  -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>","transactionId":"TX-001","status":"APROBADO","amount":"1800.00"}' \
  | jq -r .signature)
```

**2.** Enviar el webhook como lo haría Izipay:

```bash
curl -s -X POST http://localhost:8080/api/v1/izipay/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\":\"<ORDER_ID>\",
    \"transactionId\":\"TX-001\",
    \"status\":\"APROBADO\",
    \"amount\":\"1800.00\",
    \"signature\":\"$SIG\"
  }"
```

La respuesta es `202 Accepted` inmediato; el procesamiento es asíncrono. Consulta el estado:

```bash
curl -s http://localhost:8080/api/v1/pagos/<ORDER_ID> \
  -H "Authorization: Bearer $TOKEN" | jq
```

Debe pasar a `APROBADO` y el pedido a `PAGADO`.

---

## 5. Decisiones de diseño

### Asincronía

- `@EnableAsync` + pool dedicado (`AsyncConfig`).
- **Webhook de Izipay**: `PagoService.procesarWebhookAsync` devuelve `CompletableFuture<Void>`. El controlador responde 202 al instante; el commit del saga ocurre en background.
- **Auditoría** y **notificaciones**: `AuditoriaService` y `NotificacionService` corren en el pool async para no impactar la latencia del request principal.

### Saga compensatoria (sección 3.4.4 del PDF)

`PedidoService` orquesta:

1. `InventarioService.reservar(...)` por cada ítem (incrementa `cantidadReservada` con optimistic lock `@Version`).
2. Si el pago es **APROBADO**, `InventarioService.confirmarReserva(...)` baja la reserva y descuenta el stock real.
3. Si es **RECHAZADO**, `InventarioService.liberarReserva(...)` revierte la reserva.

Esto materializa el patrón de la sección 3.4.4 (Manejo de transacciones distribuidas).

### Idempotencia

- Header `Idempotency-Key` en `POST /pedidos`: si la clave ya existe, devuelve el pedido previo en vez de crear duplicados. Implementa la regla EX-INV-004 del PDF.
- `Pago.orderId` con `UNIQUE`. Los webhooks duplicados se ignoran si el pago ya está `APROBADO`/`RECHAZADO`.

### Seguridad

- BCrypt para passwords.
- JWT firmado con HMAC-SHA256, 60 min de expiración, claims `sub`, `email`, `rol`.
- Filtro `JwtAuthFilter` poblando el `SecurityContext` con un `AuthenticatedActor` ligero.
- HMAC-SHA256 sobre `orderId|transactionId|status|amount` para validar webhooks Izipay (sección 3.3.2 — Aspectos transversales).
- RBAC con `@PreAuthorize("hasAnyRole(...)")` en cada endpoint sensible.

### Errores (sección 3.2.3 y 3.4.5)

`BusinessException` lleva código estable (`INV-001`, `PED-001`, `EX-AUTH-002`, …). `GlobalExceptionHandler` los convierte a `ApiError` con la forma de **RFC 9457 Problem Details**.

---

## 7. Estructura del proyecto

El código está organizado en paquetes por capa:

```
pe.aspropa.mercadolink/
├── MercadolinkApplication.java    # Bootstrap de Spring Boot
├── config/                        # Configuration classes de Spring
│   ├── AsyncConfig.java           # ThreadPoolTaskExecutor dedicado
│   ├── CorsConfig.java          # CORS para frontend React
│   ├── DataInitializer.java       # Seeding de datos demo
│   ├── OpenApiConfig.java        # Configuración Swagger
│   ├── SpaWebConfig.java         # Servir archivos estáticos
│   └── SecurityConfig.java        # Seguridad JWT + RBAC
├── controller/                    # REST Controllers
├── domain/                        # Entidades JPA
│   ├── Actor.java, Puesto.java, Producto.java
│   ├── Pedido.java, ItemPedido.java
│   ├── Inventario.java, Pago.java
│   └── enums: Rol, EstadoPedido, EstadoPago
├── dto/                           # DTOs de request/response
├── exception/                     # Manejo de errores
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
├── repository/                      # Spring Data JPA
├── security/                      # JWT Authentication
│   ├── JwtUtil.java
│   ├── JwtAuthFilter.java
│   └── AuthenticatedActor.java
└── service/                       # Lógica de negocio
    ├── AuthService.java, ActorService.java
    ├── PedidoService.java, InventarioService.java
    ├── PagoService.java, IzipayService.java
    ├── AuditoriaService.java, NotificacionService.java
```

> Ver la [tabla CRC completa](./docs/CRC.md) para detalles de responsabilidades por módulo.

---

## 8. Despliegue rápido

### 8.1 Entorno local (desarrollo)

#### Opción A: Perfil `dev` con H2 en memoria (recomendado)

El perfil `dev` configura H2 en memoria, lo que elimina problemas de locks de archivo y permite pruebas rápidas con datos frescos al iniciar.

```bash
# Compilar y ejecutar con el perfil dev
mvn clean package -DskipTests
java -Dspring.profiles.active=dev -jar target/mercadolink-b2b.jar
```

#### Opción B: Base de datos persistente en archivo

Los datos se mantienen entre reinicios. Útil para entornos con datos estables.

```bash
java -jar target/mercadolink-b2b.jar
```

Si aparece el error "database locked", detén procesos Java y elimina los archivos `mercadolink.mv.db` y `mercadolink.trace.db` en `./data/`.

### 8.2 Docker

```bash
# Construir y ejecutar con volumen persistente
docker build -t mercadolink-b2b:1.0 .
docker run -d --name mercadolink -p 8080:8080 -v mercadolink-data:/data mercadolink-b2b:1.0
```

### 8.3 Variables de entorno (producción)

| Variable                    | Valor por defecto                   | Descripción                        |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| `SPRING_PROFILES_ACTIVE`  | —                                  | Usar`dev` para H2 en memoria      |
| `SPRING_DATASOURCE_URL`   | `jdbc:h2:file:./data/mercadolink` | Cambiar a PostgreSQL en producción |
| `APP_JWT_SECRET`          | Aleatorio                           | **Cambiar en producción**    |
| `APP_IZIPAY_SANDBOX_MODE` | `true`                            | `false` con credenciales reales   |

---

## 9. Frontend React (SPA)

El directorio `ui-react/` contiene una aplicación React 18 que consume la API REST del backend.

- Autenticación con JWT (login/register)
- Navegación con React Router v6
- Cliente Axios con interceptor automático para token
- Proxy a `http://localhost:8080` en desarrollo

**Construcción:**

```bash
cd ui-react
npm install
npm run build  # Los archivos se integra automáticamente en el JAR
```

---

## 10. Mapeo de requisitos PDF vs. implementación

| Requisito                      | Implementación                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| 3.1.2 Roles RBAC               | `Rol` + `SecurityConfig` + `@PreAuthorize`                                        |
| 3.1.4 Idempotencia             | `Pedido.idempotencyKey`, `Pago.orderId` únicos                                     |
| 3.2.1 REST + JSON              | Todos los controllers bajo`/api/v1`                                                   |
| 3.2.3 Excepciones              | `BusinessException` + `GlobalExceptionHandler` (RFC 9457)                           |
| 3.2.4 Validaciones             | Bean Validation + reglas de negocio                                                     |
| 3.3.2 Estados                  | Enums`EstadoPedido`/`EstadoPago` con transiciones controladas                       |
| 3.3.2 Izipay                   | `IzipayService` + `IzipayWebhookController` (formToken, IPN, HMAC)                  |
| 3.3.4 Aspectos transversales   | `AsyncConfig`, `AuditoriaService`, `NotificacionService`                          |
| 3.4.1–3.4.3 Reglas de negocio | `PedidoService` (mín. 10 unidades / S/50), `InventarioService` (stock ≥ cantidad) |
| 3.4.4 Sagas compensatorias     | Reserva → commit/rollback en`PagoService.procesarWebhook`                            |
| 3.5 Modelo de datos            | Entidades JPA con`@Version`, FKs, optimism locking                                    |
| 5.1–5.4 Seguridad             | BCrypt, JWT HS256, validación de entrada                                               |
| Frontend SPA                   | React 18 + React Router v6 + Axios (`ui-react/`)                                      |

---

## 11. Troubleshooting

**"Database locked"**: Otro proceso Java mantiene el archivo H2 abierto. Detén procesos y elimina los archivos `.mv.db` y `.trace.db`.

**"AUTO_SERVER=TURE error"**: Este error ocurre cuando se usa H2 en memoria con `AUTO_SERVER`. La configuración está corregida, pero si usas una URL personalizada para H2 file, no incluyas `AUTO_SERVER=TRUE` si planeas usar el mismo archivo simultáneamente.

**Falta `application-dev.yml`**: Verifica que el archivo esté en `src/main/resources/` y reconstruye el JAR.

**"No suitable driver"**: Asegúrate de que la dependencia H2 esté en `pom.xml` con scope `runtime`.

**React "npm not found"**: Instala Node.js desde https://nodejs.org/ y ejecuta `npm install` en `ui-react/`.
