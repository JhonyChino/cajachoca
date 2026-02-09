use chrono;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

pub struct BackupService;

#[derive(Debug, Clone)]
pub struct BackupInfo {
    pub filename: String,
    pub filepath: String,
    pub created_at: String,
    pub size_bytes: u64,
}

impl BackupService {
    /// Get the path to the database file
    fn get_db_path() -> Result<PathBuf, String> {
        dirs::data_dir()
            .ok_or_else(|| "No se pudo obtener directorio de datos".to_string())
            .map(|dir| dir.join("CafeteriaHub").join("cajachoca.db"))
    }

    /// Create a backup of the database
    pub fn create_backup(custom_path: Option<&str>) -> Result<BackupInfo, String> {
        // Get database path
        let db_path = Self::get_db_path()?;

        // Verify database exists
        if !db_path.exists() {
            return Err("No se encontró la base de datos".to_string());
        }

        // Generate backup filename with timestamp
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("cajachoca_backup_{}.db", timestamp);

        // Determine backup directory
        let backup_dir = if let Some(path) = custom_path {
            PathBuf::from(path)
        } else {
            dirs::document_dir()
                .ok_or_else(|| "No se pudo obtener directorio de documentos".to_string())?
                .join("CafeteriaHub")
                .join("Backups")
        };

        // Create backup directory if it doesn't exist
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Error creando directorio de backup: {}", e))?;

        // Full path for backup file
        let backup_path = backup_dir.join(&filename);

        // Copy database file
        fs::copy(&db_path, &backup_path)
            .map_err(|e| format!("Error copiando base de datos: {}", e))?;

        // Get file size
        let metadata =
            fs::metadata(&backup_path).map_err(|e| format!("Error obteniendo metadata: {}", e))?;
        let size_bytes = metadata.len();

        Ok(BackupInfo {
            filename,
            filepath: backup_path.to_string_lossy().to_string(),
            created_at: chrono::Local::now().to_rfc3339(),
            size_bytes,
        })
    }

    /// Restore database from a backup file
    pub fn restore_backup(backup_path: &str) -> Result<(), String> {
        let backup_file = PathBuf::from(backup_path);

        // Verify backup file exists
        if !backup_file.exists() {
            return Err("El archivo de backup no existe".to_string());
        }

        // Get database path
        let db_path = Self::get_db_path()?;

        // Create automatic backup before restoring
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let auto_backup_name = format!("cajachoca_auto_backup_before_restore_{}.db", timestamp);
        let auto_backup_dir = dirs::data_dir()
            .ok_or_else(|| "No se pudo obtener directorio de datos".to_string())?
            .join("CafeteriaHub")
            .join("AutoBackups");

        fs::create_dir_all(&auto_backup_dir)
            .map_err(|e| format!("Error creando directorio de auto-backup: {}", e))?;

        let auto_backup_path = auto_backup_dir.join(&auto_backup_name);

        // Backup current database before restoring
        fs::copy(&db_path, &auto_backup_path)
            .map_err(|e| format!("Error creando backup automático: {}", e))?;

        // Restore database from backup
        fs::copy(&backup_file, &db_path).map_err(|e| format!("Error restaurando backup: {}", e))?;

        Ok(())
    }

    /// List all available backups
    pub fn list_backups(backup_dir: Option<&str>) -> Result<Vec<BackupInfo>, String> {
        let dir = if let Some(path) = backup_dir {
            PathBuf::from(path)
        } else {
            dirs::document_dir()
                .ok_or_else(|| "No se pudo obtener directorio de documentos".to_string())?
                .join("CafeteriaHub")
                .join("Backups")
        };

        // Check if directory exists
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let mut backups = Vec::new();

        // Read directory contents
        match fs::read_dir(&dir) {
            Ok(entries) => {
                for entry in entries.flatten() {
                    let path = entry.path();

                    // Only process .db files
                    if let Some(ext) = path.extension() {
                        if ext == "db" {
                            if let Ok(metadata) = entry.metadata() {
                                if let Ok(created) = metadata.created() {
                                    if let Ok(filename) = entry.file_name().into_string() {
                                        backups.push(BackupInfo {
                                            filename,
                                            filepath: path.to_string_lossy().to_string(),
                                            created_at: system_time_to_rfc3339(created),
                                            size_bytes: metadata.len(),
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => return Err(format!("Error leyendo directorio: {}", e)),
        }

        // Sort by creation date (newest first)
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(backups)
    }

    /// Delete a backup file
    pub fn delete_backup(backup_path: &str) -> Result<(), String> {
        let path = PathBuf::from(backup_path);

        if !path.exists() {
            return Err("El archivo de backup no existe".to_string());
        }

        fs::remove_file(&path).map_err(|e| format!("Error eliminando backup: {}", e))?;

        Ok(())
    }

    /// Get database info (size, last modified)
    pub fn get_database_info() -> Result<(u64, String), String> {
        let db_path = Self::get_db_path()?;

        if !db_path.exists() {
            return Err("No se encontró la base de datos".to_string());
        }

        let metadata =
            fs::metadata(&db_path).map_err(|e| format!("Error obteniendo metadata: {}", e))?;

        let size = metadata.len();
        let modified = metadata
            .modified()
            .map_err(|e| format!("Error obteniendo fecha de modificación: {}", e))?;

        Ok((size, system_time_to_rfc3339(modified)))
    }
}

fn system_time_to_rfc3339(time: SystemTime) -> String {
    let datetime: chrono::DateTime<chrono::Local> = time.into();
    datetime.to_rfc3339()
}

/// Format file size in human readable format
pub fn format_file_size(size_bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if size_bytes >= GB {
        format!("{:.2} GB", size_bytes as f64 / GB as f64)
    } else if size_bytes >= MB {
        format!("{:.2} MB", size_bytes as f64 / MB as f64)
    } else if size_bytes >= KB {
        format!("{:.2} KB", size_bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", size_bytes)
    }
}
