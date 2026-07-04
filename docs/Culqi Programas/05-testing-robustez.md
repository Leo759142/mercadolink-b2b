O1

# Plan de Testing y Robustez

## 1. Estrategia de testing en capas

### 1.1 Backend (Java / Spring Boot)

- **Unit**: JUnit 5 + Mockito (PredictionService, FeatureService, AlertService)
- **Integration**: @SpringBootTest con H2 en memoria (API endpoints)
- **Contract**: Spring Contract o manual (verificar schema de respuesta)

### 1.2 ML / Python

- **Unit**: pytest (feature engineering, validación, fallbacks)
- **Regression**: Fixtures CSV conocidos -> comparar MAPE vs baseline
- **Integration**: Testcontainers con H2? No necesario para ML aislado

### 1.3 Frontend

- **Unit**: React Testing Library (ProductoCard, SimuladorModal)
- **E2E manual / Cypress opcional**: happy path recomendaciones

## 2. Casos de prueba críticos

### 2.1 Sin datos históricos (producto nuevo)

```java
@Test
void predecir_producto_nuevo_devuelve_fallback() {
    // Producto sin ventas
    ProductoRecomendacionDTO dto = predictionService.predecir(999999L);
  
    assertThat(dto.recomendacion()).isEqualTo("MANTENER");
    assertThat(dto.precioOptimo()).isEqualByComparingTo(costo * 1.05);
    assertThat(dto.generadoEn()).isNotNull();
}
```

### 2.2 Competencia sin datos (scraping falló)

```java
@Test
void predecir_sin_competencia_usa_ultimo_conocido() {
    // No hay registros en competencia_precio para últimos 7 días
    ProductoRecomendacionDTO dto = predictionService.predecir(1L);
  
    // Solo usa features del producto e históricos propios
    assertThat(dto.precioOptimo()).isNotNull();
    assertThat(dto.motivo()).contains("Sin datos de competencia recientes");
}
```

### 2.3 Modelo retorna valor fuera de rango

```java
@Test
void predecir_valida_rangos_despues_de_modelo() {
    // Simular modelo que devuelve precio óptimo por debajo de costo
    when(model.predict(any())).thenReturn(Map.of("precio_optimo", costo.subtract(BigDecimal.valueOf(10))));
  
    ProductoRecomendacionDTO dto = predictionService.predecir(1L);
  
    // Debe caer a fallback
    assertThat(dto.precioOptimo()).isEqualByComparingTo(costo.multiply(new BigDecimal("1.05")));
    assertThat(dto.recomendacion()).isEqualTo("REVISAR_MARGEN");
}
```

### 2.4 Frontend sin datos de API

```tsx
it('muestra fallback cuando API falla', async () => {
  server.use(getPricing).reply(500);
  
  render(<RecomendacionesGrid />);
  
  await waitFor(() => {
    expect(screen.getByText('Sin recomendación disponible')).toBeInTheDocument();
  });
});
```

## 3. Circuit breaker / timeouts

### 3.1 ML Service (FastAPI)

```python
from circuitbreaker import circuit

@circuit(failure_threshold=10, recovery_timeout=60, expected_exception=Exception)
def call_model(features: dict) -> dict:
    return model.predict(features)
```

### 3.2 Spring Boot llamando a FastAPI

```java
@Component
public class MlServiceClient {
    private final WebClient webClient;
    private final MeterRegistry meterRegistry;
  
    public CompletableFuture<PredictResponse> predict(Long productoId, String canal) {
        return webClient.post()
            .uri("http://localhost:8000/predict")
            .bodyValue(new PredictRequest(productoId, canal))
            .retrieve()
            .bodyToMono(PredictResponse.class)
            .timeout(Duration.ofMillis(200))  // Timeout estricto
            .onErrorResume(e -> {
                meterRegistry.counter("ml.prediction.fallback").increment();
                return Mono.just(PredictResponse.fallback());
            })
            .toFuture();
    }
}
```

### 3.3 Scraping (Python)

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    reraise=True
)
def scrape_with_retry(url: str) -> str:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.text
```

## 4. Validaciones estrictas

### 4.1 Backend (Spring Boot validation)

```java
public record SimuladorRequest(
    @NotNull Long productoId,
    @PositiveOrZero BigDecimal nuevoPrecioPropio,
    @PositiveOrZero BigDecimal nuevoPrecioCompetencia,
    @Min(0) Integer nuevoStock
) {}
```

### 4.2 Python (Pydantic)

```python
class SimuladorRequest(BaseModel):
    producto_id: int = Field(gt=0)
    nuevo_precio_propio: float = Field(ge=0, default=None)
    nuevo_precio_competencia: float = Field(ge=0, default=None)
    nuevo_stock: int = Field(ge=0, default=None)
  
    @field_validator('nuevo_precio_propio')
    def precio_razonable(cls, v, info):
        if v is not None and v > 1_000_000:
            raise ValueError('Precio excesivo')
        return v
```

### 4.3 Negocio (reglas duras)

```java
public void validarReglasPrecio(BigDecimal precioPropuesto, BigDecimal costo) {
    BigDecimal margenMinimo = costo.multiply(new BigDecimal("1.02"));
  
    if (precioPropuesto.compareTo(margenMinimo) < 0) {
        throw new PrecioInvalidoException(
            "Precio propuesto %.2f está por debajo del margen mínimo %.2f"
                .formatted(precioPropuesto, margenMinimo)
        );
    }
}
```

## 5. Manejo de errores user-friendly

### 5.1 Backend

```java
@RestControllerAdvice
public class PricingExceptionHandler {
  
    @ExceptionHandler(ProductoNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ProductoNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ApiError("PRODUCTO_NO_ENCONTRADO", "Producto no existe en el sistema"));
    }
  
    @ExceptionHandler(TimeoutException.class)
    public ResponseEntity<ApiError> handleTimeout() {
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
            .body(new ApiError("TIMEOUT_PREDICCION", "El modelo tardó demasiado. Intente en 1 minuto."));
    }
  
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception e) {
        log.error("Error no esperado en pricing", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiError("ERROR_INTERNO", "Error interno. Contacte soporte."));
    }
}
```

### 5.2 Frontend

```tsx
// Manejo granular por operación
const loadRecomendaciones = async (ids?: number[]) => {
  try {
    const data = await fetchRecomendaciones(ids);
    setItems(data);
  } catch (err) {
    if (err.response?.status === 404) {
      toast.warning('Uno o más productos no existen');
    } else if (err.response?.status === 504) {
      toast.error('El modelo está procesando. Reintente en 1 minuto');
    } else {
      toast.error('Error al cargar recomendaciones');
    }
    // Nunca bloquear la UI
    setItems(prev => prev.map(it => it.error ? it : { ...it, loading: false }));
  }
};
```

## 6. Smoke tests / sanity checks (cada deploy)

```java
@SpringBootTest
class PricingSmokeTest {
  
    @Test
    void smoke_predecir_producto_existente() {
        ProductoRecomendacionDTO dto = restTemplate.getForObject(
            "/api/inteligencia-precios/producto/1/recomendacion", 
            ProductoRecomendacionDTO.class
        );
        assertThat(dto).isNotNull();
        assertThat(dto.precioOptimo()).isGreaterThan(BigDecimal.ZERO);
        assertThat(dto.recomendacion()).isIn("SUBIR", "BAJAR", "MANTENER", "REVISAR_MARGEN");
    }
  
    @Test
    void smoke_batch_200_productos() {
        List<Long> ids = IntStream.range(1, 201).boxed().map(Long::valueOf).toList();
        ResponseEntity<List> response = restTemplate.postForEntity(
            "/api/inteligencia-precios/producto/batch?ids=" + ids,
            null, List.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(200);
    }
  
    @Test
    void smoke_simulador() {
        SimuladorRequest req = new SimuladorRequest(1L, new BigDecimal("100.00"), null, null);
        SimuladorDTO result = restTemplate.postForObject(
            "/api/inteligencia-precios/simulador", req, SimuladorDTO.class
        );
        assertThat(result).isNotNull();
        assertThat(result.revenueActual()).isNotNull();
    }
}
```

## 7. Monitoreo post-deploy

```java
@Component
public class PricingHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            PredictionResult result = predictionService.smokeTest();
            return Health.up()
                .withDetail("model_version", result.version())
                .withDetail("latency_ms", result.latencyMs())
                .withDetail("coverage", result.coverage())
                .build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

## 8. Checklist anti-bugs (pre-merge)

- [ ] Fallback probado (modelo OFF, BD caída, competencia vacía)
- [ ] Timeout todas las llamadas HTTP (webclient, requests, scraping)
- [ ] No NPE: features null, DTOs vacíos, arrays size 0
- [ ] Frontend protegido contra JSON mal formado / campos faltantes
- [ ] Locks en predicción concurrente (producto duplicado → una sola predicción)
- [ ] Logs estructurados (JSON) para cada predicción fallida
- [ ] Métricas: contador de fallbacks, latencia P50/P95, cobertura
- [ ] Load test: 1000 productos batch < 10s
