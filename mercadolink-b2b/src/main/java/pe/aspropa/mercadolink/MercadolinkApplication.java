package pe.aspropa.mercadolink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Entry point for the MercadoLink / Aspropa B2B platform.
 *
 * <p>This is a single self-contained Spring Boot application that exposes a REST API,
 * persists data in an embedded H2 database and integrates (in simulated mode) with
 * the Izipay payments gateway. Everything required to run the platform ships inside
 * the produced fat-jar so the deployment is just {@code java -jar mercadolink-b2b.jar}.
 */
@SpringBootApplication
@EnableAsync
public class MercadolinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(MercadolinkApplication.class, args);
    }
}
