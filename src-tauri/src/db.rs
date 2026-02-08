use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = Self::get_db_path()?;
        let conn = Connection::open(db_path)?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        db.init_tables()?;

        Ok(db)
    }

    fn get_db_path() -> Result<PathBuf> {
        let app_data = dirs::data_dir()
            .ok_or_else(|| rusqlite::Error::InvalidPath(PathBuf::from("No data dir")))?
            .join("CafeteriaHub");

        std::fs::create_dir_all(&app_data)
            .map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e.to_string())))?;

        Ok(app_data.join("cajachoca.db"))
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Sessions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operator_name TEXT NOT NULL,
                opening_amount REAL NOT NULL,
                closing_amount REAL,
                opened_at TEXT NOT NULL DEFAULT (datetime('now')),
                closed_at TEXT,
                is_active INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )?;

        // Transactions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                transaction_number TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                amount REAL NOT NULL,
                concept TEXT NOT NULL,
                category_id INTEGER,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                created_by TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )",
            [],
        )?;

        // Categories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                is_active INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )?;

        // Insert default categories
        let default_categories = [
            ("Venta Cafetería", "income"),
            ("Reposición de Caja", "income"),
            ("Compra de Insumos", "expense"),
            ("Pago a Proveedores", "expense"),
            ("Reparación/Mantenimiento", "expense"),
            ("Gastos Varios", "expense"),
        ];

        for (name, category_type) in default_categories {
            conn.execute(
                "INSERT OR IGNORE INTO categories (name, type) VALUES (?1, ?2)",
                [name, category_type],
            )?;
        }

        Ok(())
    }

    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
}
