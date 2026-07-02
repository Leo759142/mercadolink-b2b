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

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ActorRepository actorRepository;
    private final PuestoRepository puestoRepository;
    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final TagRepository tagRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(ActorRepository actorRepository,
                           PuestoRepository puestoRepository,
                           ProductoRepository productoRepository,
                           InventarioRepository inventarioRepository,
                           TagRepository tagRepository,
                           PasswordEncoder passwordEncoder) {
        this.actorRepository = actorRepository;
        this.puestoRepository = puestoRepository;
        this.productoRepository = productoRepository;
        this.inventarioRepository = inventarioRepository;
        this.tagRepository = tagRepository;
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

        Puesto puestoFrutas = puestoRepository.save(new Puesto("La Frutera", "B-05", "FRUTAS"));
        Puesto puestoVerduras = puestoRepository.save(new Puesto("Verdulería El Buen Precio", "A-12", "VERDURAS"));
        Puesto puestoCarnes = puestoRepository.save(new Puesto("Carnes Premium", "C-08", "CARNES"));
        Puesto puestoAbarrotes = puestoRepository.save(new Puesto("Abarrotes Don Ramiro", "A-01", "ABARROTES"));

        String hash = passwordEncoder.encode("password123");

        Tag tagOrganico = tagRepository.save(new Tag("Orgánico"));
        Tag tagPremium = tagRepository.save(new Tag("Premium"));
        Tag tagEconomico = tagRepository.save(new Tag("Económico"));
        Tag tagLocal = tagRepository.save(new Tag("Local"));
        Tag tagImportado = tagRepository.save(new Tag("Importado"));

        Actor admin = new Actor("Aspropa Admin", "admin@aspropa.pe", hash, "20512345678", Rol.ADMINISTRADOR);
        actorRepository.save(admin);

        Actor proveedorAlimentos = new Actor("Distribuidora Norte SAC", "distribuidora@aspropa.pe", hash, "20498765432", Rol.PROVEEDOR);
        proveedorAlimentos.setPuesto(puestoAbarrotes);
        actorRepository.save(proveedorAlimentos);

        Actor proveedorFrutas = new Actor("Exportadora Frutas del Valle", "frutas@aspropa.pe", hash, "20411223344", Rol.PROVEEDOR);
        proveedorFrutas.setPuesto(puestoFrutas);
        actorRepository.save(proveedorFrutas);

        Actor proveedorVerduras = new Actor("Verduras del Campo SRL", "verduras@aspropa.pe", hash, "20455667788", Rol.PROVEEDOR);
        actorRepository.save(proveedorVerduras);

        Actor vendedorRamiro = new Actor("Vendedor Don Ramiro", "vendedor@aspropa.pe", hash, "45678912", Rol.VENDEDOR);
        vendedorRamiro.setPuesto(puestoAbarrotes);
        actorRepository.save(vendedorRamiro);

        Actor vendedorFrutas = new Actor("María Fernanda - Frutas", "maria.frutas@aspropa.pe", hash, "56789123", Rol.VENDEDOR);
        vendedorFrutas.setPuesto(puestoFrutas);
        actorRepository.save(vendedorFrutas);

        Actor vendedorVerduras = new Actor("Carlos Verduras", "carlos.verduras@aspropa.pe", hash, "67891234", Rol.VENDEDOR);
        vendedorVerduras.setPuesto(puestoVerduras);
        actorRepository.save(vendedorVerduras);

        Actor vendedorCarnes = new Actor("Ana Carnes", "ana.carnes@aspropa.pe", hash, "78912345", Rol.VENDEDOR);
        vendedorCarnes.setPuesto(puestoCarnes);
        actorRepository.save(vendedorCarnes);

        Producto arroz = crearProductoConTags("ARZ-001", "Arroz superior saco 50kg", "180.00", proveedorAlimentos, tagPremium, tagLocal);
        Producto azucar = crearProductoConTags("AZU-001", "Azúcar rubia saco 50kg", "160.00", proveedorAlimentos, tagEconomico, tagLocal);
        Producto aceite = crearProductoConTags("ACE-001", "Aceite vegetal caja 12u x 1L", "110.00", proveedorAlimentos);
        Producto mango = crearProductoConTags("MAN-001", "Mango Hass caja 20kg", "95.00", proveedorFrutas, tagOrganico, tagImportado);
        Producto papa = crearProductoConTags("PAP-001", "Papa amarilla saco 50kg", "120.00", proveedorVerduras, tagOrganico, tagLocal);
        Producto pollo = crearProductoConTags("POL-001", "Pollo entero limpio kg", "25.00", null, tagPremium);

        productoRepository.saveAll(java.util.List.of(arroz, azucar, aceite, mango, papa, pollo));

        crearInventario(arroz, puestoAbarrotes, 100, 20);
        crearInventario(azucar, puestoAbarrotes, 80, 15);
        crearInventario(aceite, puestoAbarrotes, 50, 10);
        crearInventario(mango, puestoFrutas, 200, 50);
        crearInventario(papa, puestoVerduras, 150, 30);
        crearInventario(pollo, puestoCarnes, 300, 50);

        log.info("DataInitializer: datos demo listos.");
        log.info("  Proveedores: {}", actorRepository.findByRol(Rol.PROVEEDOR).size());
        log.info("  Vendedores: {}", actorRepository.findByRol(Rol.VENDEDOR).size());
        log.info("  Puestos: {}", puestoRepository.count());
        log.info("  Tags: {}", tagRepository.count());
    }

    private Producto crearProductoConTags(String codigo, String descripcion, String precio, Actor proveedor, Tag... tags) {
        Producto p = new Producto();
        p.setCodigo(codigo);
        p.setDescripcion(descripcion);
        p.setPrecioReferencia(new BigDecimal(precio));
        p.setProveedor(proveedor);
        for (Tag tag : tags) {
            p.addTag(tag, 0);
        }
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