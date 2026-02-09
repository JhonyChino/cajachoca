use crate::db::Database;
use crate::models::*;
use crate::services::report_service::ReportService;
use crate::services::session_service::SessionService;
use crate::services::transaction_service::TransactionService;
use tauri::State;

// ============================================
// Session Commands
// ============================================

#[tauri::command]
pub fn create_session(
    request: CreateSessionRequest,
    db: State<Database>,
) -> Result<SessionResponse, String> {
    match SessionService::create_session(&db, request) {
        Ok(session) => Ok(SessionResponse {
            success: true,
            data: Some(session),
            error: None,
        }),
        Err(e) => Ok(SessionResponse {
            success: false,
            data: None,
            error: Some(format!("Error al crear sesión: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_active_session(db: State<Database>) -> Result<SessionResponse, String> {
    match SessionService::get_active_session(&db) {
        Ok(session) => Ok(SessionResponse {
            success: true,
            data: session,
            error: None,
        }),
        Err(e) => Ok(SessionResponse {
            success: false,
            data: None,
            error: Some(format!("Error al obtener sesión activa: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn close_session(
    request: CloseSessionRequest,
    db: State<Database>,
) -> Result<SessionResponse, String> {
    match SessionService::close_session(&db, request) {
        Ok(session) => Ok(SessionResponse {
            success: true,
            data: Some(session),
            error: None,
        }),
        Err(e) => Ok(SessionResponse {
            success: false,
            data: None,
            error: Some(format!("Error al cerrar sesión: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_session_summary(
    session_id: i64,
    db: State<Database>,
) -> Result<serde_json::Value, String> {
    match SessionService::get_session_summary(&db, session_id) {
        Ok(summary) => {
            let response = serde_json::json!({
                "success": true,
                "data": {
                    "session": summary.session,
                    "total_income": summary.total_income,
                    "total_expense": summary.total_expense,
                    "income_count": summary.income_count,
                    "expense_count": summary.expense_count,
                    "current_balance": summary.current_balance,
                    "expected_closing": summary.expected_closing,
                    "difference": summary.difference,
                },
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "data": null,
                "error": format!("Error al obtener resumen: {}", e)
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn get_today_summary(db: State<Database>) -> Result<DailySummaryResponse, String> {
    match SessionService::get_today_summary(&db) {
        Ok(summary) => Ok(DailySummaryResponse {
            success: true,
            data: Some(summary),
            error: None,
        }),
        Err(e) => Ok(DailySummaryResponse {
            success: false,
            data: None,
            error: Some(format!("Error al obtener resumen del día: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn has_active_session(db: State<Database>) -> Result<bool, String> {
    SessionService::has_active_session(&db)
        .map_err(|e| format!("Error al verificar sesión activa: {}", e))
}

// ============================================
// Transaction Commands
// ============================================

#[tauri::command]
pub fn create_transaction(
    request: CreateTransactionRequest,
    db: State<Database>,
) -> Result<TransactionResponse, String> {
    match TransactionService::create_transaction(&db, request) {
        Ok(transaction) => Ok(TransactionResponse {
            success: true,
            data: Some(transaction),
            error: None,
        }),
        Err(e) => Ok(TransactionResponse {
            success: false,
            data: None,
            error: Some(format!("Error al crear transacción: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_transaction_by_id(
    transaction_id: i64,
    db: State<Database>,
) -> Result<TransactionResponse, String> {
    match TransactionService::get_transaction_by_id(&db, transaction_id) {
        Ok(transaction) => Ok(TransactionResponse {
            success: true,
            data: Some(transaction),
            error: None,
        }),
        Err(e) => Ok(TransactionResponse {
            success: false,
            data: None,
            error: Some(format!("Error al obtener transacción: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_transactions(
    request: GetTransactionsRequest,
    db: State<Database>,
) -> Result<TransactionsListResponse, String> {
    let limit = request.limit.unwrap_or(50);
    let offset = request.offset.unwrap_or(0);

    match TransactionService::get_transactions(
        &db,
        request.session_id,
        request.transaction_type,
        request.start_date,
        request.end_date,
        limit,
        offset,
    ) {
        Ok((transactions, total_count)) => Ok(TransactionsListResponse {
            success: true,
            data: transactions,
            total_count,
            error: None,
        }),
        Err(e) => Ok(TransactionsListResponse {
            success: false,
            data: vec![],
            total_count: 0,
            error: Some(format!("Error al obtener transacciones: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_recent_transactions(
    session_id: Option<i64>,
    limit: Option<i64>,
    db: State<Database>,
) -> Result<TransactionsListResponse, String> {
    let limit = limit.unwrap_or(5);

    match TransactionService::get_recent_transactions(&db, session_id, limit) {
        Ok(transactions) => Ok(TransactionsListResponse {
            success: true,
            data: transactions,
            total_count: 0, // Not relevant for recent transactions
            error: None,
        }),
        Err(e) => Ok(TransactionsListResponse {
            success: false,
            data: vec![],
            total_count: 0,
            error: Some(format!("Error al obtener transacciones recientes: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_all_categories(db: State<Database>) -> Result<CategoriesListResponse, String> {
    match TransactionService::get_all_categories(&db) {
        Ok(categories) => Ok(CategoriesListResponse {
            success: true,
            data: categories,
            error: None,
        }),
        Err(e) => Ok(CategoriesListResponse {
            success: false,
            data: vec![],
            error: Some(format!("Error al obtener categorías: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_categories_by_type(
    category_type: String,
    db: State<Database>,
) -> Result<CategoriesListResponse, String> {
    match TransactionService::get_categories_by_type(&db, category_type) {
        Ok(categories) => Ok(CategoriesListResponse {
            success: true,
            data: categories,
            error: None,
        }),
        Err(e) => Ok(CategoriesListResponse {
            success: false,
            data: vec![],
            error: Some(format!("Error al obtener categorías: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn get_today_transactions_summary(db: State<Database>) -> Result<serde_json::Value, String> {
    match TransactionService::get_today_transactions_summary(&db) {
        Ok(summary) => {
            let response = serde_json::json!({
                "success": true,
                "data": {
                    "date": summary.date,
                    "total_income": summary.total_income,
                    "total_expense": summary.total_expense,
                    "balance": summary.balance,
                    "income_count": summary.income_count,
                    "expense_count": summary.expense_count,
                    "total_transactions": summary.total_transactions,
                },
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "data": null,
                "error": format!("Error al obtener resumen de transacciones: {}", e)
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn search_transactions(
    query: String,
    limit: Option<i64>,
    offset: Option<i64>,
    db: State<Database>,
) -> Result<TransactionsListResponse, String> {
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    match TransactionService::search_transactions(&db, &query, limit, offset) {
        Ok((transactions, total_count)) => Ok(TransactionsListResponse {
            success: true,
            data: transactions,
            total_count,
            error: None,
        }),
        Err(e) => Ok(TransactionsListResponse {
            success: false,
            data: vec![],
            total_count: 0,
            error: Some(format!("Error al buscar transacciones: {}", e)),
        }),
    }
}

// ============================================
// Report Commands
// ============================================

#[tauri::command]
pub fn generate_report(
    report_type: String,
    start_date: String,
    end_date: String,
    format: String,
    download_path: Option<String>,
    db: State<Database>,
) -> Result<serde_json::Value, String> {
    match ReportService::generate_report(
        &db,
        &report_type,
        &start_date,
        &end_date,
        &format,
        download_path.as_deref(),
    ) {
        Ok(file_path) => {
            let response = serde_json::json!({
                "success": true,
                "file_path": file_path.to_string_lossy().to_string(),
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "file_path": null,
                "error": e
            });
            Ok(response)
        }
    }
}

// ============================================
// Backup Commands
// ============================================

#[tauri::command]
pub fn create_backup(custom_path: Option<String>) -> Result<serde_json::Value, String> {
    match crate::services::backup_service::BackupService::create_backup(custom_path.as_deref()) {
        Ok(backup) => {
            let response = serde_json::json!({
                "success": true,
                "data": {
                    "filename": backup.filename,
                    "filepath": backup.filepath,
                    "created_at": backup.created_at,
                    "size_bytes": backup.size_bytes,
                    "size_formatted": crate::services::backup_service::format_file_size(backup.size_bytes)
                },
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "data": null,
                "error": e
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn restore_backup(backup_path: String) -> Result<serde_json::Value, String> {
    match crate::services::backup_service::BackupService::restore_backup(&backup_path) {
        Ok(_) => {
            let response = serde_json::json!({
                "success": true,
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "error": e
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn list_backups(backup_dir: Option<String>) -> Result<serde_json::Value, String> {
    match crate::services::backup_service::BackupService::list_backups(backup_dir.as_deref()) {
        Ok(backups) => {
            let backups_json: Vec<serde_json::Value> = backups
                .into_iter()
                .map(|b| {
                    serde_json::json!({
                        "filename": b.filename,
                        "filepath": b.filepath,
                        "created_at": b.created_at,
                        "size_bytes": b.size_bytes,
                        "size_formatted": crate::services::backup_service::format_file_size(b.size_bytes)
                    })
                })
                .collect();

            let response = serde_json::json!({
                "success": true,
                "data": backups_json,
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "data": [],
                "error": e
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn delete_backup(backup_path: String) -> Result<serde_json::Value, String> {
    match crate::services::backup_service::BackupService::delete_backup(&backup_path) {
        Ok(_) => {
            let response = serde_json::json!({
                "success": true,
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "error": e
            });
            Ok(response)
        }
    }
}

#[tauri::command]
pub fn get_database_info() -> Result<serde_json::Value, String> {
    match crate::services::backup_service::BackupService::get_database_info() {
        Ok((size, modified)) => {
            let response = serde_json::json!({
                "success": true,
                "data": {
                    "size_bytes": size,
                    "size_formatted": crate::services::backup_service::format_file_size(size),
                    "last_modified": modified
                },
                "error": null
            });
            Ok(response)
        }
        Err(e) => {
            let response = serde_json::json!({
                "success": false,
                "data": null,
                "error": e
            });
            Ok(response)
        }
    }
}

// ============================================
// Database Management Commands
// ============================================

#[tauri::command]
pub fn delete_all_records() -> Result<serde_json::Value, String> {
    // Get database path
    let db_path = dirs::data_dir()
        .ok_or_else(|| "No se pudo obtener directorio de datos".to_string())?
        .join("CafeteriaHub")
        .join("cajachoca.db");

    if !db_path.exists() {
        return Err("No se encontró la base de datos".to_string());
    }

    // Create a backup before deleting
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("cajachoca_backup_before_delete_{}.db", timestamp);
    let backup_dir = dirs::document_dir()
        .ok_or_else(|| "No se pudo obtener directorio de documentos".to_string())?
        .join("CafeteriaHub")
        .join("Backups");

    std::fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Error creando directorio de backup: {}", e))?;

    let backup_path = backup_dir.join(&backup_filename);

    // Backup current database
    std::fs::copy(&db_path, &backup_path)
        .map_err(|e| format!("Error creando backup antes de eliminar: {}", e))?;

    // Connect to database and delete all records
    let conn = rusqlite::Connection::open(&db_path)
        .map_err(|e| format!("Error abriendo base de datos: {}", e))?;

    // Delete all records from tables (in correct order to avoid foreign key constraints)
    conn.execute("DELETE FROM transactions", [])
        .map_err(|e| format!("Error eliminando transacciones: {}", e))?;

    conn.execute("DELETE FROM sessions", [])
        .map_err(|e| format!("Error eliminando sesiones: {}", e))?;

    // Reset auto-increment counters
    conn.execute(
        "DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'sessions')",
        [],
    )
    .map_err(|e| format!("Error reseteando contadores: {}", e))?;

    let response = serde_json::json!({
        "success": true,
        "error": null,
        "backup_created": backup_path.to_string_lossy().to_string()
    });

    Ok(response)
}

// ============================================
// Test Command
// ============================================

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("¡Hola, {}! Bienvenido a Cafetería Hub", name)
}
