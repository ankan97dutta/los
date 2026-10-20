mod db;
mod shortcuts;
mod tray;

use shortcuts::ShortcutStateMutex;
use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[tauri::command]
fn workspace_status(app: tauri::AppHandle) -> serde_json::Value {
    let (registered, error, accel) = app
        .try_state::<ShortcutStateMutex>()
        .and_then(|s| s.0.lock().ok().map(|g| (g.registered, g.error.clone(), g.accel.clone())))
        .unwrap_or((false, None, String::new()));

    let db_path = db::db_path(&app)
        .map(|p| p.to_string_lossy().to_string())
        .ok();

    serde_json::json!({
        "mode": "local_only",
        "dbPath": db_path,
        "dbReady": db_path.as_ref().map(|p| std::path::Path::new(p).exists()).unwrap_or(false),
        "globalShortcutAvailable": true,
        "globalShortcutRegistered": registered,
        "globalShortcutError": error,
        "accel": accel,
        "note": "Workspace CRUD runs in the webview via DbSession + app-services; Rust owns tray/shortcut/file replace."
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(ShortcutStateMutex(Mutex::new(shortcuts::ShortcutStateInner {
            registered: false,
            error: None,
            accel: "CommandOrControl+Shift+L".into(),
        })))
        .invoke_handler(tauri::generate_handler![
            workspace_status,
            db::db_bootstrap,
            db::db_export_backup,
            db::db_restore_backup,
            db::db_reset_all,
            db::db_path_cmd,
            shortcuts::shortcuts_reregister
        ])
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
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running LOS");
}
