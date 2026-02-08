#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("¡Hola, {}! Bienvenido a Cafetería Hub", name)
}
