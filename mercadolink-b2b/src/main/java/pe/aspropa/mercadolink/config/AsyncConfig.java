package pe.aspropa.mercadolink.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Pool dedicado para tareas asíncronas: envío de notificaciones, registro de
 * auditoría diferido y procesamiento del IPN de Izipay sin bloquear al cliente.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("mlink-async-");
        executor.initialize();
        return executor;
    }
}