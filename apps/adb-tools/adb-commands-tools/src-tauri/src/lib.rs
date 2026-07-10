// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn adb_command(command: String) -> Result<String, String> {
    let args: Vec<&str> = command.split_whitespace().collect();

    let output = std::process::Command::new("adb")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute adb: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(if stderr.is_empty() { stdout } else { stderr })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![adb_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
