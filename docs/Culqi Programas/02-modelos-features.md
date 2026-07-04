# Plan de Modelos ML y Features

## 1. Estrategia de modelado

### 1.1 Estacionales rápidas (MVP)
- **Media móvil ponderada por canal** (7, 14, 30 días)
- **Estacionalidad día-semana / mes** usando one-hot encoding
- **Regresión lineal simple** con Ridge/Lasso para evitar overfitting

### 1.2 Avanzado (Fase 6)
- **LightGBM Regressor**
- Predicción de: precio óptimo, elasticidad, probabilidad de venta, revenue estimado

## 2. Features obligatorias (sin bugs = features estables)

### 2.1 Producto
- `precio_actual`
- `costo_unitario`
- `margen_actual` = (precio - costo) / costo
- `stock_disponible`
- `categoria_id`
- `proveedor_id`

### 2.2 Tiempo
- `dia_semana` (0-6 one-hot)
- `mes` (0-11 one-hot)
- `es_feriado` (0/1)
- `dias_desde_ultimo_cambio_precio`

### 2.3 Mercado / Competencia
- `precio_competencia_promedio`
- `precio_competencia_min`
- `precio_competencia_max`
- `participacion_mercado_estimada` (proxy: ventas propias / ventas categoria)

### 2.4 Históricos suavizados
- `ventas_7d`, `ventas_14d`, `ventas_30d`
- `precio_promedio_7d`, `precio_promedio_14d`
- `elasticidad_precio_14d` (Δ% ventas / Δ% precio)

### 2.5 Targets (lo que predecir)
- `precio_optimo` (maximiza revenue sujeto a margen mínimo)
- `prob_venta` (0-1)
- `revenue_estimado_7d`
- `recomendacion` (clase: SUBIR, BAJAR, MANTENER)

## 3. Diseño del pipeline ML

```python
Pipeline diario (FastAPI @Scheduler):
1. Extract: Leer H2 -> pandas (JDBC)
2. Validate: 
   - no nulos en costo
   - precio > costo * 1.02
   - outliers por IQR o MAD
3. Feature engineering:
   - rolling stats
   - lags (price_lag_1, sales_lag_1)
   - diferencias (Δ precio Δ tiempo)
4. Train/Retrain (si semana = 1):
   - Split temporal (NO random)
   - TimeSeriesSplit (5 folds)
   - Metricas: MAE, MAPE, R2, SMAPE
   - Guardar modelo: /models/price_model_v{N}.pkl
   - Guardar metadata: fecha_entrenamiento, metricas, version_features
5. Predict:
   - Cargar último modelo
   - Aplicar mismo escaler/encoders que train
   - Cachear resultado
```

## 4. Robustez anti-bugs

### 4.1 Feature drift detection
```python
# En producción, cada predicción
drift_score = wasserstein_distance(train_prices, last_7d_prices)
if drift_score > THRESHOLD:
    alertar_drift()
    usar_modelo_fallback()
```

### 4.2 Fallback jerárquico
```
Nivel 1: LightGBM / XGBoost
Nivel 2: Regresión lineal entrenada en últimos 30 días
Nivel 3: Media móvil 14 días
Nivel 4: Regla simple (precio_actual * 1.05 si stock > 100)
```

### 4.3 Validación de entrada
```python
assert precio_optimo >= costo * 1.02, "Precio óptimo por debajo del margen mínimo"
assert precio_optimo <= precio_competencia_max * 1.1, "Desviación excesiva del mercado"
assert 0 <= prob_venta <= 1
```

### 4.4 Concurrencia
- Lock por `producto_id` al predecir (evita condiciones de carrera)
- Token bucket para llamadas API externas (competencia)
- Bulk predictions en batches de 500 (evita OOM)

## 5. Esquema JPA (H2)

```java
@Entity PrecioHistorico {
    Long id
    Long productoId
    BigDecimal precioVenta
    BigDecimal costo
    BigDecimal stock
    LocalDateTime fecha
    String canal  // B2B, MAYORISTA, etc.
}

@Entity EventoMercado {
    Long id
    Long productoId
    BigDecimal precioCompetenciaProm
    BigDecimal precioCompetenciaMin
    BigDecimal precioCompetenciaMax
    LocalDateTime fecha
    String fuente  // SCRAPING, API, MANUAL
}

@Entity ReglaPrecio {
    Long id
    String nombre
    BigDecimal margenMinimo
    BigDecimal margenMaximo
    BigDecimal factorEstacional
    Boolean activa
}

@Entity PrediccionCache {
    Long id
    Long productoId
    String versionModelo
    BigDecimal precioOptimo
    BigDecimal probVenta
    BigDecimal revenueEstimado
    String recomendacion  // SUBIR, BAJAR, MANTENER
    LocalDateTime generadoEn
    LocalDateTime expiraEn
}
```

## 6. Entrenamiento offline

```bash
# Script rápido (Python)
python -m src.train --days 90 --model lightgbm --output models/

# Backfill features
python -m src.backfill --start 2025-01-01 --end 2025-07-01
```

## 7. Métricas de éxito

| Métrica | Target |
|---------|--------|
| MAPE (precio óptimo) | < 8% |
| Coverage (productos con predicción) | > 95% |
| Latencia /predict | < 50ms (P95) |
| Tiempo retraining | < 30 min (90 días datos) |
| Disponibilidad | > 99.5% (fallback garantizado) |
