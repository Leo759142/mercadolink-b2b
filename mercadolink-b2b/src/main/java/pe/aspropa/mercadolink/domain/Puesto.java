package pe.aspropa.mercadolink.domain;

import jakarta.persistence.*;
import java.util.UUID;

/** Puesto físico dentro del mercado popular. */
@Entity
@Table(name = "puestos")
public class Puesto {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(length = 50)
    private String seccion;

    @Column(nullable = false)
    private boolean activo = true;

    public Puesto() {}
    public Puesto(String nombre, String numero, String seccion) {
        this.nombre = nombre; this.numero = numero; this.seccion = seccion;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getSeccion() { return seccion; }
    public void setSeccion(String seccion) { this.seccion = seccion; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
