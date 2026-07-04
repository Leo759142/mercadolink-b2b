package pe.aspropa.mercadolink.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.aspropa.mercadolink.domain.*;
import pe.aspropa.mercadolink.repository.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ActorRepository actorRepository;
    private final PuestoRepository puestoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final TagRepository tagRepository;
    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(ActorRepository actorRepository,
                           PuestoRepository puestoRepository,
                           ProductoRepository productoRepository,
                           InventarioRepository inventarioRepository,
                           TagRepository tagRepository,
                           PedidoRepository pedidoRepository,
                           ItemPedidoRepository itemPedidoRepository,
                           AuditoriaRepository auditoriaRepository,
                           PasswordEncoder passwordEncoder) {
        this.actorRepository = actorRepository;
        this.puestoRepository = puestoRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.tagRepository = tagRepository;
        this.pedidoRepository = pedidoRepository;
        this.itemPedidoRepository = itemPedidoRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (actorRepository.count() > 0) {
            log.info("DataInitializer: ya existen actores, no se cargan datos demo.");
            return;
        }
        log.info("DataInitializer: cargando datos demo extendidos...");

        String hash = passwordEncoder.encode("password123");

        List<Tag> tags = Arrays.asList(
            tagRepository.save(new Tag("Orgánico")),
            tagRepository.save(new Tag("Premium")),
            tagRepository.save(new Tag("Económico")),
            tagRepository.save(new Tag("Local")),
            tagRepository.save(new Tag("Importado")),
            tagRepository.save(new Tag("Sin Gluten")),
            tagRepository.save(new Tag("Kilo")),
            tagRepository.save(new Tag("Docena")),
            tagRepository.save(new Tag("Promo")),
            tagRepository.save(new Tag("Temporada"))
        );

        List<Puesto> puestos = Arrays.asList(
            puestoRepository.save(createPuesto("Abarrotes Don Ramiro", "A-01", "ABARROTES")),
            puestoRepository.save(createPuesto("Abarrotes La Estrella", "A-02", "ABARROTES")),
            puestoRepository.save(createPuesto("Frutas del Valle", "B-01", "FRUTAS")),
            puestoRepository.save(createPuesto("Frutas Tropicales SAC", "B-02", "FRUTAS")),
            puestoRepository.save(createPuesto("Verduras Frescas", "B-03", "VERDURAS")),
            puestoRepository.save(createPuesto("Verdulería El Buen Precio", "A-12", "VERDURAS")),
            puestoRepository.save(createPuesto("Carnes Premium", "C-08", "CARNES")),
            puestoRepository.save(createPuesto("Pollería San Juan", "C-09", "CARNES")),
            puestoRepository.save(createPuesto("Pescadería del Puerto", "C-10", "PESCADOS")),
            puestoRepository.save(createPuesto("Lácteos Andinos", "D-01", "LACTEOS")),
            puestoRepository.save(createPuesto("Huevos Campo Libre", "D-02", "LACTEOS")),
            puestoRepository.save(createPuesto("Panadería San Antonio", "E-01", "PANADERIA")),
            puestoRepository.save(createPuesto("Semillas y Legumbres", "F-01", "SEMILLAS")),
            puestoRepository.save(createPuesto("Flores del Campo", "G-01", "FLORES")),
            puestoRepository.save(createPuesto("Plantas Ornamentales", "G-02", "FLORES"))
        );

        Actor admin = new Actor("Aspropa Admin", "admin@aspropa.pe", hash, "20512345678", Rol.ADMINISTRADOR);
        actorRepository.save(admin);

        List<Actor> proveedores = Arrays.asList(
            createActor("Distribuidora Norte SAC", "distribuidora@aspropa.pe", "20498765432", Rol.PROVEEDOR, puestos.get(0), hash),
            createActor("Exportadora Frutas del Valle", "frutas@aspropa.pe", "20411223344", Rol.PROVEEDOR, puestos.get(2), hash),
            createActor("Tropical Fruits Peru", "tropical@aspropa.pe", "20455667788", Rol.PROVEEDOR, puestos.get(3), hash),
            createActor("Verduras del Campo SRL", "verduras@aspropa.pe", "20433445566", Rol.PROVEEDOR, puestos.get(4), hash),
            createActor("Verdulmex SAC", "verdulmex@aspropa.pe", "20477889900", Rol.PROVEEDOR, puestos.get(5), hash),
            createActor("Agro Carnes del Altiplano", "carnes@aspropa.pe", "20411223355", Rol.PROVEEDOR, puestos.get(6), hash),
            createActor("Pollería Regional", "pollo@aspropa.pe", "20433557799", Rol.PROVEEDOR, puestos.get(7), hash),
            createActor("Mariscos del Puerto", "mariscos@aspropa.pe", "20455881133", Rol.PROVEEDOR, puestos.get(8), hash),
            createActor("Lácteos Andinos SAC", "lacteos@aspropa.pe", "20477992244", Rol.PROVEEDOR, puestos.get(9), hash),
            createActor("Huechuraba Agropecuaria", "huevos@aspropa.pe", "20499113355", Rol.PROVEEDOR, puestos.get(10), hash),
            createActor("Panadería San Antonio", "pan@aspropa.pe", "20433558811", Rol.PROVEEDOR, puestos.get(11), hash),
            createActor("Legumbres del Sur", "legumbres@aspropa.pe", "20455992233", Rol.PROVEEDOR, puestos.get(12), hash),
            createActor("Flores del Campo SAC", "flores@aspropa.pe", "20477114455", Rol.PROVEEDOR, puestos.get(13), hash),
            createActor("Vivero Andino", "vivero@aspropa.pe", "20499225566", Rol.PROVEEDOR, puestos.get(14), hash)
        );
        actorRepository.saveAll(proveedores);

        List<Actor> vendedores = Arrays.asList(
            createActor("Don Ramiro - Abarrotes", "vendedor@aspropa.pe", "45678912", Rol.VENDEDOR, puestos.get(0), hash),
            createActor("María Fernanda - Frutas", "maria.frutas@aspropa.pe", "56789123", Rol.VENDEDOR, puestos.get(2), hash),
            createActor("José Luis - Verduras", "jose.verduras@aspropa.pe", "67891234", Rol.VENDEDOR, puestos.get(4), hash),
            createActor("Ana Carnes Premium", "ana.carnes@aspropa.pe", "78912345", Rol.VENDEDOR, puestos.get(6), hash),
            createActor("Carlos Pescado Fresco", "carlos.pescado@aspropa.pe", "89123456", Rol.VENDEDOR, puestos.get(8), hash),
            createActor("Luisa Lácteos", "luisa.lacteos@aspropa.pe", "91234567", Rol.VENDEDOR, puestos.get(9), hash),
            createActor("Pedro Huevos", "pedro.huevos@aspropa.pe", "12345678", Rol.VENDEDOR, puestos.get(10), hash),
            createActor("Carmen - Pan", "carmen.pan@aspropa.pe", "23456789", Rol.VENDEDOR, puestos.get(11), hash),
            createActor("Roberto Legumbres", "roberto.leg@aspropa.pe", "34567890", Rol.VENDEDOR, puestos.get(12), hash),
            createActor("Floristería Rosario", "rosario.flores@aspropa.pe", "45678901", Rol.VENDEDOR, puestos.get(13), hash),
            createActor("Vivero Verde", "vivero.venta@aspropa.pe", "56789012", Rol.VENDEDOR, puestos.get(14), hash),
            createActor("Mercado Central Mayorista", "central.mayor@aspropa.pe", "67890123", Rol.VENDEDOR, null, hash),
            createActor("Mayorista El Ahorro", "ahorro.may@aspropa.pe", "78901234", Rol.VENDEDOR, null, hash),
            createActor("Bodega La Esquina", "esquina.bodega@aspropa.pe", "89012345", Rol.VENDEDOR, puestos.get(1), hash),
            createActor("Verdulería Norte", "norte.verd@aspropa.pe", "90123456", Rol.VENDEDOR, puestos.get(5), hash),
            createActor("Pollería Express", "pollo.express@aspropa.pe", "01234567", Rol.VENDEDOR, puestos.get(7), hash)
        );
        actorRepository.saveAll(vendedores);

        List<Producto> productos = Arrays.asList(
            crearProducto("ARZ-001", "Arroz superior saco 50kg", "180.00", proveedores.get(0), tags.get(1), tags.get(3)),
            crearProducto("ARZ-002", "Arroz integral 50kg", "210.00", proveedores.get(0), tags.get(0), tags.get(3)),
            crearProducto("AZU-001", "Azúcar rubia saco 50kg", "160.00", proveedores.get(0), tags.get(2), tags.get(3)),
            crearProducto("ACE-001", "Aceite vegetal caja 12u x 1L", "110.00", proveedores.get(0)),
            crearProducto("ACE-002", "Aceite de oliva extra virgen 5L", "85.00", proveedores.get(0), tags.get(1), tags.get(4)),
            crearProducto("MAN-001", "Mango Hass caja 20kg", "95.00", proveedores.get(1), tags.get(0)),
            crearProducto("MAN-002", "Mango Kent caja 20kg", "105.00", proveedores.get(1), tags.get(0)),
            crearProducto("MAN-003", "Mango Tommy caja 20kg", "90.00", proveedores.get(2)),
            crearProducto("FRE-001", "Fresa bandeja 5kg", "75.00", proveedores.get(2), tags.get(0)),
            crearProducto("PAP-001", "Papa amarilla saco 50kg", "120.00", proveedores.get(3), tags.get(0), tags.get(3)),
            crearProducto("PAP-002", "Papa blanca saco 50kg", "110.00", proveedores.get(3)),
            crearProducto("PAP-003", "Papa chola saco 50kg", "140.00", proveedores.get(3), tags.get(0)),
            crearProducto("TOM-001", "Tomate rocoto saco 20kg", "85.00", proveedores.get(4)),
            crearProducto("TOM-002", "Tomate jitomate caja 15kg", "65.00", proveedores.get(4)),
            crearProducto("LEC-001", "Lechuga manteca atado 5kg", "25.00", proveedores.get(4), tags.get(0)),
            crearProducto("ZAN-001", "Zanahoria bolsa 10kg", "35.00", proveedores.get(4), tags.get(0)),
            crearProducto("POL-001", "Pollo entero limpio kg", "25.00", proveedores.get(5)),
            crearProducto("POL-002", "Pollo trozo kg", "28.00", proveedores.get(5)),
            crearProducto("RES-001", "Res entraña kg", "45.00", proveedores.get(5)),
            crearProducto("RES-002", "Res pulpa kg", "38.00", proveedores.get(5)),
            crearProducto("CER-001", "Cerdo costilla kg", "32.00", proveedores.get(5)),
            crearProducto("CER-002", "Cerdo lomo kg", "35.00", proveedores.get(5)),
            crearProducto("POLL-001", "Pollo entero kg", "22.00", proveedores.get(6)),
            crearProducto("POLL-002", "Pollo a la braza kg", "26.00", proveedores.get(6)),
            crearProducto("CAM-001", "Camarón crudo kg", "55.00", proveedores.get(7)),
            crearProducto("CAM-002", "Camarón empanizado kg", "62.00", proveedores.get(7)),
            crearProducto("LEN-001", "Lomo de lenguado kg", "75.00", proveedores.get(7)),
            crearProducto("LEC-002", "Leche entera litro", "4.50", proveedores.get(8)),
            crearProducto("LEC-003", "Leche condensada 397ml", "5.20", proveedores.get(8)),
            crearProducto("QUE-001", "Queso fresco kg", "28.00", proveedores.get(8)),
            crearProducto("QUE-002", "Queso amarillo 200g", "6.80", proveedores.get(8)),
            crearProducto("HUE-001", "Huevos gallina docena", "12.00", proveedores.get(9)),
            crearProducto("HUE-002", "Huevos codorniz docena", "15.00", proveedores.get(9)),
            crearProducto("PAN-001", "Pan francés unidad", "0.80", proveedores.get(10)),
            crearProducto("PAN-002", "Pan integral unidad", "1.20", proveedores.get(10)),
            crearProducto("PAN-003", "Bizcocho bolsa 500g", "3.50", proveedores.get(10)),
            crearProducto("LEN-002", "Lentejas saco 25kg", "95.00", proveedores.get(11), tags.get(10)),
            crearProducto("GOR-001", "Garbanzos saco 25kg", "88.00", proveedores.get(11), tags.get(10)),
            crearProducto("FLO-001", "Flores mixtas ramo", "18.00", proveedores.get(12)),
            crearProducto("FLO-002", "Rosas rojas docena", "25.00", proveedores.get(12)),
            crearProducto("PLA-001", "Plantas suculentas unidad", "15.00", proveedores.get(13)),
            crearProducto("PLA-002", "Plantas ornamentales unidad", "22.00", proveedores.get(13)),
            crearProducto("CHO-001", "Chocolate premium tableta 200g", "18.00", proveedores.get(0), tags.get(1)),
            crearProducto("CHO-002", "Chocolate con leche tableta 150g", "12.00", proveedores.get(0)),
            crearProducto("CAF-001", "Café molido bolsa 1kg", "45.00", proveedores.get(0), tags.get(10)),
            crearProducto("CAF-002", "Café instantáneo frasco 200g", "18.00", proveedores.get(0)),
            crearProducto("TE-001", "Té negro caja 50 bolsitas", "22.00", proveedores.get(0)),
            crearProducto("TE-002", "Té verde caja 50 bolsitas", "24.00", proveedores.get(0))
        );
        productoRepository.saveAll(productos);

        List<Inventario> inventarios = Arrays.asList(
            crearInventario(productos.get(0), puestos.get(0), 100, 20),
            crearInventario(productos.get(1), puestos.get(0), 80, 15),
            crearInventario(productos.get(2), puestos.get(0), 120, 30),
            crearInventario(productos.get(3), puestos.get(0), 50, 10),
            crearInventario(productos.get(4), puestos.get(0), 35, 8),
            crearInventario(productos.get(5), puestos.get(2), 200, 50),
            crearInventario(productos.get(6), puestos.get(2), 180, 40),
            crearInventario(productos.get(7), puestos.get(3), 150, 30),
            crearInventario(productos.get(8), puestos.get(3), 100, 20),
            crearInventario(productos.get(9), puestos.get(4), 250, 60),
            crearInventario(productos.get(10), puestos.get(5), 180, 40),
            crearInventario(productos.get(11), puestos.get(4), 200, 50),
            crearInventario(productos.get(12), puestos.get(5), 150, 30),
            crearInventario(productos.get(13), puestos.get(5), 120, 25),
            crearInventario(productos.get(14), puestos.get(4), 180, 35),
            crearInventario(productos.get(15), puestos.get(5), 220, 45),
            crearInventario(productos.get(16), puestos.get(6), 300, 80),
            crearInventario(productos.get(17), puestos.get(6), 250, 60),
            crearInventario(productos.get(18), puestos.get(6), 200, 50),
            crearInventario(productos.get(19), puestos.get(6), 180, 40),
            crearInventario(productos.get(20), puestos.get(7), 400, 100),
            crearInventario(productos.get(21), puestos.get(7), 350, 80),
            crearInventario(productos.get(22), puestos.get(8), 150, 30),
            crearInventario(productos.get(23), puestos.get(8), 120, 25),
            crearInventario(productos.get(24), puestos.get(8), 100, 20),
            crearInventario(productos.get(25), puestos.get(9), 300, 60),
            crearInventario(productos.get(26), puestos.get(9), 200, 40),
            crearInventario(productos.get(27), puestos.get(9), 250, 50),
            crearInventario(productos.get(28), puestos.get(9), 180, 35),
            crearInventario(productos.get(29), puestos.get(10), 400, 100),
            crearInventario(productos.get(30), puestos.get(10), 350, 80),
            crearInventario(productos.get(31), puestos.get(11), 200, 40),
            crearInventario(productos.get(32), puestos.get(11), 180, 35),
            crearInventario(productos.get(33), puestos.get(12), 250, 50),
            crearInventario(productos.get(34), puestos.get(12), 150, 30),
            crearInventario(productos.get(35), puestos.get(13), 300, 60),
            crearInventario(productos.get(36), puestos.get(13), 250, 45),
            crearInventario(productos.get(37), puestos.get(14), 180, 40),
            crearInventario(productos.get(38), puestos.get(14), 150, 35),
            crearInventario(productos.get(39), puestos.get(0), 100, 25),
            crearInventario(productos.get(40), puestos.get(1), 80, 15),
            crearInventario(productos.get(41), puestos.get(0), 150, 30),
            crearInventario(productos.get(42), puestos.get(1), 120, 20),
            crearInventario(productos.get(43), puestos.get(0), 90, 20),
            crearInventario(productos.get(44), puestos.get(1), 85, 15),
            crearInventario(productos.get(45), puestos.get(0), 110, 25)
        );
        inventarioRepository.saveAll(inventarios);

        Pedido pedido1 = new Pedido();
        pedido1.setIdempotencyKey(UUID.randomUUID().toString());
        pedido1.setCliente(vendedores.get(0));
        pedido1.setEstado(EstadoPedido.ENTREGADO);
        pedido1.setMontoTotal(BigDecimal.valueOf(360.00));
        pedido1.setFechaCreacion(Instant.now().minusSeconds(172800));
        pedidoRepository.save(pedido1);

        ItemPedido item1 = new ItemPedido();
        item1.setPedido(pedido1);
        item1.setProducto(productos.get(0));
        item1.setPuesto(puestos.get(0));
        item1.setCantidad(2);
        item1.setPrecioUnitario(BigDecimal.valueOf(180.00));
        itemPedidoRepository.save(item1);

        Pedido pedido2 = new Pedido();
        pedido2.setIdempotencyKey(UUID.randomUUID().toString());
        pedido2.setCliente(vendedores.get(1));
        pedido2.setEstado(EstadoPedido.CONFIRMADO);
        pedido2.setMontoTotal(BigDecimal.valueOf(190.00));
        pedido2.setFechaCreacion(Instant.now().minusSeconds(86400));
        pedidoRepository.save(pedido2);

        ItemPedido item2 = new ItemPedido();
        item2.setPedido(pedido2);
        item2.setProducto(productos.get(5));
        item2.setPuesto(puestos.get(2));
        item2.setCantidad(1);
        item2.setPrecioUnitario(BigDecimal.valueOf(95.00));
        itemPedidoRepository.save(item2);

        ItemPedido item3 = new ItemPedido();
        item3.setPedido(pedido2);
        item3.setProducto(productos.get(6));
        item3.setPuesto(puestos.get(2));
        item3.setCantidad(1);
        item3.setPrecioUnitario(BigDecimal.valueOf(95.00));
        itemPedidoRepository.save(item3);

        Pedido pedido3 = new Pedido();
        pedido3.setIdempotencyKey(UUID.randomUUID().toString());
        pedido3.setCliente(vendedores.get(2));
        pedido3.setEstado(EstadoPedido.EN_DESPACHO);
        pedido3.setMontoTotal(BigDecimal.valueOf(240.00));
        pedido3.setFechaCreacion(Instant.now());
        pedidoRepository.save(pedido3);

        ItemPedido item4 = new ItemPedido();
        item4.setPedido(pedido3);
        item4.setProducto(productos.get(9));
        item4.setPuesto(puestos.get(4));
        item4.setCantidad(2);
        item4.setPrecioUnitario(BigDecimal.valueOf(120.00));
        itemPedidoRepository.save(item4);

        logAuditoria("Datos demo extendidos cargados");

        log.info("DataInitializer: datos demo extendidos listos.");
        log.info("  Admin: 1");
        log.info("  Proveedores: {}", actorRepository.findByRol(Rol.PROVEEDOR).size());
        log.info("  Vendedores: {}", actorRepository.findByRol(Rol.VENDEDOR).size());
        log.info("  Puestos: {}", puestoRepository.count());
        log.info("  Tags: {}", tagRepository.count());
        log.info("  Productos: {}", productoRepository.count());
        log.info("  Inventarios: {}", inventarioRepository.count());
        log.info("  Pedidos: {}", pedidoRepository.count());
    }

    private Puesto createPuesto(String nombre, String numero, String seccion) {
        Puesto p = new Puesto();
        p.setNombre(nombre);
        p.setNumero(numero);
        p.setSeccion(seccion);
        return p;
    }

    private Actor createActor(String nombre, String email, String documento, Rol rol, Puesto puesto, String hash) {
        Actor actor = new Actor(nombre, email, hash, documento, rol);
        actor.setPuesto(puesto);
        actor.setActivo(true);
        return actor;
    }

    private Producto crearProducto(String codigo, String descripcion, String precio, Actor proveedor, Tag... tags) {
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setDescripcion(descripcion);
        p.setPrecioReferencia(new BigDecimal(precio));
        p.setProveedor(proveedor);
        p.setActivo(true);
        for (Tag tag : tags) {
            p.addTag(tag, 0);
        }
        return p;
    }

    private Inventario crearInventario(Producto p, Puesto pu, int cantidad, int minimo) {
        Inventario inv = new Inventario();
        inv.setProducto(p);
        inv.setPuesto(pu);
        inv.setCantidadActual(cantidad);
        inv.setCantidadMinima(minimo);
        return inv;
    }

    private void logAuditoria(String detalle) {
        Auditoria aud = new Auditoria();
        aud.setServicio("DataInitializer");
        aud.setOperacion(detalle);
        aud.setResultado("EXITO");
        auditoriaRepository.save(aud);
    }
}