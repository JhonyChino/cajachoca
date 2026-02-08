use crate::db::Database;
use crate::models::{CloseSessionRequest, CreateSessionRequest, DailySummary, Session};
use rusqlite::Result;

pub struct SessionService;

impl SessionService {
    /// Create a new cash register session
    pub fn create_session(db: &Database, request: CreateSessionRequest) -> Result<Session> {
        // Validate input
        if request.operator_name.trim().is_empty() {
            return Err(rusqlite::Error::InvalidParameterName(
                "El nombre del operador es requerido".to_string(),
            ));
        }

        if request.opening_amount < 0.0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "El monto de apertura no puede ser negativo".to_string(),
            ));
        }

        // Check if there's already an active session
        if let Ok(Some(_)) = db.get_active_session() {
            return Err(rusqlite::Error::InvalidParameterName(
                "Ya existe una sesión activa. Debe cerrar la sesión actual antes de abrir una nueva.".to_string()
            ));
        }

        db.create_session(&request.operator_name, request.opening_amount)
    }

    /// Get the currently active session
    pub fn get_active_session(db: &Database) -> Result<Option<Session>> {
        db.get_active_session()
    }

    /// Close an active session
    pub fn close_session(db: &Database, request: CloseSessionRequest) -> Result<Session> {
        // Validate input
        if request.closing_amount < 0.0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "El monto de cierre no puede ser negativo".to_string(),
            ));
        }

        // Verify session exists and is active
        let session = db.get_session_by_id(request.session_id)?;

        if !session.is_active {
            return Err(rusqlite::Error::InvalidParameterName(
                "La sesión ya está cerrada".to_string(),
            ));
        }

        db.close_session(request.session_id, request.closing_amount)
    }

    /// Get session summary with current balance
    pub fn get_session_summary(db: &Database, session_id: i64) -> Result<SessionSummary> {
        let session = db.get_session_by_id(session_id)?;

        // Calculate totals from transactions
        let conn = db.get_connection();
        let conn = conn.lock().unwrap();

        let (total_income, income_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE session_id = ? AND type = 'income'",
            [session_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let (total_expense, expense_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE session_id = ? AND type = 'expense'",
            [session_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        let current_balance = session.opening_amount + total_income - total_expense;
        let expected_closing = session.closing_amount.unwrap_or(current_balance);
        let closing_amount = session.closing_amount;

        Ok(SessionSummary {
            session,
            total_income,
            total_expense,
            income_count,
            expense_count,
            current_balance,
            expected_closing,
            difference: if closing_amount.is_some() {
                closing_amount.unwrap() - current_balance
            } else {
                0.0
            },
        })
    }

    /// Get today's summary
    pub fn get_today_summary(db: &Database) -> Result<DailySummary> {
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        db.get_daily_summary(&today)
    }

    /// Check if there's an active session
    pub fn has_active_session(db: &Database) -> Result<bool> {
        match db.get_active_session() {
            Ok(Some(_)) => Ok(true),
            Ok(None) => Ok(false),
            Err(e) => Err(e),
        }
    }
}

#[derive(Debug)]
pub struct SessionSummary {
    pub session: Session,
    pub total_income: f64,
    pub total_expense: f64,
    pub income_count: i64,
    pub expense_count: i64,
    pub current_balance: f64,
    pub expected_closing: f64,
    pub difference: f64,
}
