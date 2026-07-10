use serde::Serialize;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[derive(Serialize)]
struct CommandError {
    message: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn adb_command(command: String) -> Result<String, CommandError> {
    let args: Vec<&str> = command.split_whitespace().collect();

    let output = std::process::Command::new("adb")
        .args(&args)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to execute adb: {e}"),
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(CommandError { message: stderr })
    }
}

#[tauri::command]
fn clipboard_write(app: tauri::AppHandle, text: String) -> Result<String, CommandError> {
    let result = app.clipboard().write_text(text);
    if result.is_ok() {
        Ok("Text copied to clipboard".to_string())
    } else {
        Err(CommandError {
            message: format!("Failed to copy text to clipboard: {}", result.err().unwrap()),
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![adb_command,clipboard_write])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
