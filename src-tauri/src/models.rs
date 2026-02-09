use serde::{Deserialize, Serialize};

// ============================================
// Entity Models
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: i64,
    pub operator_name: String,
    pub opening_amount: f64,
    pub closing_amount: Option<f64>,
    pub opened_at: String,
    pub closed_at: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transaction {
    pub id: i64,
    pub session_id: i64,
    pub transaction_number: String,
    pub transaction_type: String, // 'income' or 'expense'
    pub amount: f64,
    pub concept: String,
    pub category_id: Option<i64>,
    pub category_name: Option<String>,
    pub created_at: String,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub category_type: String, // 'income' or 'expense'
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DailySummary {
    pub date: String,
    pub total_income: f64,
    pub total_expense: f64,
    pub balance: f64,
    pub income_count: i64,
    pub expense_count: i64,
    pub current_balance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupInfo {
    pub id: i64,
    pub filename: String,
    pub filepath: String,
    pub created_at: String,
    pub size_bytes: i64,
    pub description: Option<String>,
}

// ============================================
// Request/Input Models
// ============================================

#[derive(Debug, Deserialize, Clone)]
pub struct CreateSessionRequest {
    pub operator_name: String,
    pub opening_amount: f64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CloseSessionRequest {
    pub session_id: i64,
    pub closing_amount: f64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CreateTransactionRequest {
    pub session_id: i64,
    pub transaction_type: String, // 'income' or 'expense'
    pub amount: f64,
    pub concept: String,
    pub category_id: Option<i64>,
    pub created_by: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct GetTransactionsRequest {
    pub session_id: Option<i64>,
    pub transaction_type: Option<String>,
    pub start_date: Option<String>, // Format: YYYY-MM-DD
    pub end_date: Option<String>,   // Format: YYYY-MM-DD
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct GetDailySummaryRequest {
    pub date: String, // Format: YYYY-MM-DD
}

#[derive(Debug, Deserialize, Clone)]
pub struct GetCategoriesRequest {
    pub category_type: Option<String>, // 'income' or 'expense'
}

#[derive(Debug, Deserialize, Clone)]
pub struct GenerateReportRequest {
    pub report_type: String, // 'income', 'expense', 'balance', 'weekly'
    pub start_date: String,
    pub end_date: String,
    pub format: String, // 'pdf' or 'excel'
}

#[derive(Debug, Deserialize, Clone)]
pub struct CreateBackupRequest {
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RestoreBackupRequest {
    pub backup_path: String,
}

// ============================================
// Response Models
// ============================================

#[derive(Debug, Serialize, Clone)]
pub struct SessionResponse {
    pub success: bool,
    pub data: Option<Session>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionResponse {
    pub success: bool,
    pub data: Option<Transaction>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TransactionsListResponse {
    pub success: bool,
    pub data: Vec<Transaction>,
    pub total_count: i64,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CategoriesListResponse {
    pub success: bool,
    pub data: Vec<Category>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CategoryResponse {
    pub success: bool,
    pub data: Option<Category>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DailySummaryResponse {
    pub success: bool,
    pub data: Option<DailySummary>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ReportResponse {
    pub success: bool,
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BackupResponse {
    pub success: bool,
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BackupListResponse {
    pub success: bool,
    pub data: Vec<BackupInfo>,
    pub error: Option<String>,
}
