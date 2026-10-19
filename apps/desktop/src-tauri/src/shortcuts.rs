use tauri::{AppHandle, Emitter, Manager, State as TauriState};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use std::sync::Mutex;

pub struct ShortcutStateInner {
    pub registered: bool,
    pub error: Option<String>,
    pub accel: String,
}

pub struct ShortcutStateMutex(pub Mutex<ShortcutStateInner>);

const DEFAULT_ACCEL: &str = "CommandOrControl+Shift+L";

fn parse_accel(accel: &str) -> Result<Shortcut, String> {
    // Support CommandOrControl+Shift+L style used in settings
    let normalized = accel.replace("CommandOrControl", "CmdOrCtrl");
    let lower = normalized.to_lowercase();
    let mut mods = Modifiers::empty();
    if lower.contains("cmd") || lower.contains("command") || lower.contains("super") || lower.contains("meta") {
        mods |= Modifiers::SUPER;
    }
    if lower.contains("ctrl") || lower.contains("control") {
        mods |= Modifiers::CONTROL;
    }
    if lower.contains("alt") || lower.contains("option") {
        mods |= Modifiers::ALT;
    }
    if lower.contains("shift") {
        mods |= Modifiers::SHIFT;
    }
    let key = lower
        .split('+')
        .last()
        .ok_or_else(|| "Invalid accelerator".to_string())?
        .trim();
    let code = match key {
        "l" => Code::KeyL,
        "k" => Code::KeyK,
        "j" => Code::KeyJ,
        "i" => Code::KeyI,
        "m" => Code::KeyM,
        "n" => Code::KeyN,
        "o" => Code::KeyO,
        "p" => Code::KeyP,
        "q" => Code::KeyQ,
        "r" => Code::KeyR,
        "s" => Code::KeyS,
        "t" => Code::KeyT,
        "u" => Code::KeyU,
        "v" => Code::KeyV,
        "w" => Code::KeyW,
        "x" => Code::KeyX,
        "y" => Code::KeyY,
        "z" => Code::KeyZ,
        "a" => Code::KeyA,
        "b" => Code::KeyB,
        "c" => Code::KeyC,
        "d" => Code::KeyD,
        "e" => Code::KeyE,
        "f" => Code::KeyF,
        "g" => Code::KeyG,
        "h" => Code::KeyH,
        _ => return Err(format!("Unsupported shortcut key: {key}")),
    };
    Ok(Shortcut::new(Some(mods), code))
}

pub fn setup_shortcuts(app: &AppHandle) -> Result<(), String> {
    reregister_inner(app, true, DEFAULT_ACCEL)
}

fn reregister_inner(app: &AppHandle, enabled: bool, accel: &str) -> Result<(), String> {
    // Unregister all first (best-effort)
    let _ = app.global_shortcut().unregister_all();

    if !enabled {
        if let Some(state) = app.try_state::<ShortcutStateMutex>() {
            if let Ok(mut g) = state.0.lock() {
                g.registered = false;
                g.error = None;
                g.accel = accel.to_string();
            }
        }
        let _ = app.emit(
            "los:caps",
            serde_json::json!({
                "globalShortcutAvailable": true,
                "globalShortcutRegistered": false,
                "accel": accel
            }),
        );
        return Ok(());
    }

    let shortcut = parse_accel(accel)?;
    let accel_owned = accel.to_string();

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
            if let Some(state) = app.try_state::<ShortcutStateMutex>() {
                if let Ok(mut g) = state.0.lock() {
                    g.registered = true;
                    g.error = None;
                    g.accel = accel_owned.clone();
                }
            }
            let _ = app.emit(
                "los:caps",
                serde_json::json!({
                    "globalShortcutAvailable": true,
                    "globalShortcutRegistered": true,
                    "accel": accel_owned
                }),
            );
            Ok(())
        }
        Err(e) => {
            let msg = e.to_string();
            if let Some(state) = app.try_state::<ShortcutStateMutex>() {
                if let Ok(mut g) = state.0.lock() {
                    g.registered = false;
                    g.error = Some(msg.clone());
                    g.accel = accel_owned.clone();
                }
            }
            let _ = app.emit(
                "los:caps",
                serde_json::json!({
                    "globalShortcutAvailable": true,
                    "globalShortcutRegistered": false,
                    "error": msg,
                    "accel": accel_owned
                }),
            );
            Err(format!("Global shortcut registration failed gracefully: {e}"))
        }
    }
}

#[tauri::command]
pub fn shortcuts_reregister(
    app: AppHandle,
    enabled: bool,
    accel: String,
) -> Result<serde_json::Value, String> {
    match reregister_inner(&app, enabled, &accel) {
        Ok(()) => Ok(serde_json::json!({ "registered": enabled, "error": null })),
        Err(e) => Ok(serde_json::json!({ "registered": false, "error": e })),
    }
}

#[allow(dead_code)]
pub fn shortcut_status(state: TauriState<ShortcutStateMutex>) -> serde_json::Value {
    let g = state.0.lock().unwrap();
    serde_json::json!({
        "registered": g.registered,
        "error": g.error,
        "accel": g.accel
    })
}
