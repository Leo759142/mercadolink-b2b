# Tabla CRC - MercadoLink B2B

| Módulo | Clase(s) | Responsabilidades | Colaboradores |
|--------|----------|-------------------|---------------|
| **Config** | AsyncConfig, CorsConfig, DataInitializer, OpenApiConfig, SpaWebConfig, SecurityConfig, JwtUtil | Configura async con pool dedicado, CORS para frontend, inicialización de datos, documentación OpenAPI, servir SPA y seguridad JWT con BCrypt | JwtAuthFilter, ActorRepository, PasswordEncoder |
| **Auth** | AuthController, AuthService, JwtUtil, JwtAuthFilter, AuthenticatedActor, ActorService | Registrar usuarios, autenticar con email/password, generar y validar tokens JWT, extraer claims del token | ActorRepository, PuestoRepository, PasswordEncoder |
| **Pedidos** | PedidoController, PedidoService, Pedido, ItemPedido, EstadoPedido | Crear pedidos B2B con validación mínimo 10 unidades/S/50, gestionar estados (borrador, pendiente pago, pagado, confirmado, etc.), idempotencia con Idempotency-Key | InventarioService, ActorService, PagoService, AuditoriaService, NotificacionService, ProductoRepository, PuestoRepository |
| **ItemPedido** | ItemPedido | Guardar producto, cantidad y precio unitario de cada línea de pedido | Pedido, Producto, Puesto |
| **Pagos** | PagoController, PagoService, Pago, EstadoPago, IzipayService | Iniciar cobro con Izipay, generar formToken, procesar webhook/IPN de forma asíncrona, cambiar estados de pago, implementar saga compensatoria | PedidoService, InventarioService, IzipayService, AuditoriaService, NotificacionService, PagoRepository |
| **Inventario** | InventarioController, InventarioService, Inventario | Registrar stock actual y mínimo, reservar/confirmar/liberar (saga), notificar stock bajo, validar disponibilidad | ProductoRepository, PuestoRepository, NotificacionService, PagoService |
| **Productos** | ProductoController, ProductoRepository | CRUD de productos, validar activo/inactivo | - |
| **Actor/Puestos** | Actor, Puesto, Rol, ActorService | Gestión de usuarios y puestos, validación de roles | ActorRepository, PuestoRepository |
| **Dominio** | Pedido, Producto, Pago, Inventario, ItemPedido, Actor, Puesto, Auditoria | Entidades JPA con relaciones, validaciones de negocio | - |
| **Aspectos Transversales** | AuditoriaService, NotificacionService | Registrar auditoría de acciones, enviar notificaciones asíncronas | AuditoriaRepository |
| **Swagger** | OpenApiConfig | Documentar API REST con OpenAPI 3.0, configurar esquema de seguridad JWT | - |