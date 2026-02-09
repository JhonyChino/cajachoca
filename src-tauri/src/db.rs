use crate::models::{Category, DailySummary, Session, Transaction};
use rusqlite::{Connection, Result, Row};
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
        db.run_migrations()?;

        Ok(db)
    }

    fn get_db_path() -> Result<PathBuf> {
        let app_data = dirs::data_dir()
            .ok_or_else(|| rusqlite::Error::InvalidPath(PathBuf::from("No data dir")))?
            .join("CajaChoca");

        std::fs::create_dir_all(&app_data)
            .map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e.to_string())))?;

        Ok(app_data.join("cajachoca.db"))
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Sessions table - Jornadas de caja
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

        // Transactions table - Transacciones
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
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )",
            [],
        )?;

        // Categories table - Categorías predefinidas
        conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                is_active INTEGER NOT NULL DEFAULT 1
            )",
            [],
        )?;

        // Backups table - Metadatos de backups
        conn.execute(
            "CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                size_bytes INTEGER NOT NULL,
                description TEXT
            )",
            [],
        )?;

        // Schema version tracking
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )",
            [],
        )?;

        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_transactions_session ON transactions(session_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)",
            [],
        )?;

        Ok(())
    }

    fn run_migrations(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Check current version
        let current_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if current_version < 1 {
            // Migration 1: Insert default categories
            let default_categories = [
                ("Venta Cafetería", "income"),
                ("Venta Evento Especial", "income"),
                ("Reposición de Caja", "income"),
                ("Abono Cliente", "income"),
                ("Compra de Insumos", "expense"),
                ("Pago a Proveedores", "expense"),
                ("Reparación/Mantenimiento", "expense"),
                ("Servilletas y Vasos", "expense"),
                ("Gastos Varios", "expense"),
                ("Retiro de Caja", "expense"),
            ];

            for (name, category_type) in default_categories {
                conn.execute(
                    "INSERT OR IGNORE INTO categories (name, type) VALUES (?1, ?2)",
                    [name, category_type],
                )?;
            }

            // Mark migration as applied
            conn.execute("INSERT INTO schema_version (version) VALUES (1)", [])?;
        }

        Ok(())
    }

    pub fn get_connection(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }

    // Session operations
    pub fn create_session(&self, operator_name: &str, opening_amount: f64) -> Result<Session> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO sessions (operator_name, opening_amount, is_active) VALUES (?1, ?2, 1)",
            [operator_name, &opening_amount.to_string()],
        )?;

        let id = conn.last_insert_rowid();

        conn.query_row(
            "SELECT id, operator_name, opening_amount, closing_amount, opened_at, closed_at, is_active 
             FROM sessions WHERE id = ?1",
            [id],
            |row| self.row_to_session(row),
        )
    }

    pub fn get_active_session(&self) -> Result<Option<Session>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, operator_name, opening_amount, closing_amount, opened_at, closed_at, is_active 
             FROM sessions WHERE is_active = 1 ORDER BY opened_at DESC LIMIT 1"
        )?;

        let mut rows = stmt.query_map([], |row| self.row_to_session(row))?;

        Ok(rows.next().transpose()?)
    }

    pub fn close_session(&self, session_id: i64, closing_amount: f64) -> Result<Session> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "UPDATE sessions 
             SET closing_amount = ?1, closed_at = datetime('now'), is_active = 0 
             WHERE id = ?2",
            [&closing_amount.to_string(), &session_id.to_string()],
        )?;

        conn.query_row(
            "SELECT id, operator_name, opening_amount, closing_amount, opened_at, closed_at, is_active 
             FROM sessions WHERE id = ?1",
            [session_id],
            |row| self.row_to_session(row),
        )
    }

    pub fn get_session_by_id(&self, session_id: i64) -> Result<Session> {
        let conn = self.conn.lock().unwrap();

        conn.query_row(
            "SELECT id, operator_name, opening_amount, closing_amount, opened_at, closed_at, is_active 
             FROM sessions WHERE id = ?1",
            [session_id],
            |row| self.row_to_session(row),
        )
    }

    // Transaction operations
    pub fn create_transaction(
        &self,
        session_id: i64,
        transaction_type: &str,
        amount: f64,
        concept: &str,
        category_id: Option<i64>,
        created_by: &str,
    ) -> Result<Transaction> {
        let conn = self.conn.lock().unwrap();

        // Generate transaction number (TR-XXXX)
        let transaction_number = format!("TR-{}", self.generate_transaction_number(&conn)?);

        conn.execute(
            "INSERT INTO transactions 
             (session_id, transaction_number, type, amount, concept, category_id, created_by) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &session_id.to_string(),
                &transaction_number,
                transaction_type,
                &amount.to_string(),
                concept,
                &category_id.map(|id| id.to_string()).unwrap_or_default(),
                created_by,
            ],
        )?;

        let id = conn.last_insert_rowid();

        self.get_transaction_by_id_internal(&conn, id)
    }

    fn generate_transaction_number(&self, conn: &Connection) -> Result<String> {
        let count: i64 =
            conn.query_row("SELECT COUNT(*) FROM transactions", [], |row| row.get(0))?;

        Ok(format!("{:04}", 1000 + count + 1))
    }

    pub fn get_transaction_by_id(&self, id: i64) -> Result<Transaction> {
        let conn = self.conn.lock().unwrap();
        self.get_transaction_by_id_internal(&conn, id)
    }

    fn get_transaction_by_id_internal(&self, conn: &Connection, id: i64) -> Result<Transaction> {
        conn.query_row(
            "SELECT 
                t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.id = ?1",
            [id],
            |row| self.row_to_transaction(row),
        )
    }

    pub fn get_transactions(
        &self,
        session_id: Option<i64>,
        transaction_type: Option<&str>,
        start_date: Option<&str>,
        end_date: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Transaction>> {
        let conn = self.conn.lock().unwrap();

        let mut query = String::from(
            "SELECT 
                t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE 1=1",
        );

        let mut params: Vec<String> = Vec::new();

        if let Some(id) = session_id {
            query.push_str(" AND t.session_id = ?");
            params.push(id.to_string());
        }

        if let Some(t) = transaction_type {
            query.push_str(" AND t.type = ?");
            params.push(t.to_string());
        }

        if let Some(start) = start_date {
            query.push_str(" AND date(t.created_at) >= date(?)");
            params.push(start.to_string());
        }

        if let Some(end) = end_date {
            query.push_str(" AND date(t.created_at) <= date(?)");
            params.push(end.to_string());
        }

        query.push_str(" ORDER BY t.created_at DESC LIMIT ? OFFSET ?");
        params.push(limit.to_string());
        params.push(offset.to_string());

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> =
            params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();

        let transactions =
            stmt.query_map(param_refs.as_slice(), |row| self.row_to_transaction(row))?;

        transactions.collect::<Result<Vec<_>>>()
    }

    pub fn get_daily_summary(&self, date: &str) -> Result<DailySummary> {
        let conn = self.conn.lock().unwrap();

        let (total_income, income_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE type = 'income' AND date(created_at) = date(?)",
            [date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let (total_expense, expense_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE type = 'expense' AND date(created_at) = date(?)",
            [date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        // Get current balance from active session
        let current_balance: f64 = conn
            .query_row(
                "SELECT COALESCE(
                opening_amount + (
                    SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
                    FROM transactions WHERE session_id = sessions.id
                ), 0)
             FROM sessions 
             WHERE is_active = 1",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0.0);

        Ok(DailySummary {
            date: date.to_string(),
            total_income,
            total_expense,
            balance: total_income - total_expense,
            income_count,
            expense_count,
            current_balance,
        })
    }

    // Category operations
    pub fn get_categories(&self, category_type: Option<&str>) -> Result<Vec<Category>> {
        let conn = self.conn.lock().unwrap();

        let query = if let Some(t) = category_type {
            format!("SELECT id, name, type, is_active FROM categories WHERE type = '{}' AND is_active = 1", t)
        } else {
            "SELECT id, name, type, is_active FROM categories WHERE is_active = 1".to_string()
        };

        let mut stmt = conn.prepare(&query)?;
        let categories = stmt.query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                category_type: row.get(2)?,
                is_active: row.get(3)?,
            })
        })?;

        categories.collect::<Result<Vec<_>>>()
    }

    pub fn get_category_by_id(&self, id: i64) -> Result<Category> {
        let conn = self.conn.lock().unwrap();

        conn.query_row(
            "SELECT id, name, type, is_active FROM categories WHERE id = ?1",
            [id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    category_type: row.get(2)?,
                    is_active: row.get(3)?,
                })
            },
        )
    }

    pub fn create_category(&self, name: &str, category_type: &str) -> Result<Category> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO categories (name, type, is_active) VALUES (?1, ?2, 1)",
            [name, category_type],
        )?;

        let id = conn.last_insert_rowid();

        Ok(Category {
            id,
            name: name.to_string(),
            category_type: category_type.to_string(),
            is_active: true,
        })
    }

    pub fn update_category(&self, id: i64, name: &str) -> Result<Category> {
        {
            let conn = self.conn.lock().unwrap();
            conn.execute(
                "UPDATE categories SET name = ?1 WHERE id = ?2",
                [name, &id.to_string()],
            )?;
        } // Release lock here

        self.get_category_by_id(id)
    }

    pub fn delete_category(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // Soft delete - mark as inactive
        conn.execute(
            "UPDATE categories SET is_active = 0 WHERE id = ?1",
            [&id.to_string()],
        )?;

        Ok(())
    }

    // Helper functions
    fn row_to_session(&self, row: &Row) -> Result<Session> {
        Ok(Session {
            id: row.get(0)?,
            operator_name: row.get(1)?,
            opening_amount: row.get(2)?,
            closing_amount: row.get(3)?,
            opened_at: row.get(4)?,
            closed_at: row.get(5)?,
            is_active: row.get::<_, i64>(6)? != 0,
        })
    }

    fn row_to_transaction(&self, row: &Row) -> Result<Transaction> {
        Ok(Transaction {
            id: row.get(0)?,
            session_id: row.get(1)?,
            transaction_number: row.get(2)?,
            transaction_type: row.get(3)?,
            amount: row.get(4)?,
            concept: row.get(5)?,
            category_id: row.get(6)?,
            category_name: row.get(7)?,
            created_at: row.get(8)?,
            created_by: row.get(9)?,
        })
    }

    // Database backup/restore
    pub fn get_db_file_path(&self) -> Result<PathBuf> {
        Self::get_db_path()
    }

    pub fn record_backup(
        &self,
        filename: &str,
        filepath: &str,
        size_bytes: i64,
        description: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO backups (filename, filepath, size_bytes, description) VALUES (?1, ?2, ?3, ?4)",
            [filename, filepath, &size_bytes.to_string(), description.unwrap_or("")],
        )?;

        Ok(())
    }

    pub fn get_backup_history(
        &self,
        limit: i64,
    ) -> Result<Vec<(i64, String, String, String, i64, Option<String>)>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, filename, filepath, created_at, size_bytes, description 
             FROM backups ORDER BY created_at DESC LIMIT ?",
        )?;

        let backups = stmt.query_map([limit], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, Option<String>>(5)?,
            ))
        })?;

        backups.collect::<Result<Vec<_>>>()
    }
}
