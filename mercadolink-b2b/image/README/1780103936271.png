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
-- FIN DEL SCRIPT
-- ================================================================
