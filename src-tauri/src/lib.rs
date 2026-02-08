// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;
pub mod db;
pub mod models;
pub mod services;

use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            // Session commands
            commands::create_session,
            commands::get_active_session,
            commands::close_session,
            commands::get_session_summary,
            commands::get_today_summary,
            commands::has_active_session,
            // Transaction commands
            commands::create_transaction,
            commands::get_transaction_by_id,
            commands::get_transactions,
            commands::get_recent_transactions,
            commands::get_all_categories,
            commands::get_categories_by_type,
            commands::get_today_transactions_summary,
            commands::search_transactions,
            // Test command
            commands::greet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
