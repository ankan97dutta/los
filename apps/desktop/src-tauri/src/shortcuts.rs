use tauri::{AppHandle, Emitter, Manager, State as TauriState};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use std::sync::Mutex;

pub struct ShortcutStateInner {
    pub registered: bool,
    pub error: Option<String>,
    pub accel: String,
}

pub struct ShortcutStateMutex(pub Mutex<ShortcutStateInner>);

pub const DEFAULT_ACCEL: &str = "CommandOrControl+Shift+L";

/// Token-based accelerator parsing.
///
/// Tokens are split on `+` and matched exactly (case-insensitive), so
/// `CommandOrControl` resolves to a single primary modifier (SUPER on
/// macOS, CONTROL elsewhere) instead of substring-matching both `cmd`
/// and `ctrl` out of e.g. `CmdOrCtrl`.
fn parse_accel(accel: &str) -> Result<Shortcut, String> {
    let tokens: Vec<String> = accel
        .split('+')
        .map(|t| t.trim().to_lowercase())
        .filter(|t| !t.is_empty())
        .collect();
    if tokens.len() < 2 {
        return Err(format!("Invalid accelerator: {accel}"));
    }
    let (key_token, mod_tokens) = tokens.split_last().unwrap();

    let mut mods = Modifiers::empty();
    for token in mod_tokens {
        match token.as_str() {
            "commandorcontrol" | "cmdorctrl" | "commandorctrl" | "ctrlorcmd" => {
                #[cfg(target_os = "macos")]
                {
                    mods |= Modifiers::SUPER;
                }
                #[cfg(not(target_os = "macos"))]
                {
                    mods |= Modifiers::CONTROL;
                }
            }
            "cmd" | "command" | "super" | "meta" | "win" => mods |= Modifiers::SUPER,
            "ctrl" | "control" | "ctl" => mods |= Modifiers::CONTROL,
            "alt" | "option" | "opt" => mods |= Modifiers::ALT,
            "shift" => mods |= Modifiers::SHIFT,
            other => return Err(format!("Unsupported shortcut modifier: {other}")),
        }
    }

    let code = match key_token.as_str() {
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
        "0" => Code::Digit0,
        "1" => Code::Digit1,
        "2" => Code::Digit2,
        "3" => Code::Digit3,
        "4" => Code::Digit4,
        "5" => Code::Digit5,
        "6" => Code::Digit6,
        "7" => Code::Digit7,
        "8" => Code::Digit8,
        "9" => Code::Digit9,
        "." | "period" => Code::Period,
        "," | "comma" => Code::Comma,
        "/" | "slash" => Code::Slash,
        other => return Err(format!("Unsupported shortcut key: {other}")),
    };
    Ok(Shortcut::new(Some(mods), code))
}

pub fn setup_shortcuts(app: &AppHandle) -> Result<(), String> {
    reregister_inner(app, true, DEFAULT_ACCEL)
}

fn set_state(app: &AppHandle, registered: bool, error: Option<String>, accel: &str) {
    if let Some(state) = app.try_state::<ShortcutStateMutex>() {
        if let Ok(mut g) = state.0.lock() {
            g.registered = registered;
            g.error = error;
            g.accel = accel.to_string();
        }
    }
}

fn reregister_inner(app: &AppHandle, enabled: bool, accel: &str) -> Result<(), String> {
    // Unregister all first (best-effort)
    let _ = app.global_shortcut().unregister_all();

    if !enabled {
        set_state(app, false, None, accel);
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

    // NOTE: `on_shortcut` already registers the hotkey with the OS.
    // Do NOT call `.register(shortcut)` again — a second registration
    // always fails ("already registered" / RegisterEventHotKey failed)
    // and previously flipped state to a spurious `registered=false`.
    match app
        .global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app.emit("los:quick-capture", ());
            }
        }) {
        Ok(()) => {
            set_state(app, true, None, &accel_owned);
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
            set_state(app, false, Some(msg.clone()), &accel_owned);
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

#[cfg(test)]
mod tests {
    use super::*;

    fn mods(accel: &str) -> Modifiers {
        parse_accel(accel).unwrap().mods
    }

    #[test]
    fn command_or_control_is_single_primary_modifier() {
        let m = mods("CommandOrControl+Shift+L");
        #[cfg(target_os = "macos")]
        assert_eq!(m, Modifiers::SUPER | Modifiers::SHIFT);
        #[cfg(not(target_os = "macos"))]
        assert_eq!(m, Modifiers::CONTROL | Modifiers::SHIFT);
        // Regression: must NOT be SUPER+CONTROL+SHIFT
        assert!(!(m.contains(Modifiers::SUPER) && m.contains(Modifiers::CONTROL)));
    }

    #[test]
    fn cmd_shift_is_super_shift() {
        assert_eq!(mods("Cmd+Shift+L"), Modifiers::SUPER | Modifiers::SHIFT);
    }

    #[test]
    fn ctrl_shift_is_control_shift() {
        assert_eq!(mods("Ctrl+Shift+L"), Modifiers::CONTROL | Modifiers::SHIFT);
    }

    #[test]
    fn cmdorctrl_alias_is_single_primary() {
        let m = mods("CmdOrCtrl+Shift+K");
        assert!(!(m.contains(Modifiers::SUPER) && m.contains(Modifiers::CONTROL)));
        assert!(m.contains(Modifiers::SHIFT));
    }

    #[test]
    fn rejects_unknown_modifier_and_key() {
        assert!(parse_accel("Hyper+Shift+L").is_err());
        assert!(parse_accel("Cmd+Shift+Banana").is_err());
        assert!(parse_accel("L").is_err());
    }
}
