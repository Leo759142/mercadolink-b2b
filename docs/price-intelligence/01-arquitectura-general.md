# Plan de Arquitectura - Sistema de Inteligencia de Precios

## 1. Objetivo
Sistema **dinámico, robusto y sin bugs** que prediga recomendaciones de productos para B2B, integrado al stack actual (Spring Boot 3 + React + H2).

## 2. Stack tecnológico (alineado al proyecto existente)

| Capa | Tecnología | Razón |
|------|-----------|-------|
| ML/Modelado | **Python 3.11 + scikit-learn + LightGBM/XGBoost** | Ligero, rápido en CPU, producción simple |
| API ML | **FastAPI** (separado o como módulo Spring) | Async, validación automática, OpenAPI |
| Backend | **Spring Boot 3 (Java 17)** existente | Ya usa H2, JWT, Thymeleaf, React proxy |
| Base de datos | **H2 (prod: PostgreSQL opcional)** | Ya configurado; mínimos cambios |
| Cache | **Caffeine (in-process) + opcional Redis** | Evita recomputar predicciones |
| Queue/Async | **Spring @Async + @Scheduled** | Sin dependencias externas inicialmente |
| Frontend | **React 18 existente** | Consume API; Thymeleaf legacy puede coexistir |
| Feature Store | **Tablas JPA + vistas materializadas H2** | Consistencia transaccional |

## 3. Arquitectura modular (sin romper el monolito actual)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Dashboard Precios                                        │
│  - Grid productos vs recomendaciones                         │
│  - Simulador "qué pasaría si...":                            │
│      * Cambio de precio propio                               │
│      * Cambio de precio competencia                          │
│  - Alertas                                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST + WebSocket (eventos)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              SPRING BOOT 3 (Backend existente)               │
│  - ProductoController  / ProductoService                     │
│  - PriceIntelligenceController (nuevo)                      │
│  - PredictionService (nuevo)                                │
│  - CompetitorMonitorService (nuevo)                          │
│  - PricingRuleEngine (nuevo)                                 │
│  - FeatureService (nuevo)                                    │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│   ML SERVICE (FastAPI)   │   │   H2 / JPA Repository        │
│   - /predict             │   │   - productos                │
│   - /recommend           │   │   - precio_historico         │
│   - /train               │   │   - eventos_mercado          │
│   - /health              │   │   - reglas_precios            │
│   Modelos almacenados en │   │   - features_producto (vista) │
│   disco / MinIO local    │   └──────────────────────────────┘
└──────────────────────────┘
```

## 4. Bounded Contexts

1. **Core Pricing**: Cálculo precios actuales, reglas, márgenes.
2. **Intelligence**: Modelos, predicciones, recomendaciones.
3. **Monitoring**: Competencia, eventos de mercado, señales.

## 5. Principios de robustez

- **Fail-fast + defaults**: Si el modelo falla, caer a una regla simple (ej. precio promedio 7 días).
- **Circuit breaker** implícito con `@Async` + `@Scheduled` (sin dependencias extra).
- **Cache-first strategy**: Predicciones cacheadas por producto/canal/fecha.
- **Inmutabilidad de features**: No mutar estado en runtime; usar DTOs.
- **Idempotencia**: Mimic de eventos de precios puede re-ejecutarse sin side effects.

## 6. Roadmap rápido (fast MVP)

| Fase | Entregable | Tiempo estimado |
|------|-----------|-----------------|
| **Fase 1** | Modelo baseline (promedio histórico + estacionalidad) | 1 día |
| **Fase 2** | API FastAPI + endpoint `/predict` + integración Spring | 2 días |
| **Fase 3** | Feature store JPA + cache Caffeine | 1 día |
| **Fase 4** | Dashboard React básico + recomendaciones | 2 días |
| **Fase 5** | Simulador "qué pasaría si..." + alertas | 2 días |
| **Fase 6** | Modelo avanzado (LightGBM) + retraining automático | 2 días |
