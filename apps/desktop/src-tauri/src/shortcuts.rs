use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const DEFAULT_ACCEL: &str = "CommandOrControl+Shift+L";

pub fn setup_shortcuts(app: &AppHandle) -> Result<(), String> {
    let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyL);

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app.emit("los:quick-capture", ());
            }
        })
        .map_err(|e| e.to_string())?;

    match app.global_shortcut().register(shortcut) {
        Ok(()) => {
            let _ = app.emit(
                "los:caps",
                serde_json::json!({
                    "globalShortcutAvailable": true,
                    "globalShortcutRegistered": true,
                    "accel": DEFAULT_ACCEL
                }),
            );
            Ok(())
        }
        Err(e) => {
            let _ = app.emit(
                "los:caps",
                serde_json::json!({
                    "globalShortcutAvailable": true,
                    "globalShortcutRegistered": false,
                    "error": e.to_string()
                }),
            );
            Err(format!("Global shortcut registration failed gracefully: {e}"))
        }
    }
}
