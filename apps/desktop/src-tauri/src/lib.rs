mod shortcuts;
mod tray;

use tauri::{Emitter, Manager};

#[tauri::command]
fn workspace_status() -> serde_json::Value {
    serde_json::json!({
        "mode": "local_only",
        "note": "Domain commands run in the webview via @los/app-services; Rust owns tray/shortcut/window."
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![workspace_status])
        .setup(|app| {
            if let Err(e) = tray::setup_tray(app.handle()) {
                eprintln!("Tray unavailable: {e}");
                let _ = app.emit(
                    "los:caps",
                    serde_json::json!({ "trayAvailable": false }),
                );
            }
            if let Err(e) = shortcuts::setup_shortcuts(app.handle()) {
                eprintln!("{e}");
            }
            // Cold start: show main window without account/network (T030)
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running LOS");
}
