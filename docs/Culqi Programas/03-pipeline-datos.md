# Plan de Pipeline de Datos y Tiempo Real

## 1. Flujo de datos end-to-end

```
[Ventas ERP] -> [H2] -> [Spring Boot] -> [API] -> [React]
                                              ▲
[Web Scraping] -> [Python ETL] -> [FastAPI] ----┘
                                         ▲
                              [Feature Service JPA]
```

## 2. Capas de ingest

### 2.1 Batch (diario, 02:00 AM)
```java
// Spring @Scheduled
@Scheduled(cron = "0 0 2 * * *")
public void runDailyPricingJob() {
    1. Leer ventas del día anterior (H2)
    2. Actualizar rolling features (ventas_7d, ventas_14d)
    3. Si día = lunes: ejecutar retraining
    4. Pre-generar predicciones para productos top 500
    5. Guardar en PrediccionCache
    6. Emitir evento PricingUpdatedEvent
}
```

### 2.2 Near-real-time (5 minutos)
```java
@Scheduled(cron = "0 */5 * * * *")
public void runNearRealTimeJob() {
    1. Leer snapshot de competencia (scraping batch previo)
    2. Para productos con stock < umbral:
        a. Recalcular predicción
        b. Verificar reglas de margen
        c. Actualizar cache
    3. Detectar desviaciones de precio > 15% vs competencia
}
```

### 2.3 Event-driven (WebSocket)
```java
// Solo para frontend, no crítico para modelo
@EventListener
public void onPricingUpdated(PricingUpdatedEvent event) {
    messagingTemplate.convertAndSend("/topic/pricing", event.getPayload());
}
```

## 3. Feature store (JPA + vistas)

### 3.1 Tabla features_producto (vista materializada)
```sql
CREATE VIEW features_producto AS
SELECT 
    p.id as producto_id,
    p.precio as precio_actual,
    p.costo as costo_unitario,
    COALESCE(SUM(CASE WHEN v.fecha >= CURRENT_DATE - 7 THEN v.cantidad ELSE 0 END), 0) as ventas_7d,
    COALESCE(SUM(CASE WHEN v.fecha >= CURRENT_DATE - 14 THEN v.cantidad ELSE 0 END), 0) as ventas_14d,
    COALESCE(AVG(CASE WHEN v.fecha >= CURRENT_DATE - 14 THEN v.precio ELSE NULL END), p.precio) as precio_promedio_14d,
    CURRENT_DATE - MAX(v.fecha) as dias_desde_ultima_venta
FROM producto p
LEFT JOIN venta v ON v.producto_id = p.id
GROUP BY p.id, p.precio, p.costo;
```

### 3.2 Materialización en Spring
```java
@Entity
@Immutable  // Hibernate: read-only, no flush
@Subselect("SELECT * FROM features_producto")
public class FeatureProducto {
    @Id
    private Long productoId;
    private BigDecimal precioActual;
    private BigDecimal costoUnitario;
    private Integer ventas7d;
    private Integer ventas14d;
    private BigDecimal precioPromedio14d;
    private Integer diasDesdeUltimaVenta;
}
```

## 4. Scraping competencia (seguro, no bloqueante)

### 4.1 Diseño
```python
# Python ETL
class CompetitorScraper:
    def scrape_mercadolibre(query: str) -> List[PricingSignal]:
        # Proxy rotativo / delay aleatorio
        # Validar selector CSS
        # Extraer precio, url, disponibilidad
        # Retornar objeto, NO guardar directamente
```

### 4.2 Pipeline en capas
```python
1. Fetch: HTTP requests con timeout 10s, retry 2x (backoff 2s)
2. Parse: BeautifulSoup / Selectolax
3. Validate: 
   - precio > 0
   - precio < umbral_categoria * 3
   - titulo contiene producto similar (fuzzy match > 0.7)
4. Normalize:
   - currency (PEN/USD) -> BigDecimal
   - normalize a unidades (caja/unidad)
5. Store: INSERT competencia_precio (upsert por producto+fuente+url)
6. Alert: Si cambio > 20% en 1 día -> alert
```

### 4.3 Límites y seguridad
```java
// En Spring, rate limiting
@Component
public class ScrapingRateLimiter {
    private final RateLimiter rateLimiter = RateLimiter.create(10); // max 10 concurrencia
    
    public CompletableFuture<List<CompetenciaPrecio>> scrapeBatch(List<String> queries) {
        return CompletableFuture.supplyAsync(() -> 
            queries.parallelStream()
                .map(q -> rateLimiter.acquire(() -> scraper.scrape(q)))
                .toList()
        );
    }
}
```

## 5. Tiempo real vs latencia aceptable

| Operación | Target | Estrategia |
|-----------|--------|-----------|
| Leer predicción cache | < 10ms | Caffeine cache |
| Generar predicción (modelo) | < 100ms | Cargar modelo una vez en memoria |
| Batch 1000 productos | < 5s | Paralelizar con ForkJoinPool |
| Retraining | < 30 min | Ventana nocturna, no bloqueante |
| Scraping competencia | < 2 min por query | Async, timeout estricto |

## 6. Scheduler y jobs idempotentes

```java
@Slf4j
@Component
public class PricingJobOrchestrator {
    
    @Scheduled(cron = "0 0 2 * * *")
    @Async("pricingExecutor")
    public void dailyPricingJob() {
        log.info("Inicio dailyPricingJob - {}", LocalDateTime.now());
        try {
            // 1. Features
            featureService.updateRollingFeatures();
            // 2. Predicciones batch
            predictionService.repredictAllActive();
            // 3. Alertas
            alertService.checkAnomalies();
        } catch (Exception e) {
            log.error("Fallo en dailyPricingJob", e);
            // No relanzar, siguiente ejecución lo intenta de nuevo
        }
    }
    
    @Scheduled(cron = "0 0/5 * * * *")
    public void nearRealTimePricing() {
        // Solo productos con stock < UMBRAL_STOCK
        predictionService.repredictLowStock();
    }
}
```

## 7. Manejo de datos huérfanos / inconsistentes

```java
@Transactional
public FeatureProducto getSafeFeature(Long productoId) {
    try {
        return featureProductoRepository.findById(productoId)
            .orElseThrow(() -> new ProductoNotFoundException(productoId));
    } catch (DataAccessException e) {
        log.warn("Fallo BD consultando features producto {}: {}", productoId, e.getMessage());
        return crearFeaturePorDefecto(productoId);
    }
}
```

## 8. Respaldo / auditoría

- Log estructurado JSON de cada predicción (producto, modelo_version, inputs, salida)
- Tabla `prediccion_log` con TTL 90 días (H2 no soporta TTL nativo, cleanup en job)
- No borrar histórico bruto (H2 no duele hasta ~1M filas en dev; prod migrar a PostgreSQL)
