# Seguridad y Roles - Thymeleaf Vendedores/Proveedores

## Configuración de Roles

### Rol VENDEDOR
- Asignado a `Actor.rol = VENDEDOR`
- Acceso a: `/vendedor/**`, APIs de pedidos e inventario
- Requiere: `Puesto` asignado

### Rol PROVEEDOR
- Asignado a `Actor.rol = PROVEEDOR`
- Acceso a: `/proveedor/**`, APIs de productos y pedidos de proveedor
- Opcional: registro en tabla `proveedores`

## Validación de Acceso

### En Controllers
```java
@Controller
@RequestMapping("/vendedor")
public class FrontendVendedorController {
    
    @GetMapping({"/", "/pedidos"})
    @PreAuthorize("hasRole('VENDEDOR')")
    public String pedidos(Model model, Authentication auth) {
        // Validar puesto asignado
        return "vendedor/pedidos";
    }
}
```

### En Templates
```html
<!-- Thymeleaf Security Spring Security Dialect -->
<html xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-spring-security5">

<div sec:authorize="hasRole('VENDEDOR')">
    <a href="/vendedor/pedidos">Mis Pedidos</a>
</div>

<div sec:authorize="hasRole('PROVEEDOR')">
    <a href="/proveedor/productos">Mis Productos</a>
</div>
```

## DTOs de Request/Response Actualizados

### CrearProveedorRequest → VendedorRequest
```java
// Para VENDEDOR con datos de puesto
public class RegistroVendedorRequest {
    @NotBlank private String nombreComercial;
    @NotBlank private String email;
    @NotBlank private String password;
    @NotBlank private String documento;  // DNI
    @NotBlank private String puestoId;   // Puesto asignado
}
```

### PerfilProveedorRequest
```java
// Para actualizar datos de proveedor
public class PerfilProveedorRequest {
    private String razonSocial;
    private String ruc;
    private String nombreContacto;
    private String telefono;
    private String email;
    private String direccion;
    private String distrito;
}
```

## Headers de Seguridad

### JWT para UI
```javascript
// Interceptor para incluir token en requests API
function fetchConJWT(url, options = {}) {
    const token = localStorage.getItem('jwt_token');
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': 'Bearer ' + token
        }
    });
}
```

## Roles y Permisos Matrix

| Acción | VENDEDOR | PROVEEDOR | CLIENTE_MAYORISTA | ADMIN |
|--------|----------|-----------|-------------------|-------|
| Ver pedidos propios | ✅ | ✅ (por productos) | ✅ | ✅ |
| Cambiar estado pedido | ✅ | ❌ | ❌ | ✅ |
| Gestionar inventario | ✅ | ❌ | ❌ | ✅ |
| Crear productos | ❌ | ✅ | ❌ | ✅ |
| Ver mis productos | ❌ | ✅ | ❌ | ✅ |
| Actualizar perfil | ✅ | ✅ | ✅ | ✅ |
| Aprobar proveedores | ❌ | ❌ | ❌ | ✅ |