# Plan de Implementación Rápida (Días 1-10)

## Día 1: Feature store y baseline

### Tareas
1. Crear tablas `precio_historico`, `evento_mercado`, `prediccion_cache` en H2
2. Migrar datos existentes desde tablas de ventas (backfill script SQL o liquibase)
3. Implementar `FeatureProductoRepository` (vista materializada)
4. Implementar `PricingJobOrchestrator` con `@Scheduled` diario

### Entregables
- Migración SQL generada
- FeatureProducto cargada con últimos 90 días
- Job diario corriendo (log en consola)

## Día 2-3: Modelo baseline y API ML

### Tareas
1. Crear proyecto Python `mercadolink-pricing-ml/`
2. Implementar feature engineering: rolling stats, estacionalidad, lags
3. Entrenar modelo baseline (Ridge Regression)
4. Crear FastAPI `/predict` en puerto 8000
5. Conectar desde Spring Boot vía `WebClient` (timeout 200ms)

### Comandos rápidos
```bash
python -m venv venv
pip install fastapi uvicorn scikit-learn pandas pydantic
python -m src.train --days 90 --model ridge
uvicorn src.main:app --reload --port 8000
```

### Entregables
- POST http://localhost:8000/predict devuelve prediction JSON
- Spring Boot llama y guarda en `PrediccionCache`

## Día 4: Cache + endpoint batch

### Tareas
1. Agregar Caffeine cache para predicciones recientes (TTL 1 hora)
2. Implementar `batchRecomendaciones` (hasta 200 IDs)
3. Endpoint `/api/inteligencia-precios/producto/{id}/recomendacion`
4. Postman / curl tests

### Validación
```bash
curl -s http://localhost:8080/api/inteligencia-precios/producto/1/recomendacion | jq .
```

## Día 5: Dashboard React básico

### Tareas
1. Crear página `/inteligencia-precios` en React Router
2. Componente `RecomendacionesGrid` que consume API batch
3. Badges SUBIR/BAJAR/MANTENER + colores
4. Manejo de errores (toast + retry)

### Validación
- Abrir browser en `http://localhost:3000/inteligencia-precios`
- Ver grid con productos reales

## Día 6: Scraping competencia (opcional / paralelo)

### Tareas
1. Python ETL: `CompetitorScraper` para MercadoLibre (o proveedor propio)
2. Pipeline: fetch -> parse -> validate -> store (upsert H2)
3. Integrar como fuente `evento_mercado`

### Seguridad
- Proxies rotativos
- User-Agent realistas
- Delay 2-5s entre requests
- Timeout 10s

## Día 7: Alertas y reglas

### Tareas
1. `AlertService`: detectar margen bajo, competencia bajó, stock crítico
2. Endpoint `/api/inteligencia-precios/alertas`
3. UI de alertas (lista + badge "X nuevas")

## Día 8: Simulador "qué pasaría si..."

### Tareas
1. `SimulationService`: modificar features temporalmente y predecir
2. Endpoint `POST /simulador`
3. Modal React con precio propio / competencia input
4. Mostrar delta revenue

## Día 9: Modelo LightGBM (si datos suficientes)

### Tareas
1. Instalar `lightgbm` en Python
2. Entrenar con mismas features
3. Comparar MAPE vs Ridge
4. Si mejora > 1%: promover a Production

## Día 10: Docs + deploy

### Tareas
1. README de uso interno (cómo interpretar recomendaciones)
2. Runbook: qué hacer si el modelo deja de funcionar
3. Deploy a staging (jar + docker compose si aplica)
4. Smoke tests automáticos

## Dependencias Python (requirements.txt rápido)

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
scikit-learn==1.5.0
lightgbm==4.3.0
pandas==2.2.2
pydantic==2.7.0
requests==2.31.0
beautifulsoup4==4.12.3
```

## Dependencias Java (agregar a pom.xml)

```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
    <version>3.1.8</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
<dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-core</artifactId>
</dependency>
```

## Comandos de verificación final

```bash
# Backend
./mvnw spring-boot:run
curl -s http://localhost:8080/actuator/health

# ML service
python -m src.main
curl -s http://localhost:8000/health

# Frontend
npm start
# Abrir /inteligencia-precios

# Logs esperados
grep "dailyPricingJob" backend.log
grep "predict" ml.log
```
