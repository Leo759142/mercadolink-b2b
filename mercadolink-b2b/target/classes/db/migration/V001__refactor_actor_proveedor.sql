-- Migración: Vincular Actor ↔ Proveedor (Refactorización B2B)
-- Fecha: 2026-07-03
-- Descripción: Agrega columna actor_id a tabla proveedores para vincular 1:1 con Actor

-- 1. Agregar columna actor_id a proveedores
ALTER TABLE proveedores
ADD COLUMN actor_id VARCHAR(36) DEFAULT NULL;

-- 2. Agregar restricción única en actor_id
ALTER TABLE proveedores
ADD CONSTRAINT uk_proveedor_actor_id UNIQUE (actor_id);

-- 3. Agregar clave foránea
ALTER TABLE proveedores
ADD CONSTRAINT fk_proveedor_actor_id 
FOREIGN KEY (actor_id) REFERENCES actores(id) ON DELETE RESTRICT;

-- 4. Agregar campos de auditoría a proveedores
ALTER TABLE proveedores
ADD COLUMN fecha_aprobacion DATE DEFAULT NULL;

ALTER TABLE proveedores
ADD COLUMN aprobado_por VARCHAR(36) DEFAULT NULL;

-- 5. Agregar relación proveedor_id a actores
ALTER TABLE actores
ADD COLUMN proveedor_id VARCHAR(36) DEFAULT NULL;

ALTER TABLE actores
ADD CONSTRAINT uk_actor_proveedor_id UNIQUE (proveedor_id);

-- 6. Agregar campos de estado_item e fecha_surtimiento a items_pedido
ALTER TABLE items_pedido
ADD COLUMN estado_item VARCHAR(30) DEFAULT 'PENDIENTE';

ALTER TABLE items_pedido
ADD COLUMN fecha_surtimiento TIMESTAMP DEFAULT NULL;

-- Nota: Para ambiente de desarrollo con ddl-auto=create-drop, estos cambios se aplicarán automáticamente
-- Para producción, ejecutar este script manualmente
