# Índice - Plan de Inteligencia de Precios

Archivos:
- `01-arquitectura-general.md` - Stack, bounded contexts, roadmap
- `02-modelos-features.md` - Features, modelos ML, fallback jerárquico
- `03-pipeline-datos.md` - Batch, near-real-time, scraping, schedulers
- `04-api-frontend.md` - Controladores Spring, FastAPI, React components
- `05-testing-robustez.md` - Casos de prueba, circuit breakers, smoke tests
- `06-implementacion-rapida.md` - Días 1-10, comandos y verificación

Principios clave:
1. **Dinámico**: actualización diaria + near-real-time cada 5 min
2. **Lógico**: fallback jerárquico (4 niveles), siempre hay respuesta
3. **Sin bugs**: timeouts estrictos, validaciones duras, circuit breakers, tests obligatorios
