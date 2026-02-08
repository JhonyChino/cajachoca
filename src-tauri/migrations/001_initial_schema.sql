-- Cafetería Hub - Caja Chica Database Schema
-- Versión: 1.0.0
-- Fecha: 2024

-- Tabla: schema_version
-- Control de versiones del esquema
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabla: sessions (Jornadas de caja)
-- Almacena las sesiones/jornadas de caja activas e históricas
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_name TEXT NOT NULL,                    -- Nombre del operador responsable
    opening_amount REAL NOT NULL,                   -- Monto de apertura de caja
    closing_amount REAL,                            -- Monto de cierre (NULL si está activa)
    opened_at TEXT NOT NULL DEFAULT (datetime('now')), -- Fecha/hora de apertura
    closed_at TEXT,                                 -- Fecha/hora de cierre (NULL si está activa)
    is_active INTEGER NOT NULL DEFAULT 1            -- 1 = activa, 0 = cerrada
);

-- Tabla: categories (Categorías de transacciones)
-- Categorías predefinidas para clasificar ingresos y egresos
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                             -- Nombre de la categoría
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')), -- 'income' o 'expense'
    is_active INTEGER NOT NULL DEFAULT 1            -- 1 = activa, 0 = desactivada
);

-- Tabla: transactions (Transacciones)
-- Registro de todos los movimientos de caja
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,                    -- FK a sessions
    transaction_number TEXT UNIQUE NOT NULL,        -- Número único (TR-XXXX)
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')), -- Tipo: ingreso o egreso
    amount REAL NOT NULL,                           -- Monto de la transacción
    concept TEXT NOT NULL,                          -- Descripción/concepto
    category_id INTEGER,                            -- FK a categories (opcional)
    created_at TEXT NOT NULL DEFAULT (datetime('now')), -- Fecha/hora de creación
    created_by TEXT,                                -- Usuario que creó la transacción
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabla: backups (Metadatos de backups)
-- Registro de backups creados
CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,                         -- Nombre del archivo de backup
    filepath TEXT NOT NULL,                         -- Ruta completa al archivo
    created_at TEXT NOT NULL DEFAULT (datetime('now')), -- Fecha de creación
    size_bytes INTEGER NOT NULL,                    -- Tamaño en bytes
    description TEXT                                -- Descripción opcional
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_number ON transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- Datos iniciales: Categorías por defecto
INSERT OR IGNORE INTO categories (name, type) VALUES 
    ('Venta Cafetería', 'income'),
    ('Venta Evento Especial', 'income'),
    ('Reposición de Caja', 'income'),
    ('Abono Cliente', 'income'),
    ('Compra de Insumos', 'expense'),
    ('Pago a Proveedores', 'expense'),
    ('Reparación/Mantenimiento', 'expense'),
    ('Servilletas y Vasos', 'expense'),
    ('Gastos Varios', 'expense'),
    ('Retiro de Caja', 'expense');

-- Marcar migración inicial como aplicada
INSERT OR IGNORE INTO schema_version (version) VALUES (1);