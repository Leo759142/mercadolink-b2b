-- ================================================================
-- Script SQL — Base de datos del sistema SOA Aspropa
-- Motor    : PostgreSQL 15+
-- Versión  : 1.0
-- Fecha    : 2026-04-25
-- ================================================================
-- Cubre los 5 procesos BPMN del mercado popular:
--   Top 2 — Reposición de stock        (inventario)
--   Top 3 — Gestión de pedidos         (pedidos)
--   Top 4 — Gestión de proveedores     (proveedores)
--   Top 5 — Logística y entrega        (logistica)
--   Transversal — Actores y auditoría
-- ================================================================

-- ----------------------------------------------------------------
-- Extensiones necesarias
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda difusa en nombres

-- ================================================================
-- SECCIÓN 1: ACTORES DEL SISTEMA
-- ================================================================

CREATE TABLE puestos (
    puesto_id       VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre          VARCHAR(100) NOT NULL,
    numero_puesto   VARCHAR(20)  NOT NULL UNIQUE,
    seccion         VARCHAR(50),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT chk_numero_puesto CHECK (numero_puesto ~ '^[A-Z]{1,3}-[0-9]{1,4}$')
);
COMMENT ON TABLE puestos IS 'Puestos físicos dentro del mercado popular Aspropa.';

CREATE TABLE vendedores (
    vendedor_id     VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    puesto_id       VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    nombre_completo VARCHAR(150) NOT NULL,
    dni             VARCHAR(15)  NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE vendedores IS 'Vendedores o dueños de cada puesto del mercado.';

CREATE TABLE encargados (
    encargado_id    VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre_completo VARCHAR(150) NOT NULL,
    dni             VARCHAR(15)  NOT NULL UNIQUE,
    rol             VARCHAR(50)  NOT NULL,  -- RECEPCION, ALMACEN, COMPRAS, ADMINISTRADOR
    email           VARCHAR(100),
    telefono        VARCHAR(20),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE encargados IS 'Personal encargado del mercado: recepción, almacén, compras y administración.';

-- ================================================================
-- SECCIÓN 2: CATÁLOGO DE PRODUCTOS
-- ================================================================

CREATE TABLE categorias_producto (
    categoria_id    SERIAL       PRIMARY KEY,
    nombre          VARCHAR(60)  NOT NULL UNIQUE,
    descripcion     TEXT
);
COMMENT ON TABLE categorias_producto IS 'Categorías de mercadería manejadas en el mercado.';

INSERT INTO categorias_producto (nombre) VALUES
    ('ABARROTES'), ('FRUTAS_VERDURAS'), ('CARNES_EMBUTIDOS'),
    ('LACTEOS'), ('LIMPIEZA'), ('BEBIDAS'), ('OTROS');

-- ================================================================
-- DATOS DE PRUEBA - PUESTOS
-- ================================================================

INSERT INTO puestos (puesto_id, numero_puesto, nombre, seccion) VALUES
    (gen_random_uuid()::TEXT, 'A-101', 'Frutas del Valle', 'SECCION_A'),
    (gen_random_uuid()::TEXT, 'A-102', 'Verduras Frescas', 'SECCION_A'),
    (gen_random_uuid()::TEXT, 'B-201', 'Carnes Premium', 'SECCION_B'),
    (gen_random_uuid()::TEXT, 'B-202', 'Abarrotes El Ahorro', 'SECCION_B'),
    (gen_random_uuid()::TEXT, 'C-301', 'Lácteos y Huevos', 'SECCION_C'),
    (gen_random_uuid()::TEXT, 'C-302', 'Limpieza Total', 'SECCION_C');

-- ================================================================
-- DATOS DE PRUEBA - VENDEDORES
-- ================================================================

INSERT INTO vendedores (vendedor_id, puesto_id, nombre_completo, dni, telefono, email)
SELECT gen_random_uuid()::TEXT, p.puesto_id,
    CASE p.numero_puesto
        WHEN 'A-101' THEN 'María González López'
        WHEN 'A-102' THEN 'Carlos Ramírez Mendoza'
        WHEN 'B-201' THEN 'Ana Patricia Torres Ruiz'
        WHEN 'B-202' THEN 'Luis Fernando Quispe Castro'
        WHEN 'C-301' THEN 'Rosa María Delgado Vásquez'
        WHEN 'C-302' THEN 'Jorge Armando Silva Ríos'
    END,
    CASE p.numero_puesto
        WHEN 'A-101' THEN '12345678'
        WHEN 'A-102' THEN '23456789'
        WHEN 'B-201' THEN '34567890'
        WHEN 'B-202' THEN '45678901'
        WHEN 'C-301' THEN '56789012'
        WHEN 'C-302' THEN '67890123'
    END,
    CASE p.numero_puesto
        WHEN 'A-101' THEN '987654321'
        WHEN 'A-102' THEN '987654322'
        WHEN 'B-201' THEN '987654323'
        WHEN 'B-202' THEN '987654324'
        WHEN 'C-301' THEN '987654325'
        WHEN 'C-302' THEN '987654326'
    END,
    CASE p.numero_puesto
        WHEN 'A-101' THEN 'maria.gonzalez@email.com'
        WHEN 'A-102' THEN 'carlos.ramirez@email.com'
        WHEN 'B-201' THEN 'ana.torres@email.com'
        WHEN 'B-202' THEN 'luis.quispe@email.com'
        WHEN 'C-301' THEN 'rosa.delgado@email.com'
        WHEN 'C-302' THEN 'jorge.silva@email.com'
    END
FROM puestos p;

-- ================================================================
-- DATOS DE PRUEBA - ENCARGADOS
-- ================================================================

INSERT INTO encargados (encargado_id, nombre_completo, dni, rol, email, telefono) VALUES
    (gen_random_uuid()::TEXT, 'Roberto Mendoza Silva', '11111111', 'ADMINISTRADOR', 'roberto.mendoza@aspropa.gob.pe', '999999999'),
    (gen_random_uuid()::TEXT, 'Patricia Gómez Ríos', '22222222', 'ALMACEN', 'patricia.gomez@aspropa.gob.pe', '999999998'),
    (gen_random_uuid()::TEXT, 'Miguel Torres Castro', '33333333', 'COMPRAS', 'miguel.torres@aspropa.gob.pe', '999999997'),
    (gen_random_uuid()::TEXT, 'Elena Quispe Fernández', '44444444', 'RECEPCION', 'elena.quispe@aspropa.gob.pe', '999999996');

-- ================================================================
-- DATOS DE PRUEBA - PRODUCTOS
-- ================================================================

INSERT INTO productos (producto_id, codigo, descripcion, categoria_id, unidad_medida, precio_referencia) VALUES
    (gen_random_uuid()::TEXT, 'PROD-0001', 'Plátanos Hass kg', 2, 'KG', 4.50),
    (gen_random_uuid()::TEXT, 'PROD-0002', 'Naranjas Naranjas kg', 2, 'KG', 3.20),
    (gen_random_uuid()::TEXT, 'PROD-0003', 'Papas Amarillas kg', 2, 'KG', 2.80),
    (gen_random_uuid()::TEXT, 'PROD-0004', 'Pollo entero kg', 3, 'KG', 12.50),
    (gen_random_uuid()::TEXT, 'PROD-0005', 'Carne molida res kg', 3, 'KG', 18.00),
    (gen_random_uuid()::TEXT, 'PROD-0006', 'Arroz Extra kg', 1, 'KG', 3.50),
    (gen_random_uuid()::TEXT, 'PROD-0007', 'Azúcar Blanca kg', 1, 'KG', 2.90),
    (gen_random_uuid()::TEXT, 'PROD-0008', 'Aceite Vegetal litro', 1, 'LITRO', 8.50),
    (gen_random_uuid()::TEXT, 'PROD-0009', 'Leche Evaporada lata', 4, 'UNIDAD', 3.80),
    (gen_random_uuid()::TEXT, 'PROD-0010', 'Huevos gallina roja docena', 4, 'DOCENA', 6.50),
    (gen_random_uuid()::TEXT, 'PROD-0011', 'Detergente Polvo kg', 5, 'KG', 4.20),
    (gen_random_uuid()::TEXT, 'PROD-0012', 'Inca Cola 500ml retornable', 6, 'UNIDAD', 2.00);

-- ================================================================
-- DATOS DE PRUEBA - STOCK ALMACÉN
-- ================================================================

INSERT INTO stock_almacen (stock_id, producto_id, cantidad_disponible)
SELECT gen_random_uuid()::TEXT, producto_id,
    CASE codigo
        WHEN 'PROD-0001' THEN 150
        WHEN 'PROD-0002' THEN 200
        WHEN 'PROD-0003' THEN 300
        WHEN 'PROD-0004' THEN 100
        WHEN 'PROD-0005' THEN 80
        WHEN 'PROD-0006' THEN 500
        WHEN 'PROD-0007' THEN 400
        WHEN 'PROD-0008' THEN 200
        WHEN 'PROD-0009' THEN 150
        WHEN 'PROD-0010' THEN 120
        WHEN 'PROD-0011' THEN 100
        WHEN 'PROD-0012' THEN 300
    END
FROM productos;

-- ================================================================
-- DATOS DE PRUEBA - STOCK PUESTO
-- ================================================================

INSERT INTO stock_puesto (stock_id, producto_id, puesto_id, cantidad_actual, cantidad_minima)
SELECT gen_random_uuid()::TEXT, pr.producto_id, pu.puesto_id,
    CASE 
        WHEN pr.codigo = 'PROD-0001' AND pu.numero_puesto = 'A-101' THEN 25
        WHEN pr.codigo = 'PROD-0002' AND pu.numero_puesto = 'A-101' THEN 15
        WHEN pr.codigo = 'PROD-0003' AND pu.numero_puesto = 'A-102' THEN 30
        WHEN pr.codigo = 'PROD-0004' AND pu.numero_puesto = 'B-201' THEN 10
        WHEN pr.codigo = 'PROD-0005' AND pu.numero_puesto = 'B-201' THEN 8
        WHEN pr.codigo = 'PROD-0006' AND pu.numero_puesto = 'B-202' THEN 50
        WHEN pr.codigo = 'PROD-0007' AND pu.numero_puesto = 'B-202' THEN 40
        WHEN pr.codigo = 'PROD-0008' AND pu.numero_puesto = 'B-202' THEN 20
        WHEN pr.codigo = 'PROD-0009' AND pu.numero_puesto = 'C-301' THEN 30
        WHEN pr.codigo = 'PROD-0010' AND pu.numero_puesto = 'C-301' THEN 15
        WHEN pr.codigo = 'PROD-0011' AND pu.numero_puesto = 'C-302' THEN 25
        WHEN pr.codigo = 'PROD-0012' AND pu.numero_puesto = 'C-302' THEN 60
        ELSE 5
    END,
    5
FROM productos pr
CROSS JOIN puestos pu
WHERE (pr.codigo LIKE 'PROD-0001' AND pu.numero_puesto IN ('A-101', 'A-102'))
   OR (pr.codigo LIKE 'PROD-0002' AND pu.numero_puesto = 'A-101')
   OR (pr.codigo = 'PROD-0003' AND pu.numero_puesto = 'A-102')
   OR (pr.codigo LIKE 'PROD-0004' AND pu.numero_puesto = 'B-201')
   OR (pr.codigo LIKE 'PROD-0005' AND pu.numero_puesto = 'B-201')
   OR (pr.codigo LIKE 'PROD-0006' AND pu.numero_puesto = 'B-202')
   OR (pr.codigo LIKE 'PROD-0007' AND pu.numero_puesto = 'B-202')
   OR (pr.codigo LIKE 'PROD-0008' AND pu.numero_puesto = 'B-202')
   OR (pr.codigo LIKE 'PROD-0009' AND pu.numero_puesto = 'C-301')
   OR (pr.codigo LIKE 'PROD-0010' AND pu.numero_puesto = 'C-301')
   OR (pr.codigo LIKE 'PROD-0011' AND pu.numero_puesto = 'C-302')
   OR (pr.codigo LIKE 'PROD-0012' AND pu.numero_puesto = 'C-302');

-- ================================================================
-- DATOS DE PRUEBA - PROVEEDORES
-- ================================================================

INSERT INTO proveedores (proveedor_id, razon_social, ruc, estado, nombre_contacto, telefono, email, direccion, distrito) VALUES
    (gen_random_uuid()::TEXT, 'Frutas del Campo S.A.', '20123456789', 'ACTIVO', 'Pedro Sánchez', '987654321', 'pedro.sanchez@frutasdelcampo.com', 'Av. Agraria 1234, Lima', 'San Juan de Lurigancho'),
    (gen_random_uuid()::TEXT, 'Carnes del Norte EIRL', '20234567890', 'ACTIVO', 'Liliana Rojas', '987654322', 'ventas@carnesdelnorte.com', 'Jr. Carnes 567, Lima', 'Cercado de Lima'),
    (gen_random_uuid()::TEXT, 'Productos del Sur SAC', '20345678901', 'ACTIVO', 'Marco Paredes', '987654323', 'contacto@productosdelsur.com', 'Av. Producción 890, Lima', 'Villa El Salvador'),
    (gen_random_uuid()::TEXT, 'Distribuidora Lima S.A.', '20456789012', 'ACTIVO', 'Carmen Linares', '987654324', 'info@distrilima.com', 'Calle Mercado 456, Lima', 'Lince'),
    (gen_random_uuid()::TEXT, 'Huevos del Valle S.A.C.', '20567890123', 'EN_EVALUACION', 'Raúl Benavides', '987654325', 'raul@huevosdelvalle.com', 'Av. Avicola 789, Lima', 'Ate');

-- ================================================================
-- DATOS DE PRUEBA - PROVEEDOR-CATEGORÍAS
-- ================================================================

INSERT INTO proveedor_categorias (proveedor_id, categoria_id)
SELECT p.proveedor_id, cp.categoria_id
FROM proveedores p
JOIN categorias_producto cp ON (
    (p.razon_social = 'Frutas del Campo S.A.' AND cp.nombre IN ('FRUTAS_VERDURAS')) OR
    (p.razon_social = 'Carnes del Norte EIRL' AND cp.nombre IN ('CARNES_EMBUTIDOS')) OR
    (p.razon_social = 'Productos del Sur SAC' AND cp.nombre IN ('ABARROTES', 'LIMPIEZA')) OR
    (p.razon_social = 'Distribuidora Lima S.A.' AND cp.nombre IN ('LACTEOS', 'BEBIDAS')) OR
    (p.razon_social = 'Huevos del Valle S.A.C.' AND cp.nombre IN ('LACTEOS'))
);

-- ================================================================
-- DATOS DE PRUEBA - SOLICITUDES DE REPOSICIÓN
-- ================================================================

INSERT INTO solicitudes_reposicion (solicitud_id, producto_id, puesto_id, vendedor_id, cantidad_pedida, estado, atendida_internamente)
SELECT gen_random_uuid()::TEXT, pr.producto_id, pu.puesto_id, v.vendedor_id,
    CASE 
        WHEN pr.codigo = 'PROD-0001' THEN 20
        WHEN pr.codigo = 'PROD-0003' THEN 15
        WHEN pr.codigo = 'PROD-0006' THEN 30
    END,
    'PENDIENTE', FALSE
FROM productos pr
JOIN puestos pu ON pu.numero_puesto IN ('A-101', 'A-102', 'B-202')
JOIN vendedores v ON v.puesto_id = pu.puesto_id
WHERE pr.codigo IN ('PROD-0001', 'PROD-0003', 'PROD-0006');

-- ================================================================
-- DATOS DE PRUEBA - MOVIMIENTOS DE INVENTARIO
-- ================================================================

INSERT INTO movimientos_inventario (movimiento_id, producto_id, tipo_movimiento, cantidad, responsable_id, tipo_responsable)
SELECT gen_random_uuid()::TEXT, pr.producto_id, 'ENTRADA',
    CASE pr.codigo
        WHEN 'PROD-0001' THEN 500
        WHEN 'PROD-0002' THEN 400
        WHEN 'PROD-0003' THEN 600
        WHEN 'PROD-0004' THEN 200
        WHEN 'PROD-0005' THEN 150
        WHEN 'PROD-0006' THEN 1000
        WHEN 'PROD-0007' THEN 800
        WHEN 'PROD-0008' THEN 400
        WHEN 'PROD-0009' THEN 300
        WHEN 'PROD-0010' THEN 200
        WHEN 'PROD-0011' THEN 150
        WHEN 'PROD-0012' THEN 500
    END,
    e.encargado_id, 'ENCARGADO'
FROM productos pr
CROSS JOIN encargados e
WHERE e.rol = 'ALMACEN';

INSERT INTO movimientos_inventario (movimiento_id, producto_id, puesto_id, tipo_movimiento, cantidad, responsable_id, tipo_responsable)
SELECT gen_random_uuid()::TEXT, sp.producto_id, sp.puesto_id, 'SALIDA', 5,
    v.vendedor_id, 'VENDEDOR'
FROM stock_puesto sp
JOIN puestos p ON sp.puesto_id = p.puesto_id
JOIN vendedores v ON v.puesto_id = p.puesto_id
WHERE sp.cantidad_actual > 0;

CREATE TABLE productos (
    producto_id     VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    codigo          VARCHAR(30)  NOT NULL UNIQUE,
    descripcion     VARCHAR(200) NOT NULL,
    categoria_id    INTEGER      NOT NULL REFERENCES categorias_producto(categoria_id),
    unidad_medida   VARCHAR(20)  NOT NULL DEFAULT 'UNIDAD',
    precio_referencia NUMERIC(12,2),
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    fecha_registro  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE productos IS 'Catálogo maestro de productos comercializados en el mercado.';

-- ================================================================
-- SECCIÓN 3: INVENTARIO
-- (Servicio ActualizacionInventario — BPMN Top 2)
-- ================================================================

CREATE TABLE stock_puesto (
    stock_id            VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    producto_id         VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    puesto_id           VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    cantidad_actual     INTEGER      NOT NULL DEFAULT 0,
    cantidad_minima     INTEGER      NOT NULL DEFAULT 5,
    ultima_actualizacion TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stock_puesto UNIQUE (producto_id, puesto_id),
    CONSTRAINT chk_cantidad_actual  CHECK (cantidad_actual >= 0),
    CONSTRAINT chk_cantidad_minima  CHECK (cantidad_minima >= 0)
);
COMMENT ON TABLE stock_puesto IS 'Stock disponible por producto en cada puesto. Fuente de verdad para reposiciones.';

CREATE TABLE stock_almacen (
    stock_id            VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    producto_id         VARCHAR(36)  NOT NULL REFERENCES productos(producto_id) UNIQUE,
    cantidad_disponible INTEGER      NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_almacen CHECK (cantidad_disponible >= 0)
);
COMMENT ON TABLE stock_almacen IS 'Stock central del almacén del mercado, separado del stock de puestos.';

CREATE TABLE solicitudes_reposicion (
    solicitud_id    VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    producto_id     VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    puesto_id       VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    vendedor_id     VARCHAR(36)  NOT NULL REFERENCES vendedores(vendedor_id),
    cantidad_pedida INTEGER      NOT NULL,
    estado          VARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE',
    atendida_internamente BOOLEAN,
    fecha_solicitud TIMESTAMP    NOT NULL DEFAULT NOW(),
    observaciones   TEXT,
    CONSTRAINT chk_cantidad_solicitada CHECK (cantidad_pedida > 0),
    CONSTRAINT chk_estado_solicitud CHECK (estado IN (
        'PENDIENTE', 'ATENDIDA_INTERNA', 'DERIVADA_PROVEEDOR', 'COMPLETADA', 'CANCELADA'
    ))
);
COMMENT ON TABLE solicitudes_reposicion IS 'Solicitudes de reposición de stock generadas por vendedores de puesto.';

CREATE TABLE movimientos_inventario (
    movimiento_id   VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    producto_id     VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    puesto_id       VARCHAR(36)  REFERENCES puestos(puesto_id),
    tipo_movimiento VARCHAR(20)  NOT NULL,
    cantidad        INTEGER      NOT NULL,
    referencia_id   VARCHAR(36),  -- pedido_id, solicitud_id, recepcion_id según contexto
    tipo_referencia VARCHAR(30),
    responsable_id  VARCHAR(36)  NOT NULL,
    tipo_responsable VARCHAR(30) NOT NULL,
    timestamp_mov   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tipo_movimiento CHECK (tipo_movimiento IN (
        'ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION'
    )),
    CONSTRAINT chk_cantidad_movimiento CHECK (cantidad > 0)
);
COMMENT ON TABLE movimientos_inventario IS 'Registro auditado de todos los movimientos de inventario del sistema.';

CREATE INDEX idx_mov_producto  ON movimientos_inventario(producto_id);
CREATE INDEX idx_mov_timestamp ON movimientos_inventario(timestamp_mov);
CREATE INDEX idx_mov_referencia ON movimientos_inventario(referencia_id);

-- ================================================================
-- SECCIÓN 4: PROVEEDORES
-- (Servicio GestionProveedores — BPMN Top 4)
-- ================================================================

CREATE TABLE proveedores (
    proveedor_id    VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    razon_social    VARCHAR(200) NOT NULL,
    ruc             VARCHAR(20)  NOT NULL UNIQUE,
    estado          VARCHAR(30)  NOT NULL DEFAULT 'EN_EVALUACION',
    nombre_contacto VARCHAR(150),
    telefono        VARCHAR(20),
    email           VARCHAR(100),
    direccion       VARCHAR(300),
    distrito        VARCHAR(100),
    fecha_registro  DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT chk_estado_proveedor CHECK (estado IN (
        'EN_EVALUACION', 'APROBADO', 'ACTIVO', 'SUSPENDIDO', 'DESCARTADO'
    ))
);
COMMENT ON TABLE proveedores IS 'Proveedores mayoristas que abastecen el mercado popular Aspropa.';

CREATE TABLE proveedor_categorias (
    id              SERIAL       PRIMARY KEY,
    proveedor_id    VARCHAR(36)  NOT NULL REFERENCES proveedores(proveedor_id),
    categoria_id    INTEGER      NOT NULL REFERENCES categorias_producto(categoria_id),
    fecha_asignacion DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_proveedor_categoria UNIQUE (proveedor_id, categoria_id)
);
COMMENT ON TABLE proveedor_categorias IS 'Categorías de productos que cada proveedor aprobado está autorizado a abastecer.';

CREATE TABLE cotizaciones (
    cotizacion_id   VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    proveedor_id    VARCHAR(36)  NOT NULL REFERENCES proveedores(proveedor_id),
    solicitante_id  VARCHAR(36)  NOT NULL,
    fecha_solicitud TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMP,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'ENVIADA',
    observaciones   TEXT,
    CONSTRAINT chk_estado_cotizacion CHECK (estado IN (
        'ENVIADA', 'RESPONDIDA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'
    ))
);

CREATE TABLE cotizacion_items (
    id              SERIAL       PRIMARY KEY,
    cotizacion_id   VARCHAR(36)  NOT NULL REFERENCES cotizaciones(cotizacion_id),
    producto_id     VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    precio_ofertado NUMERIC(12,2),
    cantidad_minima INTEGER,
    plazo_entrega_dias INTEGER,
    condiciones     TEXT
);
COMMENT ON TABLE cotizacion_items IS 'Ítems con precios y condiciones ofertados en cada cotización de proveedor.';

CREATE TABLE evaluaciones_proveedor (
    evaluacion_id   VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    proveedor_id    VARCHAR(36)  NOT NULL REFERENCES proveedores(proveedor_id),
    evaluador_id    VARCHAR(36)  NOT NULL REFERENCES encargados(encargado_id),
    puntaje_total   NUMERIC(4,2),
    cumple_calidad  BOOLEAN      NOT NULL,
    accion_tomada   VARCHAR(30),  -- MANTENER, APLICAR_RECLAMO, NEGOCIAR, REEMPLAZAR
    observaciones   TEXT,
    fecha_evaluacion DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT chk_puntaje CHECK (puntaje_total BETWEEN 0 AND 10)
);

CREATE TABLE evaluacion_criterios (
    id              SERIAL       PRIMARY KEY,
    evaluacion_id   VARCHAR(36)  NOT NULL REFERENCES evaluaciones_proveedor(evaluacion_id),
    criterio        VARCHAR(100) NOT NULL,  -- precio, calidad, puntualidad, cumplimiento
    puntaje         NUMERIC(4,2) NOT NULL,
    comentario      TEXT,
    CONSTRAINT chk_puntaje_criterio CHECK (puntaje BETWEEN 0 AND 10)
);
COMMENT ON TABLE evaluacion_criterios IS 'Detalle de criterios y puntajes de cada evaluación de desempeño de proveedor.';

CREATE TABLE experiencias_vendedor (
    experiencia_id  VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    proveedor_id    VARCHAR(36)  NOT NULL REFERENCES proveedores(proveedor_id),
    vendedor_id     VARCHAR(36)  NOT NULL REFERENCES vendedores(vendedor_id),
    calificacion    SMALLINT     NOT NULL,
    comentario      TEXT,
    fecha           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 5)
);
COMMENT ON TABLE experiencias_vendedor IS 'Reportes de experiencia de atención y calidad reportados por vendedores sobre proveedores.';

-- ================================================================
-- SECCIÓN 5: PEDIDOS
-- (Servicio GestionPedidos — BPMN Top 3)
-- ================================================================

CREATE TABLE pedidos (
    pedido_id           VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    idempotency_key     VARCHAR(36)  NOT NULL UNIQUE,
    vendedor_id         VARCHAR(36)  NOT NULL REFERENCES vendedores(vendedor_id),
    proveedor_id        VARCHAR(36)  REFERENCES proveedores(proveedor_id),
    encargado_id        VARCHAR(36)  REFERENCES encargados(encargado_id),
    estado              VARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE',
    monto_total         NUMERIC(14,2),
    fecha_creacion      TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_requerida     DATE,
    motivo_cancelacion  TEXT,
    solicitante_cancelacion VARCHAR(36),
    observaciones       TEXT,
    CONSTRAINT chk_estado_pedido CHECK (estado IN (
        'PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION',
        'ENVIADO', 'RECIBIDO_PARCIAL', 'ENTREGADO',
        'CANCELADO', 'CON_DIFERENCIA'
    ))
);
COMMENT ON TABLE pedidos IS 'Pedidos B2B generados por vendedores de puesto hacia almacén o proveedores mayoristas.';

CREATE INDEX idx_pedido_vendedor ON pedidos(vendedor_id);
CREATE INDEX idx_pedido_proveedor ON pedidos(proveedor_id);
CREATE INDEX idx_pedido_estado ON pedidos(estado);
CREATE INDEX idx_pedido_fecha ON pedidos(fecha_creacion);

CREATE TABLE items_pedido (
    item_id         SERIAL       PRIMARY KEY,
    pedido_id       VARCHAR(36)  NOT NULL REFERENCES pedidos(pedido_id),
    producto_id     VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    puesto_id       VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    cantidad        INTEGER      NOT NULL,
    precio_unitario NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    CONSTRAINT chk_cantidad_item CHECK (cantidad > 0),
    CONSTRAINT chk_precio_item   CHECK (precio_unitario >= 0)
);
COMMENT ON TABLE items_pedido IS 'Ítems que componen cada pedido B2B, con puesto destino para pedidos multi-puesto.';

CREATE TABLE diferencias_pedido (
    diferencia_id       SERIAL       PRIMARY KEY,
    pedido_id           VARCHAR(36)  NOT NULL REFERENCES pedidos(pedido_id),
    producto_id         VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    cantidad_pedida     INTEGER      NOT NULL,
    cantidad_recibida   INTEGER      NOT NULL,
    descripcion         TEXT,
    reportado_por       VARCHAR(36)  NOT NULL,
    tipo_reportante     VARCHAR(30)  NOT NULL,
    fecha_reporte       TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE diferencias_pedido IS 'Registro de diferencias o faltantes detectados al recibir pedidos.';

-- ================================================================
-- SECCIÓN 6: LOGÍSTICA Y RECEPCIÓN
-- (Servicio LogisticaEntrega — BPMN Top 5)
-- ================================================================

CREATE TABLE envios (
    envio_id            VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pedido_id           VARCHAR(36)  NOT NULL REFERENCES pedidos(pedido_id),
    proveedor_id        VARCHAR(36)  NOT NULL REFERENCES proveedores(proveedor_id),
    transportista       VARCHAR(150) NOT NULL,
    numero_guia         VARCHAR(60)  NOT NULL,
    fecha_despacho      TIMESTAMP    NOT NULL,
    fecha_estimada_entrega DATE,
    observaciones       TEXT
);
COMMENT ON TABLE envios IS 'Registros de envío generados por el proveedor o transportista al despachar mercadería.';

CREATE TABLE recepciones (
    recepcion_id        VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    pedido_id           VARCHAR(36)  NOT NULL REFERENCES pedidos(pedido_id),
    envio_id            VARCHAR(36)  REFERENCES envios(envio_id),
    encargado_id        VARCHAR(36)  NOT NULL REFERENCES encargados(encargado_id),
    estado_recepcion    VARCHAR(40)  NOT NULL,
    fecha_recepcion     TIMESTAMP    NOT NULL DEFAULT NOW(),
    observaciones       TEXT,
    CONSTRAINT chk_estado_recepcion CHECK (estado_recepcion IN (
        'CONFORME', 'CON_FALTANTE', 'CON_DANIO',
        'CON_DIFERENCIA_DE_PRECIO', 'DEVUELTO'
    ))
);
COMMENT ON TABLE recepciones IS 'Actas de recepción física de mercadería en el punto de ingreso del mercado.';

CREATE TABLE recepcion_items (
    id                  SERIAL       PRIMARY KEY,
    recepcion_id        VARCHAR(36)  NOT NULL REFERENCES recepciones(recepcion_id),
    producto_id         VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    cantidad_pedida     INTEGER      NOT NULL,
    cantidad_recibida   INTEGER      NOT NULL,
    estado_fisico       VARCHAR(30)  DEFAULT 'BUENO',
    CONSTRAINT chk_estado_fisico CHECK (estado_fisico IN ('BUENO', 'DETERIORADO', 'VENCIDO'))
);
COMMENT ON TABLE recepcion_items IS 'Detalle de ítems físicamente verificados en cada recepción de mercadería.';

CREATE TABLE no_conformidades (
    nc_id               VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    recepcion_id        VARCHAR(36)  NOT NULL REFERENCES recepciones(recepcion_id),
    tipo                VARCHAR(40)  NOT NULL,  -- FALTANTE, DANIO, DIFERENCIA_PRECIO, PRODUCTO_INCORRECTO
    descripcion         TEXT         NOT NULL,
    accion_requerida    VARCHAR(100),
    resuelta            BOOLEAN      NOT NULL DEFAULT FALSE,
    fecha_reporte       TIMESTAMP    NOT NULL DEFAULT NOW(),
    fecha_resolucion    TIMESTAMP
);
COMMENT ON TABLE no_conformidades IS 'Reporte de no conformidades detectadas en la recepción para seguimiento y resolución.';

CREATE TABLE distribuciones_internas (
    distribucion_id     VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    recepcion_id        VARCHAR(36)  NOT NULL REFERENCES recepciones(recepcion_id),
    responsable_id      VARCHAR(36)  NOT NULL REFERENCES encargados(encargado_id),
    fecha_distribucion  TIMESTAMP    NOT NULL DEFAULT NOW(),
    completada          BOOLEAN      NOT NULL DEFAULT FALSE
);
COMMENT ON TABLE distribuciones_internas IS 'Órdenes de distribución interna desde almacén hacia puestos del mercado.';

CREATE TABLE distribucion_items (
    id                  SERIAL       PRIMARY KEY,
    distribucion_id     VARCHAR(36)  NOT NULL REFERENCES distribuciones_internas(distribucion_id),
    producto_id         VARCHAR(36)  NOT NULL REFERENCES productos(producto_id),
    puesto_id           VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    cantidad            INTEGER      NOT NULL,
    CONSTRAINT chk_cantidad_dist CHECK (cantidad > 0)
);
COMMENT ON TABLE distribucion_items IS 'Ítems asignados a cada puesto dentro de una orden de distribución interna.';

CREATE TABLE confirmaciones_puesto (
    confirmacion_id     VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    distribucion_id     VARCHAR(36)  NOT NULL REFERENCES distribuciones_internas(distribucion_id),
    puesto_id           VARCHAR(36)  NOT NULL REFERENCES puestos(puesto_id),
    vendedor_id         VARCHAR(36)  NOT NULL REFERENCES vendedores(vendedor_id),
    cantidad_confirmada INTEGER      NOT NULL,
    cantidad_diferencia INTEGER      NOT NULL DEFAULT 0,
    conforme            BOOLEAN      NOT NULL,
    observaciones       TEXT,
    fecha_confirmacion  TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE confirmaciones_puesto IS 'Confirmaciones de recepción realizadas por el vendedor al recibir productos en su puesto.';

-- ================================================================
-- SECCIÓN 7: AUDITORÍA TRANSVERSAL
-- ================================================================

CREATE TABLE auditoria_operaciones (
    auditoria_id    BIGSERIAL    PRIMARY KEY,
    actor_id        VARCHAR(36)  NOT NULL,
    tipo_actor      VARCHAR(30)  NOT NULL,
    servicio        VARCHAR(80)  NOT NULL,
    operacion       VARCHAR(100) NOT NULL,
    referencia_id   VARCHAR(36),
    resultado       VARCHAR(20)  NOT NULL,  -- EXITO, ERROR, RECHAZADO
    detalle         TEXT,
    ip_origen       VARCHAR(45),
    timestamp_op    TIMESTAMP    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE auditoria_operaciones IS 'Registro transversal de todas las operaciones SOA para trazabilidad y auditoría fiscal.';

CREATE INDEX idx_auditoria_actor     ON auditoria_operaciones(actor_id);
CREATE INDEX idx_auditoria_servicio  ON auditoria_operaciones(servicio);
CREATE INDEX idx_auditoria_timestamp ON auditoria_operaciones(timestamp_op);

-- ================================================================
-- DATOS DE PRUEBA - COTIZACIONES
-- ================================================================

INSERT INTO cotizaciones (cotizacion_id, proveedor_id, solicitante_id, estado, observaciones)
SELECT gen_random_uuid()::TEXT, p.proveedor_id, e.encargado_id,
    CASE 
        WHEN p.razon_social = 'Frutas del Campo S.A.' THEN 'ACEPTADA'
        ELSE 'RESPONDIDA'
    END,
    CASE 
        WHEN p.razon_social = 'Frutas del Campo S.A.' THEN 'Cotización para abastecimiento semanal'
        ELSE 'Cotización mensual estándar'
    END
FROM proveedores p
CROSS JOIN encargados e
WHERE e.rol = 'COMPRAS'
LIMIT 2;

-- ================================================================
-- DATOS DE PRUEBA - ÍTEMS DE COTIZACIÓN
-- ================================================================

INSERT INTO cotizacion_items (cotizacion_id, producto_id, precio_ofertado, cantidad_minima, plazo_entrega_dias, condiciones)
SELECT c.cotizacion_id, pr.producto_id,
    pr.precio_referencia * (CASE WHEN p.razon_social = 'Frutas del Campo S.A.' THEN 0.9 ELSE 1.05 END),
    10, 2, 'Crédito 30 días'
FROM cotizaciones c
JOIN proveedores p ON c.proveedor_id = p.proveedor_id
JOIN categorias_producto cp ON cp.nombre IN ('FRUTAS_VERDURAS', 'ABARROTES', 'LIMPIEZA')
JOIN productos pr ON pr.categoria_id = cp.categoria_id
LIMIT 6;

-- ================================================================
-- DATOS DE PRUEBA - EVALUACIONES DE PROVEEDOR
-- ================================================================

INSERT INTO evaluaciones_proveedor (evaluacion_id, proveedor_id, evaluador_id, puntaje_total, cumple_calidad, accion_tomada, observaciones)
SELECT gen_random_uuid()::TEXT, p.proveedor_id, e.encargado_id, 8.5, TRUE, 'MANTENER', 'Proveedor cumplidor'
FROM proveedores p
CROSS JOIN encargados e
WHERE e.rol = 'COMPRAS'
LIMIT 4;

-- ================================================================
-- DATOS DE PRUEBA - CRITERIOS DE EVALUACIÓN
-- ================================================================

INSERT INTO evaluacion_criterios (evaluacion_id, criterio, puntaje, comentario)
SELECT ev.evaluacion_id,
    CASE ev.puntaje_total * (ev.evaluacion_id::INTEGER % 4)
        WHEN 0 THEN 'precio'
        WHEN 1 THEN 'calidad'
        WHEN 2 THEN 'puntualidad'
        ELSE 'cumplimiento'
    END,
    CASE ev.puntaje_total * (ev.evaluacion_id::INTEGER % 4)
        WHEN 0 THEN 9.0
        WHEN 1 THEN 8.5
        WHEN 2 THEN 8.0
        ELSE 7.5
    END,
    'Cumple el criterio según evaluación'
FROM evaluaciones_proveedor ev;

-- ================================================================
-- DATOS DE PRUEBA - EXPERIENCIAS DE VENDEDOR
-- ================================================================

INSERT INTO experiencias_vendedor (experiencia_id, proveedor_id, vendedor_id, calificacion, comentario)
SELECT gen_random_uuid()::TEXT, p.proveedor_id, v.vendedor_id, 5, 'Atención excelente'
FROM proveedores p
JOIN vendedores v ON v.puesto_id IN (SELECT puesto_id FROM puestos WHERE numero_puesto IN ('A-101', 'B-201', 'C-301'))
LIMIT 6;

-- ================================================================
-- DATOS DE PRUEBA - PEDIDOS
-- ================================================================

INSERT INTO pedidos (pedido_id, idempotency_key, vendedor_id, encargado_id, estado, monto_total, fecha_requerida)
SELECT gen_random_uuid()::TEXT, gen_random_uuid()::TEXT, v.vendedor_id, e.encargado_id,
    CASE v.puesto_id::INTEGER % 4
        WHEN 0 THEN 'ENTREGADO'
        WHEN 1 THEN 'CONFIRMADO'
        WHEN 2 THEN 'EN_PREPARACION'
        ELSE 'PENDIENTE'
    END, 150.00, CURRENT_DATE + INTERVAL '3 days'
FROM vendedores v
CROSS JOIN encargados e
WHERE e.rol = 'ALMACEN'
LIMIT 4;

-- ================================================================
-- DATOS DE PRUEBA - ÍTEMS DE PEDIDO
-- ================================================================

INSERT INTO items_pedido (pedido_id, producto_id, puesto_id, cantidad, precio_unitario)
SELECT p.pedido_id, pr.producto_id, pu.puesto_id, 10, pr.precio_referencia
FROM pedidos p
JOIN vendedores v ON p.vendedor_id = v.vendedor_id
JOIN puestos pu ON v.puesto_id = pu.puesto_id
JOIN productos pr ON pr.codigo = 'PROD-0006';

-- ================================================================
-- DATOS DE PRUEBA - ENVÍOS
-- ================================================================

INSERT INTO envios (envio_id, pedido_id, proveedor_id, transportista, numero_guia, fecha_despacho, fecha_estimada_entrega, observaciones)
SELECT gen_random_uuid()::TEXT, p.pedido_id, prv.proveedor_id, 'Transportes Andinos S.A.', 
    'GUIA-' || substring(p.pedido_id::TEXT, 1, 8),
    p.fecha_creacion + INTERVAL '1 day', p.fecha_requerida, 'Entrega programada'
FROM pedidos p
CROSS JOIN proveedores prv
WHERE prv.razon_social = 'Frutas del Campo S.A.' AND p.estado = 'ENTREGADO';

-- ================================================================
-- DATOS DE PRUEBA - RECEPCIONES
-- ================================================================

INSERT INTO recepciones (recepcion_id, pedido_id, encargado_id, estado_recepcion, observaciones)
SELECT gen_random_uuid()::TEXT, p.pedido_id, e.encargado_id, 'CONFORME', 'Recepción completada sin observaciones'
FROM pedidos p
CROSS JOIN encargados e
WHERE e.rol = 'RECEPCION' AND p.estado = 'ENTREGADO';

-- ================================================================
-- DATOS DE PRUEBA - ÍTEMS DE RECEPCIÓN
-- ================================================================

INSERT INTO recepcion_items (recepcion_id, producto_id, cantidad_pedida, cantidad_recibida, estado_fisico)
SELECT r.recepcion_id, ip.producto_id, ip.cantidad, ip.cantidad - 1, 'BUENO'
FROM recepciones r
JOIN pedidos p ON r.pedido_id = p.pedido_id
JOIN items_pedido ip ON ip.pedido_id = p.pedido_id;

-- ================================================================
-- DATOS DE PRUEBA - DISTRIBUCIONES INTERNAS
-- ================================================================

INSERT INTO distribuciones_internas (distribucion_id, recepcion_id, responsable_id, completada)
SELECT gen_random_uuid()::TEXT, r.recepcion_id, e.encargado_id, TRUE
FROM recepciones r
CROSS JOIN encargados e
WHERE e.rol = 'ALMACEN';

-- ================================================================
-- DATOS DE PRUEBA - ÍTEMS DE DISTRIBUCIÓN
-- ================================================================

INSERT INTO distribucion_items (distribucion_id, producto_id, puesto_id, cantidad)
SELECT d.distribucion_id, ri.producto_id, p.puesto_id, ri.cantidad_recibida / 3
FROM distribuciones_internas d
JOIN recepciones r ON d.recepcion_id = r.recepcion_id
JOIN recepcion_items ri ON r.recepcion_id = ri.recepcion_id
CROSS JOIN puestos p
WHERE p.numero_puesto IN ('B-202', 'C-301');

-- ================================================================
-- DATOS DE PRUEBA - CONFIRMACIONES DE PUESTO
-- ================================================================

INSERT INTO confirmaciones_puesto (confirmacion_id, distribucion_id, puesto_id, vendedor_id, cantidad_confirmada, conforme, observaciones)
SELECT gen_random_uuid()::TEXT, d.distribucion_id, p.puesto_id, v.vendedor_id, di.cantidad, TRUE, 'Confirmación exitosa'
FROM distribuciones_internas d
JOIN distribucion_items di ON d.distribucion_id = di.distribucion_id
JOIN puestos p ON di.puesto_id = p.puesto_id
JOIN vendedores v ON v.puesto_id = p.puesto_id;

-- ================================================================
-- DATOS DE PRUEBA - NO CONFORMIDADES
-- ================================================================

INSERT INTO no_conformidades (nc_id, recepcion_id, tipo, descripcion, accion_requerida, resuelta)
SELECT gen_random_uuid()::TEXT, r.recepcion_id, 'FALTANTE', 'Producto faltante reportado en la entrega', 'Reemplazar producto', FALSE
FROM recepciones r
LIMIT 2;

-- ================================================================
-- DATOS DE PRUEBA - REGISTROS DE AUDITORÍA
-- ================================================================

INSERT INTO auditoria_operaciones (actor_id, tipo_actor, servicio, operacion, referencia_id, resultado, detalle, ip_origen)
SELECT 
    CASE a.actor_type
        WHEN 'VENDEDOR' THEN v.vendedor_id
        WHEN 'ENCARGADO' THEN e.encargado_id
        ELSE p.proveedor_id
    END,
    a.actor_type,
    'GestionPedidos',
    a.operacion,
    gen_random_uuid()::TEXT,
    a.resultado,
    'Operación de prueba registrada en auditoría', '127.0.0.1'
FROM (
    VALUES 
        ('VENDEDOR', 'CREAR_PEDIDO', 'EXITO'),
        ('ENCARGADO', 'CONFIRMAR_PEDIDO', 'EXITO'),
        ('PROVEEDOR', 'ACTUALIZAR_ESTADO', 'ERROR'),
        ('VENDEDOR', 'CANCELAR_PEDIDO', 'RECHAZADO'),
        ('ENCARGADO', 'CONSULTAR_ESTADO', 'EXITO'),
        ('VENDEDOR', 'CREAR_PEDIDO', 'EXITO'),
        ('ENCARGADO', 'CONFIRMAR_PEDIDO', 'EXITO'),
        ('PROVEEDOR', 'ACTUALIZAR_ESTADO', 'EXITO'),
        ('VENDEDOR', 'CANCELAR_PEDIDO', 'ERROR'),
        ('ENCARGADO', 'CONSULTAR_ESTADO', 'RECHAZADO'),
        ('VENDEDOR', 'CREAR_PEDIDO', 'EXITO'),
        ('PROVEEDOR', 'ACTUALIZAR_ESTADO', 'RECHAZADO'),
        ('ENCARGADO', 'CONFIRMAR_PEDIDO', 'ERROR'),
        ('VENDEDOR', 'CONSULTAR_ESTADO', 'EXITO'),
        ('PROVEEDOR', 'CREAR_PEDIDO', 'ERROR')
) AS a(actor_type, operacion, resultado)
LEFT JOIN vendedores v ON a.actor_type = 'VENDEDOR'
LEFT JOIN encargados e ON a.actor_type = 'ENCARGADO'
LEFT JOIN proveedores p ON a.actor_type = 'PROVEEDOR';

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
