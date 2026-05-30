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

/**
 * Carga datos de demostración al arrancar la aplicación.
 *
 * <p>Inserta 1 puesto, 3 productos y 4 usuarios (uno por rol) con la contraseña
 * {@code password123} para que el sistema sea explorable inmediatamente desde
 * Swagger UI sin pasos previos. En entornos reales este componente se debería
 * proteger con un perfil de Spring (por ejemplo {@code @Profile("demo")}).
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ActorRepository actorRepository;
    private final PuestoRepository puestoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(ActorRepository actorRepository,
                           PuestoRepository puestoRepository,
                           ProductoRepository productoRepository,
                           InventarioRepository inventarioRepository,
                           PasswordEncoder passwordEncoder) {
        this.actorRepository = actorRepository;
        this.puestoRepository = puestoRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (actorRepository.count() > 0) {
            log.info("DataInitializer: ya existen actores, no se cargan datos demo.");
            return;
        }
        log.info("DataInitializer: cargando datos demo...");

        Puesto puesto = puestoRepository.save(new Puesto("Don Ramiro", "A-12", "ABARROTES"));

        String hash = passwordEncoder.encode("password123");

        Actor admin = new Actor("Aspropa Admin", "admin@aspropa.pe", hash,
                "20512345678", Rol.ADMINISTRADOR);
        actorRepository.save(admin);

        Actor proveedor = new Actor("Distribuidora Norte SAC", "proveedor@aspropa.pe", hash,
                "20498765432", Rol.PROVEEDOR);
        actorRepository.save(proveedor);

        Actor vendedor = new Actor("Vendedor Don Ramiro", "vendedor@aspropa.pe", hash,
                "45678912", Rol.VENDEDOR);
        vendedor.setPuesto(puesto);
        actorRepository.save(vendedor);

        Actor cliente = new Actor("Bodega El Mayorista", "cliente@aspropa.pe", hash,
                "20611223344", Rol.CLIENTE_MAYORISTA);
        actorRepository.save(cliente);

        Producto arroz = productoRepository.save(crearProducto(
                "ARZ-001", "Arroz superior saco 50kg", "180.00", proveedor));
        Producto azucar = productoRepository.save(crearProducto(
                "AZU-001", "Azúcar rubia saco 50kg", "160.00", proveedor));
        Producto aceite = productoRepository.save(crearProducto(
                "ACE-001", "Aceite vegetal caja 12u x 1L", "110.00", proveedor));

        crearInventario(arroz, puesto, 100, 20);
        crearInventario(azucar, puesto, 80, 15);
        crearInventario(aceite, puesto, 50, 10);

        log.info("DataInitializer: datos demo listos.");
        log.info("  Usuarios demo (password = 'password123'):");
        log.info("    admin@aspropa.pe       (ADMINISTRADOR)");
        log.info("    proveedor@aspropa.pe   (PROVEEDOR)");
        log.info("    vendedor@aspropa.pe    (VENDEDOR, puesto={})", puesto.getId());
        log.info("    cliente@aspropa.pe     (CLIENTE_MAYORISTA)");
        log.info("  Puesto demo: id={} numero={}", puesto.getId(), puesto.getNumero());
    }

    private Producto crearProducto(String codigo, String descripcion, String precio, Actor proveedor) {
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setDescripcion(descripcion);
        p.setCategoria("ABARROTES");
        p.setPrecioReferencia(new BigDecimal(precio));
        p.setProveedor(proveedor);
        return p;
    }

    private void crearInventario(Producto p, Puesto pu, int cantidad, int minimo) {
        Inventario inv = new Inventario();
        inv.setProducto(p);
        inv.setPuesto(pu);
        inv.setCantidadActual(cantidad);
        inv.setCantidadMinima(minimo);
        inventarioRepository.save(inv);
    }
}
