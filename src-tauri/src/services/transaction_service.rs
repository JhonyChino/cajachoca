use crate::db::Database;
use crate::models::{Category, CreateTransactionRequest, Transaction};
use crate::services::session_service::SessionService;
use rusqlite::Result;

pub struct TransactionService;

impl TransactionService {
    /// Create a new transaction (income or expense)
    pub fn create_transaction(
        db: &Database,
        request: CreateTransactionRequest,
    ) -> Result<Transaction> {
        // Validate input
        if request.concept.trim().is_empty() {
            return Err(rusqlite::Error::InvalidParameterName(
                "El concepto es requerido".to_string(),
            ));
        }

        if request.amount <= 0.0 {
            return Err(rusqlite::Error::InvalidParameterName(
                "El monto debe ser mayor a cero".to_string(),
            ));
        }

        // Validate transaction type
        if request.transaction_type != "income" && request.transaction_type != "expense" {
            return Err(rusqlite::Error::InvalidParameterName(
                "El tipo de transacción debe ser 'income' o 'expense'".to_string(),
            ));
        }

        // Verify session exists and is active
        match SessionService::get_active_session(db) {
            Ok(Some(session)) => {
                if session.id != request.session_id {
                    return Err(rusqlite::Error::InvalidParameterName(
                        "La sesión especificada no está activa".to_string(),
                    ));
                }
            }
            Ok(None) => {
                return Err(rusqlite::Error::InvalidParameterName(
                    "No hay una sesión activa".to_string(),
                ));
            }
            Err(e) => return Err(e),
        }

        // For expenses, verify there's enough balance
        if request.transaction_type == "expense" {
            let summary = SessionService::get_session_summary(db, request.session_id)?;
            if request.amount > summary.current_balance {
                return Err(rusqlite::Error::InvalidParameterName(format!(
                    "Saldo insuficiente. Balance actual: ${:.2}",
                    summary.current_balance
                )));
            }
        }

        // Validate category if provided
        if let Some(cat_id) = request.category_id {
            let category = db.get_category_by_id(cat_id)?;
            if category.category_type != request.transaction_type {
                return Err(rusqlite::Error::InvalidParameterName(
                    "La categoría no coincide con el tipo de transacción".to_string(),
                ));
            }
        }

        db.create_transaction(
            request.session_id,
            &request.transaction_type,
            request.amount,
            &request.concept,
            request.category_id,
            &request.created_by,
        )
    }

    /// Get a transaction by ID
    pub fn get_transaction_by_id(db: &Database, transaction_id: i64) -> Result<Transaction> {
        db.get_transaction_by_id(transaction_id)
    }

    /// Get transactions with filters and pagination
    pub fn get_transactions(
        db: &Database,
        session_id: Option<i64>,
        transaction_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<Transaction>, i64)> {
        // Get filtered transactions
        let transactions = db.get_transactions(
            session_id,
            transaction_type.as_deref(),
            start_date.as_deref(),
            end_date.as_deref(),
            limit,
            offset,
        )?;

        // Get total count for pagination
        let total_count =
            Self::get_transaction_count(db, session_id, transaction_type, start_date, end_date)?;

        Ok((transactions, total_count))
    }

    /// Get total count of transactions matching filters
    fn get_transaction_count(
        db: &Database,
        session_id: Option<i64>,
        transaction_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
    ) -> Result<i64> {
        let conn = db.get_connection();
        let conn = conn.lock().unwrap();

        let mut query = String::from("SELECT COUNT(*) FROM transactions WHERE 1=1");

        let mut params: Vec<String> = Vec::new();

        if let Some(id) = session_id {
            query.push_str(" AND session_id = ?");
            params.push(id.to_string());
        }

        if let Some(t) = transaction_type {
            query.push_str(" AND type = ?");
            params.push(t);
        }

        if let Some(start) = start_date {
            query.push_str(" AND date(created_at) >= date(?)");
            params.push(start);
        }

        if let Some(end) = end_date {
            query.push_str(" AND date(created_at) <= date(?)");
            params.push(end);
        }

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> =
            params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();

        stmt.query_row(param_refs.as_slice(), |row| row.get(0))
    }

    /// Get recent transactions for the dashboard
    pub fn get_recent_transactions(
        db: &Database,
        session_id: Option<i64>,
        limit: i64,
    ) -> Result<Vec<Transaction>> {
        db.get_transactions(session_id, None, None, None, limit, 0)
    }

    /// Get all categories
    pub fn get_all_categories(db: &Database) -> Result<Vec<Category>> {
        db.get_categories(None)
    }

    /// Get categories by type (income or expense)
    pub fn get_categories_by_type(db: &Database, category_type: String) -> Result<Vec<Category>> {
        if category_type != "income" && category_type != "expense" {
            return Err(rusqlite::Error::InvalidParameterName(
                "El tipo debe ser 'income' o 'expense'".to_string(),
            ));
        }

        db.get_categories(Some(&category_type))
    }

    /// Get today's transactions summary
    pub fn get_today_transactions_summary(db: &Database) -> Result<TransactionsSummary> {
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        Self::get_transactions_summary_by_date(db, &today)
    }

    /// Get transactions summary for a specific date
    pub fn get_transactions_summary_by_date(
        db: &Database,
        date: &str,
    ) -> Result<TransactionsSummary> {
        let conn = db.get_connection();
        let conn = conn.lock().unwrap();

        // Get income stats
        let (total_income, income_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE type = 'income' AND date(created_at) = date(?)",
            [date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        // Get expense stats
        let (total_expense, expense_count): (f64, i64) = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0), COUNT(*) 
             FROM transactions 
             WHERE type = 'expense' AND date(created_at) = date(?)",
            [date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        Ok(TransactionsSummary {
            date: date.to_string(),
            total_income,
            total_expense,
            balance: total_income - total_expense,
            income_count,
            expense_count,
            total_transactions: income_count + expense_count,
        })
    }

    /// Search transactions by concept or transaction number
    pub fn search_transactions(
        db: &Database,
        query: &str,
        limit: i64,
        offset: i64,
    ) -> Result<(Vec<Transaction>, i64)> {
        let conn = db.get_connection();
        let conn = conn.lock().unwrap();

        let search_term = format!("%{}%", query);

        // Get matching transactions
        let mut stmt = conn.prepare(
            "SELECT 
                t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.concept LIKE ?1 OR t.transaction_number LIKE ?1
             ORDER BY t.created_at DESC
             LIMIT ?2 OFFSET ?3",
        )?;

        let transactions = stmt.query_map(
            [&search_term, &limit.to_string(), &offset.to_string()],
            |row| {
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
            },
        )?;

        let transactions: Vec<Transaction> = transactions.collect::<Result<Vec<_>>>()?;

        // Get total count
        let total_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM transactions 
             WHERE concept LIKE ?1 OR transaction_number LIKE ?1",
            [&search_term],
            |row| row.get(0),
        )?;

        Ok((transactions, total_count))
    }
}

#[derive(Debug)]
pub struct TransactionsSummary {
    pub date: String,
    pub total_income: f64,
    pub total_expense: f64,
    pub balance: f64,
    pub income_count: i64,
    pub expense_count: i64,
    pub total_transactions: i64,
}
