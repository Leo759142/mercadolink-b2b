# Templates Thymeleaf - Diseño Amigable

## Layout Base con Cards (`templates/layout/base.html`)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title th:fragment="titulo">MercadoLink B2B</title>
    <style th:replace="~{layout/styles :: global-styles}">
    :root {
        --bg: #0d1117; --surface: #161b22; --surface2: #21262d;
        --border: #30363d; --text: #e6edf3; --muted: #8b949e;
        --accent: #388bfd; --green: #3fb950; --yellow: #d29922; --red: #f85149;
        --radius: 12px; --shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
    .card { background: var(--surface); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1rem; box-shadow: var(--shadow); }
    .btn { background: var(--accent); color: #fff; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; display: inline-block; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-icon { font-size: 1.2rem; margin-right: 0.3rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    .stat-card { background: var(--surface2); padding: 1rem; border-radius: var(--radius); text-align: center; }
    .stat-number { font-size: 1.8rem; font-weight: bold; color: var(--accent); }
    .stat-label { font-size: 0.85rem; color: var(--muted); }
    .alert { padding: 0.8rem; border-radius: var(--radius); margin: 0.5rem 0; }
    .alert-warning { background: rgba(210, 153, 34, 0.15); border-left: 4px solid var(--yellow); }
    .alert-success { background: rgba(63, 185, 80, 0.15); border-left: 4px solid var(--green); }
    </style>
</head>
<body>
    <header class="card" th:fragment="header">
        <h2 style="color: var(--accent);">🏪 MercadoLink B2B</h2>
        <p style="color: var(--muted);" th:text="${#authentication.name}">Usuario</p>
    </header>
    
    <main layout:fragment="content" style="max-width: 900px; margin: 0 auto; padding: 0 1rem;">
        <!-- Contenido específico -->
    </main>
</body>
</html>
```

## Template: Vendedor - Pedidos (`templates/vendedor/pedidos.html`)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" 
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{layout/base}">
<head>
    <title layout:fragment="titulo">Pedidos - Vendedor</title>
</head>
<body>
    <div layout:fragment="content">
        <div class="top">
            <h2>Pedidos de mi Puesto</h2>
            <a class="btn" href="/vendedor/inventario">Ver Inventario</a>
        </div>
        
        <table id="pedidos-table">
            <thead>
                <tr>
                    <th>ID</th><th>Cliente</th><th>Total</th>
                    <th>Estado</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody id="pedidos-body"></tbody>
        </table>
        
        <script th:inline="javascript">
            /*<![CDATA[*/
            const puestoId = /*[[${#authentication.principal.puestoId}]]*/ 'null';
            /*]]>*/
            
            async function loadPedidos() {
                const res = await fetch('/api/v1/pedidos/puesto/' + puestoId);
                const data = await res.json();
                // Render tabla
            }
            loadPedidos();
        </script>
    </div>
</body>
</html>
```

## Template: Proveedor - Productos (`templates/proveedor/productos.html`)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" 
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{layout/base}">
<head>
    <title layout:fragment="titulo">Mis Productos - Proveedor</title>
</head>
<body>
    <div layout:fragment="content">
        <div class="top">
            <h2>Mis Productos</h2>
            <button class="btn" onclick="openCreateModal()">Nuevo Producto</button>
        </div>
        
        <table id="productos-table">
            <thead>
                <tr>
                    <th>SKU</th><th>Nombre</th><th>Precio</th>
                    <th>Etiquetas</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody id="productos-body"></tbody>
        </table>
        
        <script th:inline="javascript">
            /*<![CDATA[*/
            const actorId = /*[[${#authentication.principal.actorId}]]*/ 'null';
            /*]]>*/
            
            async function loadProductos() {
                const res = await fetch('/api/v1/productos/mis-productos');
                const data = await res.json();
                // Render con th:each alternativa server-side
            }
        </script>
    </div>
</body>
</html>
```

## Estilos Base (`templates/layout/styles.html`)

```html
<style th:fragment="global-styles">
:root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #388bfd; --radius: 8px; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; padding: 2rem; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); }
th, td { padding: 0.8rem; border-bottom: 1px solid var(--border); }
th { background: var(--surface); color: var(--muted); font-weight: 600; }
.btn { background: var(--accent); color: #fff; padding: 0.6rem 1.2rem; border-radius: var(--radius); text-decoration: none; }
</style>
```

## Template Amigable: Vendedor Dashboard (`templates/vendedor/index.html`)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" 
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-spring-security5"
      layout:decorate="~{layout/base}">
<head>
    <title layout:fragment="titulo">🏪 Panel de Vendedor</title>
</head>
<body>
<div layout:fragment="content">
    <div class="card">
        <h2 style="color: var(--accent); margin-bottom: 0.5rem;">
            🏪 Panel de Vendedor
        </h2>
        <p th:text="${#authentication.name}" style="color: var(--muted);">Vendedor</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.pedidosPendientes}">3</div>
            <div class="stat-label">Pedidos nuevos</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.inventarioBajo}">2</div>
            <div class="stat-label">Alertas stock</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.totalUnidades}">150</div>
            <div class="stat-label">Unidades en venta</div>
        </div>
    </div>

    <!-- Alertas de stock -->
    <div class="card" th:if="${not #lists.isEmpty(alertas)}">
        <h3>⚠️ Alertas de inventario</h3>
        <div th:each="alerta : ${alertas}" class="alert alert-warning" 
             th:text="${alerta.mensaje + ': ' + alerta.disponible + ' unidades (mín: ' + alerta.minimo + ')'}">
            Stock bajo: Arroz
        </div>
    </div>

    <!-- Pedidos recientes -->
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3>📋 Pedidos recientes</h3>
            <a class="btn" href="/vendedor/pedidos">Ver todos</a>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="color: var(--muted); text-align: left; font-size: 0.85rem;">
                    <th># Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acción</th>
                </tr>
            </thead>
            <tbody>
                <tr th:each="pedido : ${pedidosRecientes}" style="border-top: 1px solid var(--border);">
                    <td th:text="${pedido.numero}">P001</td>
                    <td th:text="${pedido.clienteNombre}">Mayorista SAC</td>
                    <td th:text="${'S/' + pedido.monto}">S/180.00</td>
                    <td>
                        <span th:text="${pedido.estado}" 
                              th:classappend="${pedido.estado == 'PENDIENTE_PAGO' ? 'alert-warning' : 'alert-success'}"
                              style="padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">
                        </span>
                    </td>
                    <td>
                        <button th:if="${pedido.estado == 'PENDIENTE_PAGO'}" 
                                class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;"
                                th:onclick="'cambiarEstado(\'' + ${pedido.id} + '\', \'PAGADO\')'">
                            ✔ Aceptar
                        </button>
                    </td>
                </tr>
                <tr th:if="${#lists.isEmpty(pedidosRecientes)}">
                    <td colspan="5" style="color: var(--muted); padding: 1rem;">No hay pedidos recientes</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
```

## Template Amigable: Proveedor Dashboard (`templates/proveedor/index.html`)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" 
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-spring-security5"
      layout:decorate="~{layout/base}">
<head>
    <title layout:fragment="titulo">🚚 Panel de Proveedor</title>
</head>
<body>
<div layout:fragment="content">
    <div class="card">
        <h2 style="color: var(--accent); margin-bottom: 0.5rem;">
            🚚 Panel de Proveedor
        </h2>
        <p th:text="${#authentication.name}" style="color: var(--muted);">Proveedor</p>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.productosActivos}">3</div>
            <div class="stat-label">Productos activos</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.pedidosPendientes}">5</div>
            <div class="stat-label">Pedidos por atender</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" th:text="${stats.totalIngresos}">S/1,200</div>
            <div class="stat-label">Ingresos estimados</div>
        </div>
    </div>

    <!-- Mis productos -->
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3>📝 Mis productos en el catálogo</h3>
            <button class="btn" onclick="openCreateModal()">+ Nuevo Producto</button>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="color: var(--muted); text-align: left; font-size: 0.85rem;">
                    <th>SKU</th><th>Producto</th><th>Precio</th><th>Stock</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <tr th:each="producto : ${misProductos}" style="border-top: 1px solid var(--border);">
                    <td th:text="${producto.codigo}">ARZ-001</td>
                    <td th:text="${producto.descripcion}">Arroz 50kg</td>
                    <td th:text="${'S/' + producto.precio}">S/180.00</td>
                    <td th:text="${producto.stock}">100</td>
                    <td>
                        <button class="btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;"
                                th:onclick="'editProduct(\'' + ${producto.id} + '\')'">✎</button>
                        <button class="btn" style="background: var(--red); padding: 0.3rem 0.6rem; font-size: 0.8rem;"
                                th:onclick="'deactivateProduct(\'' + ${producto.id} + '\')'">🗑</button>
                    </td>
                </tr>
                <tr th:if="${#lists.isEmpty(misProductos)}">
                    <td colspan="5" style="color: var(--muted); padding: 1rem;">No tienes productos registrados</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Pedidos recibidos -->
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3>📦 Pedidos con mis productos</h3>
            <a class="btn" href="/proveedor/pedidos">Ver todos</a>
        </div>
        <p th:if="${#lists.isEmpty(pedidosRecientes)}" style="color: var(--muted);">No hay pedidos recientes</p>
    </div>
</div>
```

## Template Home Amigable (`templates/index.html` actualizado)

```html
<!doctype html>
<html xmlns:th="http://www.thymeleaf.org" lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>MercadoLink B2B - Bienvenido</title>
    <style>
    :root { --bg: #0d1117; --surface: #161b22; --surface2: #21262d; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #388bfd; --radius: 12px; }
    * { box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; padding: 2rem; min-height: 100vh; }
    .card { background: var(--surface); border-radius: var(--radius); padding: 2rem; margin-bottom: 1.5rem; max-width: 500px; }
    .btn { background: var(--accent); color: #fff; padding: 0.8rem 1.5rem; border-radius: var(--radius); text-decoration: none; display: inline-block; margin: 0.3rem; font-weight: 600; }
    .btn-outline { background: transparent; border: 1px solid var(--accent); }
    h1 { color: var(--accent); margin-bottom: 0.5rem; }
    .hero { text-align: center; max-width: 800px; margin: 0 auto; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; }
    .feature-card { background: var(--surface2); padding: 1.5rem; border-radius: var(--radius); text-align: center; }
    .feature-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="card">
            <h1>🏪 MercadoLink B2B</h1>
            <p style="color: var(--muted);">Conectamos proveedores con vendedores en un solo mercado</p>
            
            <div style="margin-top: 2rem;">
                <h3 style="color: var(--accent); margin-bottom: 1rem;">¿Eres nuevo aquí?</h3>
                <p>
                    <a class="btn" href="/register/vendedor">Registrarse como Vendedor 🏪</a>
                    <a class="btn" href="/register/proveedor">Registrarse como Proveedor 🚚</a>
                </p>
                
                <h3 style="color: var(--accent); margin: 1.5rem 0 1rem;">¿Ya tienes cuenta?</h3>
                <p><a class="btn btn-outline" href="/login">Iniciar sesión 🔑</a></p>
            </div>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h4>Gestión de pedidos</h4>
                <p style="color: var(--muted); font-size: 0.9rem;">Administra tus pedidos en un solo lugar</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <h4>Precios justos</h4>
                <p style="color: var(--muted); font-size: 0.9rem;">Compras al por mayor sin intermediarios</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🚚</div>
                <h4>Entregas ágiles</h4>
                <p style="color: var(--muted); font-size: 0.9rem;">Logística optimizada para tu negocio</p>
            </div>
        </div>
        
        <p style="color: var(--muted); margin-top: 2rem;">
            <a href="/swagger-ui.html">Swagger UI</a> |
            <a href="/h2-console">H2 Console</a> |
            <a href="/app">UI React (B2B)</a>
        </p>
    </div>
</body>
</html>
```

## Estructura de Archivos Final

```
src/main/resources/templates/
├── layout/
│   ├── base.html
│   └── styles.html
├── vendedor/
│   ├── index.html
│   ├── pedidos.html
│   └── inventario.html
└── proveedor/
    ├── index.html
    ├── productos.html
    ├── pedidos.html
    └── perfil.html
```

## Integración en Home - Redirección Inteligente

### Después del login (`/login/success`)
```java
@GetMapping("/login/success")
public String postLogin(Authentication auth, HttpServletResponse response) {
    String rol = auth.getAuthorities().iterator().next().getAuthority();
    String redirect = switch(rol) {
        case "ROLE_VENDEDOR" -> "redirect:/vendedor/";
        case "ROLE_PROVEEDOR" -> "redirect:/proveedor/";
        case "ROLE_ADMINISTRADOR" -> "redirect:/admin/";
        default -> "redirect:/home";
    };
    return redirect;
}
```

### Botón de login desde Home
```html
<a class="btn" href="/login">Iniciar como Vendedor 🏪</a>
<a class="btn" href="/login">Iniciar como Proveedor 🚚</a>
```

### Template Login Amigable (`templates/login.html`)
```html
<div class="card" style="max-width: 400px; margin: 2rem auto;">
    <h2 style="color: var(--accent); margin-bottom: 1rem;">🔑 Iniciar sesión</h2>
    <form action="/api/v1/auth/login" method="post" id="loginForm">
        <div style="margin-bottom: 1rem;">
            <label>Email</label>
            <input type="email" name="email" required style="width: 100%; padding: 0.5rem; margin-top: 0.3rem;" />
        </div>
        <div style="margin-bottom: 1rem;">
            <label>Contraseña</label>
            <input type="password" name="password" required style="width: 100%; padding: 0.5rem; margin-top: 0.3rem;" />
        </div>
        <button type="submit" class="btn" style="width: 100%;">Entrar</button>
    </form>
</div>
```