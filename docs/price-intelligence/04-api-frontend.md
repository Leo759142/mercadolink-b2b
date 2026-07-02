# Plan de API y Frontend

## 1. Estructura de controladores Spring (backend)

### 1.1 PriceIntelligenceController
```java
@RestController
@RequestMapping("/api/inteligencia-precios")
@Validated
public class PriceIntelligenceController {
    
    @GetMapping("/producto/{id}/recomendacion")
    public ResponseEntity<ProductoRecomendacionDTO> getRecomendacion(
            @PathVariable Long id,
            @RequestParam(defaultValue = "B2B") String canal) {
        
        // 1. Cache hit?
        PrediccionCache cache = prediccionCacheRepo.findTopByProductoIdAndExpiracionAfterOrderByIdDesc(id, now);
        if (cache != null && cache.getVersionModelo().equals(modeloVersionActual())) {
            return ResponseEntity.ok(mapear(cache));
        }
        
        // 2. Cache-miss: predecir
        return ResponseEntity.ok(predictionService.predecirProducto(id, canal));
    }
    
    @GetMapping("/producto/batch")
    public ResponseEntity<List<ProductoRecomendacionDTO>> batchRecomendaciones(
            @RequestParam List<Long> productoIds,
            @RequestParam(defaultValue = "50") int limit) {
        
        if (productoIds.size() > 200) {
            throw new ValidationException("Max 200 productos por batch");
        }
        
        List<ProductoRecomendacionDTO> resultados = new ArrayList<>();
        for (Long id : productoIds) {
            try {
                resultados.add(predictionService.predecirProducto(id, "B2B"));
            } catch (Exception e) {
                log.warn("Fallo predicción producto {}: {}", id, e.getMessage());
                resultados.add(ProductoRecomendacionDTO.fallback(id));
            }
        }
        return ResponseEntity.ok(resultados);
    }
    
    @PostMapping("/simulador")
    public ResponseEntity<SimuladorDTO> simular(@RequestBody SimuladorRequest request) {
        return ResponseEntity.ok(simulationService.simular(request));
    }
    
    @GetMapping("/alertas")
    public ResponseEntity<List<AlertaPrecioDTO>> alertas(
            @RequestParam(defaultValue = "7") int dias) {
        return ResponseEntity.ok(alertService.getAlertas(dias));
    }
}
```

### 1.2 DTOs principales (Java 17 record)
```java
public record ProductoRecomendacionDTO(
    Long id,
    String nombre,
    BigDecimal precioActual,
    BigDecimal precioOptimo,
    BigDecimal costoUnitario,
    BigDecimal margenActual,
    BigDecimal margenOptimo,
    String recomendacion,      // SUBIR, BAJAR, MANTENER
    BigDecimal probVenta,
    BigDecimal revenueEstimado7d,
    String motivo,             // "Stock bajo", "Competencia bajó 15%", etc.
    LocalDateTime generadoEn
) {}

public record SimuladorRequest(
    Long productoId,
    BigDecimal nuevoPrecioPropio,
    BigDecimal nuevoPrecioCompetencia,  // null = no cambiar
    Integer nuevoStock
) {}

public record SimuladorDTO(
    BigDecimal revenueActual,
    BigDecimal revenueSimulado,
    BigDecimal deltaRevenue,
    BigDecimal probVentaActual,
    BigDecimal probVentaSimulada,
    String impacto
) {}
```

## 2. API FastAPI (servicio ML)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import mlflow.pyfunc
import pandas as pd

app = FastAPI(title="Pricing Intelligence API")
model = mlflow.pyfunc.load_model("models:/price-model/Production")

class PredictRequest(BaseModel):
    producto_id: int
    canal: str = "B2B"
    precio_propuesto: float | None = None
    precio_competencia_override: float | None = None
    
    model_config = {"extra": "forbid"}

class PredictResponse(BaseModel):
    precio_optimo: float
    prob_venta: float
    revenue_estimado_7d: float
    recomendacion: str
    confianza: float = Field(ge=0, le=1)

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        features = feature_service.get(req.producto_id, req.canal)
        if features is None:
            raise ValueError(f"Sin features para producto {req.producto_id}")
        
        # Overrides opcionales
        if req.precio_propuesto is not None:
            features["precio_actual"] = req.precio_propuesto
        if req.precio_competencia_override is not None:
            features["precio_competencia_promedio"] = req.precio_competencia_override
        
        prediction = model.predict(pd.DataFrame([features]))[0]
        
        # Validación post-predicción
        costo = features.get("costo_unitario", 0)
        if prediction["precio_optimo"] < costo * 1.02:
            prediction["precio_optimo"] = costo * 1.05  # Fallback
            prediction["recomendacion"] = "REVISAR_MARGEN"
        
        return PredictResponse(**prediction)
    except Exception as e:
        log.error(f"Error predicting producto {req.producto_id}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}

@app.get("/model/metrics")
def model_metrics():
    return MODEL_METRICS
```

## 3. Frontend React

### 3.1 Componente principal: RecomendacionesGrid
```tsx
import { useEffect, useState } from 'react';
import { fetchRecomendaciones, fetchSimulador } from '../api/pricing';

export function RecomendacionesGrid() {
  const [items, setItems] = useState<ProductoRecomendacion[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadRecomendaciones();
  }, []);
  
  const loadRecomendaciones = async (ids?: number[]) => {
    setLoading(true);
    try {
      const data = await fetchRecomendaciones(ids);
      setItems(data);
    } catch (err) {
      // Mostrar toast amigable, no crash
      console.error(err);
      toast.error('Error cargando recomendaciones. Se mostrarán datos básicos.');
      setItems(items.map(it => ({ ...it, error: true })));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="grid">
      {items.map(item => (
        <ProductoCard
          key={item.id}
          data={item}
          onSimulate={(newPrice) => handleSimulate(item.id, newPrice)}
          onRefresh={() => loadRecomendaciones([item.id])}
        />
      ))}
    </div>
  );
}
```

### 3.2 ProductoCard (sin crashes)
```tsx
function ProductoCard({ data, onSimulate, onRefresh }: Props) {
  const [showSimulador, setShowSimulador] = useState(false);
  
  if (data.error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <h3>{data.nombre}</h3>
        <p className="text-red-600">Sin recomendación disponible</p>
        <button onClick={onRefresh} className="btn-sm">
          Reintentar
        </button>
      </div>
    );
  }
  
  const getBadge = () => {
    switch (data.recomendacion) {
      case 'SUBIR': return { text: 'Subir precio', color: 'green' };
      case 'BAJAR': return { text: 'Bajar precio', color: 'red' };
      default: return { text: 'Mantener', color: 'gray' };
    }
  };
  
  const badge = getBadge();
  
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{data.nombre}</h3>
          <p className="text-sm text-gray-500">Stock: {data.stock}</p>
        </div>
        <span className={`badge badge-${badge.color}`}>{badge.text}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4">
        <PricingField label="Precio actual" value={data.precioActual} />
        <PricingField label="Precio óptimo" value={data.precioOptimo} highlight />
        <PricingField label="Margen actual" value={`${data.margenActual}%`} />
        <PricingField label="Prob. venta" value={`${Math.round(data.probVenta * 100)}%`} />
      </div>
      
      <div className="mt-4 flex gap-2">
        <button onClick={() => setShowSimulador(true)} className="btn-secondary">
          Simular cambio
        </button>
        <button onClick={onRefresh} className="btn-sm text-gray-500">
          ↻
        </button>
      </div>
      
      {showSimulador && (
        <SimuladorModal
          productoId={data.id}
          precioActual={data.precioActual}
          onClose={() => setShowSimulador(false)}
          onResult={(result) => {
            toast.success(`Delta revenue: ${result.deltaRevenue}`);
            setShowSimulador(false);
          }}
        />
      )}
      
      {data.motivo && (
        <p className="text-xs text-blue-600 mt-2 italic">💡 {data.motivo}</p>
      )}
    </div>
  );
}
```

## 4. Simulador "qué pasaría si..."

### Backend
```java
@PostMapping("/simulador")
public SimuladorDTO simular(SimuladorRequest req) {
    // 1. Obtener features actuales
    FeatureProducto features = featureService.get(req.productoId());
    
    // 2. Modificar features según escenario
    if (req.nuevoPrecioPropio() != null) {
        features.setPrecioActual(req.nuevoPrecioPropio());
    }
    if (req.nuevoPrecioCompetencia() != null) {
        features.setPrecioCompetenciaPromedio(req.nuevoPrecioCompetencia());
    }
    if (req.nuevoStock() != null) {
        features.setStock(req.nuevoStock());
    }
    
    // 3. Predecir con features modificadas
    PrediccionDTO actual = modelService.predict(features);
    
    // 4. Modificar features para simulación
    if (req.nuevoPrecioPropio() != null) {
        features.setPrecioActual(req.nuevoPrecioPropio());
    }
    
    // 5. Predicción simulada
    PrediccionDTO simulada = modelService.predict(features);
    
    // 6. Comparar
    return new SimuladorDTO(
        actual.getRevenueEstimado7d(),
        simulada.getRevenueEstimado7d(),
        simulada.getRevenueEstimado7d().subtract(actual.getRevenueEstimado7d()),
        actual.getProbVenta(),
        simulada.getProbVenta(),
        clasificarImpacto(simulada.getRevenueEstimado7d(), actual.getRevenueEstimado7d())
    );
}
```

### Frontend
```tsx
function SimuladorModal({ productoId, precioActual, onClose, onResult }: Props) {
  const [miPrecio, setMiPrecio] = useState(precioActual);
  const [precioCompetencia, setPrecioCompetencia] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const simular = async () => {
    setLoading(true);
    try {
      const res = await fetchSimulador({
        productoId,
        nuevoPrecioPropio: miPrecio,
        nuevoPrecioCompetencia: precioCompetencia || undefined,
      });
      onResult(res);
    } catch (err) {
      toast.error('Error en simulación');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Simulador de precios</h3>
        
        <div className="space-y-4">
          <div>
            <label>Tu precio (S/)</label>
            <input 
              type="number" 
              value={miPrecio} 
              onChange={e => setMiPrecio(Number(e.target.value))}
              min={0}
              step={0.01}
            />
          </div>
          
          <div>
            <label>Precio competencia (S/) - opcional</label>
            <input 
              type="number" 
              value={precioCompetencia || ''} 
              onChange={e => setPrecioCompetencia(e.target.value ? Number(e.target.value) : null)}
              placeholder="Dejar vacío para mantener actual"
              min={0}
              step={0.01}
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={simular} disabled={loading} className="btn-primary">
            {loading ? 'Calculando...' : 'Simular'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 5. Alertas dinámicas

### Reglas configurables
```java
@Component
public class AlertaPricingRuleEngine {
    
    @Scheduled(cron = "0 */5 * * * *")
    public void evaluarAlertas() {
        List<ProductoRecomendacionDTO> recomendaciones = predictionService.getUltimasRecomendaciones();
        
        for (ProductoRecomendacionDTO r : recomendaciones) {
            List<Alerta> alertas = new ArrayList<>();
            
            // Regla 1: Margen bajo
            if (r.margenActual().compareTo(margenMinimo) < 0) {
                alertas.add(new Alerta("MARGEN_BAJO", r.productoId(), ...));
            }
            
            // Regla 2: Competencia bajó precio
            if (r.deltaCompetenciaPorcentaje() < -0.15) {
                alertas.add(new Alerta("COMPETENCIA_BAJO", r.productoId(), ...));
            }
            
            // Regla 3: Stock crítico + predicción de desabastecimiento
            if (r.stock() < UMBRAL_STOCK && r.probVenta() > 0.8) {
                alertas.add(new Alerta("STOCK_CRITICO", r.productoId(), ...));
            }
            
            // Regla 4: Oportunidad de mejora revenue
            if (r.revenueSimulado().compareTo(r.revenueActual()) > 0.10) {
                alertas.add(new Alerta("OPORTUNIDAD_REVENUE", r.productoId(), ...));
            }
            
            alertService.guardar(alertas);
        }
    }
}
```

## 6. Estructura de directorios (nuevos archivos)

```
mercadolink-b2b/src/main/java/pe/aspropa/mercadolink/
├── intelligence/
│   ├── controller/
│   │   └── PriceIntelligenceController.java
│   ├── service/
│   │   ├── PredictionService.java
│   │   ├── SimulationService.java
│   │   └── AlertService.java
│   ├── dto/
│   │   ├── ProductoRecomendacionDTO.java
│   │   ├── SimuladorDTO.java
│   │   └── AlertaPrecioDTO.java
│   └── repository/
│       ├── PrediccionCacheRepository.java
│       └── FeatureProductoRepository.java
│
mercadolink-b2b/src/main/resources/templates/
├── inteligencia-precios.html   (Thymeleaf fallback)
```

```
src/api/pricing/
├── __init__.py
├── main.py                     (FastAPI)
├── models/
│   ├── predictor.py
│   └── features.py
├── services/
│   ├── feature_store.py
│   ├── model_loader.py
│   └── scraper.py
└── schemas/
    ├── request.py
    └── response.py
```
