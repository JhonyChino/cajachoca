use serde::{Deserialize, Serialize};

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
    pub transaction_type: String,
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
    pub category_type: String,
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
