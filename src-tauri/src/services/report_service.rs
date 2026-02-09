use crate::db::Database;
use crate::models::Transaction;
use printpdf::*;
use rusqlite::Result;
use rust_xlsxwriter::{Color, Format, Workbook};
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;

pub struct ReportService;

impl ReportService {
    /// Generate a report in PDF or Excel format
    pub fn generate_report(
        db: &Database,
        report_type: &str,
        start_date: &str,
        end_date: &str,
        format: &str,
        custom_download_path: Option<&str>,
    ) -> Result<PathBuf, String> {
        // Get transactions for the date range, filtered by report type
        let transactions = Self::get_transactions_for_range(db, start_date, end_date, report_type)?;

        // Generate filename
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("{}_{}_{}", report_type, start_date, timestamp);

        // Get reports directory (use custom path if provided)
        let reports_dir = if let Some(path) = custom_download_path {
            PathBuf::from(path)
        } else {
            Self::get_reports_directory()?
        };

        // Create directory if it doesn't exist
        if !reports_dir.exists() {
            std::fs::create_dir_all(&reports_dir)
                .map_err(|e| format!("Error creating directory: {}", e))?;
        }

        match format {
            "pdf" => Self::generate_pdf_report(
                &transactions,
                report_type,
                start_date,
                end_date,
                &reports_dir,
                &filename,
            ),
            "excel" => Self::generate_excel_report(
                &transactions,
                report_type,
                start_date,
                end_date,
                &reports_dir,
                &filename,
            ),
            _ => Err("Formato no soportado. Use 'pdf' o 'excel'".to_string()),
        }
    }

    fn get_transactions_for_range(
        db: &Database,
        start_date: &str,
        end_date: &str,
        report_type: &str,
    ) -> Result<Vec<Transaction>, String> {
        let conn = db.get_connection();
        let conn = conn
            .lock()
            .map_err(|_| "Error al obtener conexión".to_string())?;

        // Build query based on report type
        let query = if report_type.starts_with("category_") {
            // Category-based report
            let parts: Vec<&str> = report_type.split('_').collect();
            if parts.len() >= 3 {
                let category_id: i64 = parts[1].parse().unwrap_or(0);
                let transaction_type = parts[2];

                if transaction_type == "income" {
                    format!(
                        "SELECT 
                    t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                    t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE date(t.created_at) >= date('{}') AND date(t.created_at) <= date('{}')
                 AND t.type = 'income' AND t.category_id = {}
                 ORDER BY t.created_at DESC",
                        start_date, end_date, category_id
                    )
                } else {
                    format!(
                        "SELECT 
                    t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                    t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE date(t.created_at) >= date('{}') AND date(t.created_at) <= date('{}')
                 AND t.type = 'expense' AND t.category_id = {}
                 ORDER BY t.created_at DESC",
                        start_date, end_date, category_id
                    )
                }
            } else {
                return Err("Tipo de reporte de categoría inválido".to_string());
            }
        } else {
            match report_type {
                "income" => "SELECT 
                    t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                    t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE date(t.created_at) >= date(?) AND date(t.created_at) <= date(?)
                 AND t.type = 'income'
                 ORDER BY t.created_at DESC"
                    .to_string(),
                "expense" => "SELECT 
                    t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                    t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE date(t.created_at) >= date(?) AND date(t.created_at) <= date(?)
                 AND t.type = 'expense'
                 ORDER BY t.created_at DESC"
                    .to_string(),
                _ => "SELECT 
                    t.id, t.session_id, t.transaction_number, t.type, t.amount, 
                    t.concept, t.category_id, c.name as category_name, t.created_at, t.created_by
                 FROM transactions t
                 LEFT JOIN categories c ON t.category_id = c.id
                 WHERE date(t.created_at) >= date(?) AND date(t.created_at) <= date(?)
                 ORDER BY t.created_at DESC"
                    .to_string(),
            }
        };

        let transactions = if report_type.starts_with("category_") {
            // For category reports, query is already a formatted String
            let results: Result<Vec<Transaction>, String> = {
                let mut stmt = conn
                    .prepare(&query)
                    .map_err(|e| format!("Error en query: {}", e))?;

                let mapped = stmt
                    .query_map([], |row| {
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
                    })
                    .map_err(|e| format!("Error mapeando resultados: {}", e))?;

                let collected = mapped
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("Error colectando transacciones: {}", e))?;

                Ok(collected)
            };
            results?
        } else {
            // For regular reports, use parameters
            let results: Result<Vec<Transaction>, String> = {
                let mut stmt = conn
                    .prepare(&query)
                    .map_err(|e| format!("Error en query: {}", e))?;

                let mapped = stmt
                    .query_map([start_date, end_date], |row| {
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
                    })
                    .map_err(|e| format!("Error mapeando resultados: {}", e))?;

                let collected = mapped
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("Error colectando transacciones: {}", e))?;

                Ok(collected)
            };
            results?
        };

        Ok(transactions)
    }

    fn get_reports_directory() -> Result<PathBuf, String> {
        let docs_dir = dirs::document_dir()
            .or_else(|| dirs::home_dir().map(|h| h.join("Documents")))
            .ok_or("No se pudo encontrar directorio de documentos")?;

        Ok(docs_dir.join("CafeteriaHub").join("Reportes"))
    }

    fn generate_pdf_report(
        transactions: &[Transaction],
        report_type: &str,
        start_date: &str,
        end_date: &str,
        reports_dir: &PathBuf,
        filename: &str,
    ) -> Result<PathBuf, String> {
        let file_path = reports_dir.join(format!("{}.pdf", filename));

        // Create PDF document
        let (doc, page1, layer1) = PdfDocument::new(
            &format!("Reporte - {}", Self::get_report_title(report_type)),
            Mm(210.0), // A4 width
            Mm(297.0), // A4 height
            "Layer 1",
        );

        let current_layer = doc.get_page(page1).get_layer(layer1);

        // Load fonts
        let font = doc
            .add_builtin_font(BuiltinFont::Helvetica)
            .map_err(|e| e.to_string())?;
        let font_bold = doc
            .add_builtin_font(BuiltinFont::HelveticaBold)
            .map_err(|e| e.to_string())?;

        // Title
        current_layer.use_text(
            &format!("CAFETERÍA HUB - {}", Self::get_report_title(report_type)),
            20.0,
            Mm(20.0),
            Mm(270.0),
            &font_bold,
        );

        // Date range
        current_layer.use_text(
            &format!("Período: {} al {}", start_date, end_date),
            12.0,
            Mm(20.0),
            Mm(255.0),
            &font,
        );

        // Calculate totals
        let (total_income, total_expense, income_count, expense_count) =
            Self::calculate_totals(transactions);

        // Summary section
        current_layer.use_text("RESUMEN", 14.0, Mm(20.0), Mm(240.0), &font_bold);
        current_layer.use_text(
            &format!(
                "Total Ingresos: ${:.2} ({} transacciones)",
                total_income, income_count
            ),
            11.0,
            Mm(20.0),
            Mm(228.0),
            &font,
        );
        current_layer.use_text(
            &format!(
                "Total Egresos: ${:.2} ({} transacciones)",
                total_expense, expense_count
            ),
            11.0,
            Mm(20.0),
            Mm(220.0),
            &font,
        );
        current_layer.use_text(
            &format!("Balance: ${:.2}", total_income - total_expense),
            11.0,
            Mm(20.0),
            Mm(212.0),
            &font_bold,
        );

        // Table header
        let y_start = 195.0;
        current_layer.use_text(
            "DETALLE DE TRANSACCIONES",
            14.0,
            Mm(20.0),
            Mm(y_start),
            &font_bold,
        );

        // Column headers
        let y_header = y_start - 15.0;
        current_layer.use_text("Fecha", 10.0, Mm(20.0), Mm(y_header), &font_bold);
        current_layer.use_text("Número", 10.0, Mm(55.0), Mm(y_header), &font_bold);
        current_layer.use_text("Concepto", 10.0, Mm(90.0), Mm(y_header), &font_bold);
        current_layer.use_text("Tipo", 10.0, Mm(150.0), Mm(y_header), &font_bold);
        current_layer.use_text("Monto", 10.0, Mm(175.0), Mm(y_header), &font_bold);

        // Separator line
        current_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(15.0), Mm(y_header - 3.0)), false),
                (Point::new(Mm(195.0), Mm(y_header - 3.0)), false),
            ],
            is_closed: false,
        });

        // Transaction rows
        let mut y_pos = y_header - 10.0;
        for transaction in transactions.iter().take(40) {
            // Limit to 40 rows per page for simplicity
            let date = transaction
                .created_at
                .split('T')
                .next()
                .unwrap_or(&transaction.created_at);
            let type_label = if transaction.transaction_type == "income" {
                "Ingreso"
            } else {
                "Egreso"
            };

            current_layer.use_text(date, 9.0, Mm(20.0), Mm(y_pos), &font);
            current_layer.use_text(
                &transaction.transaction_number,
                9.0,
                Mm(55.0),
                Mm(y_pos),
                &font,
            );

            // Truncate concept if too long
            let concept = if transaction.concept.len() > 30 {
                format!("{}...", &transaction.concept[..27])
            } else {
                transaction.concept.clone()
            };
            current_layer.use_text(&concept, 9.0, Mm(90.0), Mm(y_pos), &font);
            current_layer.use_text(type_label, 9.0, Mm(150.0), Mm(y_pos), &font);
            current_layer.use_text(
                &format!("${:.2}", transaction.amount),
                9.0,
                Mm(175.0),
                Mm(y_pos),
                &font,
            );

            y_pos -= 6.0;

            if y_pos < 20.0 {
                // Would need to add a new page here for a full implementation
                break;
            }
        }

        // Footer
        let generated_at = chrono::Local::now().format("%Y-%m-%d %H:%M");
        current_layer.use_text(
            &format!("Generado el: {}", generated_at),
            8.0,
            Mm(20.0),
            Mm(15.0),
            &font,
        );

        // Save PDF
        let file = File::create(&file_path).map_err(|e| format!("Error creando archivo: {}", e))?;
        let mut buf_writer = BufWriter::new(file);
        doc.save(&mut buf_writer)
            .map_err(|e| format!("Error guardando PDF: {}", e))?;

        Ok(file_path)
    }

    fn generate_excel_report(
        transactions: &[Transaction],
        report_type: &str,
        start_date: &str,
        end_date: &str,
        reports_dir: &PathBuf,
        filename: &str,
    ) -> Result<PathBuf, String> {
        let file_path = reports_dir.join(format!("{}.xlsx", filename));

        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();

        // Set column widths
        worksheet
            .set_column_width(0, 15)
            .map_err(|e| e.to_string())?; // Date
        worksheet
            .set_column_width(1, 15)
            .map_err(|e| e.to_string())?; // Number
        worksheet
            .set_column_width(2, 35)
            .map_err(|e| e.to_string())?; // Concept
        worksheet
            .set_column_width(3, 15)
            .map_err(|e| e.to_string())?; // Category
        worksheet
            .set_column_width(4, 12)
            .map_err(|e| e.to_string())?; // Type
        worksheet
            .set_column_width(5, 15)
            .map_err(|e| e.to_string())?; // Amount
        worksheet
            .set_column_width(6, 15)
            .map_err(|e| e.to_string())?; // Created by

        // Title format
        let title_format = Format::new()
            .set_bold()
            .set_font_size(16)
            .set_font_color(Color::Blue);

        // Header format
        let header_format = Format::new()
            .set_bold()
            .set_background_color(Color::Blue)
            .set_font_color(Color::White);

        // Write title
        worksheet
            .write_string_with_format(0, 0, "CAFETERÍA HUB", &title_format)
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(1, 0, Self::get_report_title(report_type))
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(2, 0, &format!("Período: {} al {}", start_date, end_date))
            .map_err(|e| e.to_string())?;

        // Calculate totals
        let (total_income, total_expense, income_count, expense_count) =
            Self::calculate_totals(transactions);

        // Write summary
        worksheet
            .write_string(4, 0, "RESUMEN")
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(5, 0, &format!("Total Ingresos: ${:.2}", total_income))
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(5, 2, &format!("({} transacciones)", income_count))
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(6, 0, &format!("Total Egresos: ${:.2}", total_expense))
            .map_err(|e| e.to_string())?;
        worksheet
            .write_string(6, 2, &format!("({} transacciones)", expense_count))
            .map_err(|e| e.to_string())?;

        let balance_format = Format::new().set_bold();
        worksheet
            .write_string_with_format(
                7,
                0,
                &format!("Balance: ${:.2}", total_income - total_expense),
                &balance_format,
            )
            .map_err(|e| e.to_string())?;

        // Write table headers
        let header_row = 9;
        let headers = [
            "Fecha",
            "Número",
            "Concepto",
            "Categoría",
            "Tipo",
            "Monto",
            "Registrado por",
        ];
        for (col, header) in headers.iter().enumerate() {
            worksheet
                .write_string_with_format(header_row, col as u16, *header, &header_format)
                .map_err(|e| e.to_string())?;
        }

        // Write transaction data
        let mut row = header_row + 1;
        for transaction in transactions {
            let date = transaction
                .created_at
                .split('T')
                .next()
                .unwrap_or(&transaction.created_at);
            let type_label = if transaction.transaction_type == "income" {
                "Ingreso"
            } else {
                "Egreso"
            };
            let category = transaction
                .category_name
                .as_deref()
                .unwrap_or("Sin categoría");

            worksheet
                .write_string(row, 0, date)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_string(row, 1, &transaction.transaction_number)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_string(row, 2, &transaction.concept)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_string(row, 3, category)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_string(row, 4, type_label)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_number(row, 5, transaction.amount)
                .map_err(|e| e.to_string())?;
            worksheet
                .write_string(row, 6, &transaction.created_by)
                .map_err(|e| e.to_string())?;

            row += 1;
        }

        // Save workbook
        workbook
            .save(&file_path)
            .map_err(|e| format!("Error guardando Excel: {}", e))?;

        Ok(file_path)
    }

    fn calculate_totals(transactions: &[Transaction]) -> (f64, f64, usize, usize) {
        let mut total_income = 0.0;
        let mut total_expense = 0.0;
        let mut income_count = 0;
        let mut expense_count = 0;

        for transaction in transactions {
            if transaction.transaction_type == "income" {
                total_income += transaction.amount;
                income_count += 1;
            } else {
                total_expense += transaction.amount;
                expense_count += 1;
            }
        }

        (total_income, total_expense, income_count, expense_count)
    }

    fn get_report_title(report_type: &str) -> &'static str {
        match report_type {
            "income" => "REPORTE DE INGRESOS",
            "expense" => "REPORTE DE EGRESOS",
            "balance" => "BALANCE CONSOLIDADO",
            "weekly" => "RESUMEN SEMANAL",
            _ => "REPORTE",
        }
    }
}
