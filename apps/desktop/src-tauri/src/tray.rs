use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

/// The tray menu's focus status line, kept so the countdown text can be
/// updated from the webview once a second (see `tray_focus_update`).
pub struct FocusMenuItem(pub Mutex<Option<MenuItem<tauri::Wry>>>);

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let focus_status = MenuItem::with_id(app, "focus-status", "No focus session", false, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let open = MenuItem::with_id(app, "open", "Open workspace", true, None::<&str>)?;
    let quick = MenuItem::with_id(app, "quick", "Quick capture", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&focus_status, &separator, &open, &quick, &quit])?;
    app.manage(FocusMenuItem(Mutex::new(Some(focus_status))));

    // Explicit icon: TrayIconBuilder without .icon() renders no visible
    // menu-bar item on macOS. Template mode lets macOS recolor the
    // monochrome LOS wordmark for light/dark menu bars.
    let mut builder = TrayIconBuilder::with_id("main");
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    let _tray = builder
        .menu(&menu)
        .tooltip("Lead OS")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main(app),
            "focus-status" => {
                show_main(app);
                let _ = app.emit("los:open-focus", ());
            }
            "quick" => {
                show_main(app);
                let _ = app.emit("los:quick-capture", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main(tray.app_handle());
            }
        })
        .build(app)?;

    let _ = app.emit(
        "los:caps",
        serde_json::json!({ "trayAvailable": true }),
    );
    Ok(())
}

/// Updates the tray countdown from the webview's session watcher.
///
/// `title` is the text drawn next to the menu-bar icon on macOS (the live
/// clock), `tooltip` the hover text, and `status` the menu status line.
/// All are optional so the webview can clear the tray when no session runs.
/// Failures are ignored on purpose: the tray is a mirror, never a blocker.
#[tauri::command]
pub fn tray_focus_update(
    app: AppHandle,
    title: Option<String>,
    tooltip: Option<String>,
    status: Option<String>,
) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(title.as_deref());
        if let Some(text) = tooltip.as_deref() {
            let _ = tray.set_tooltip(Some(text));
        }
    }
    if let (Some(state), Some(text)) = (app.try_state::<FocusMenuItem>(), status) {
        if let Ok(guard) = state.0.lock() {
            if let Some(item) = guard.as_ref() {
                let _ = item.set_text(&text);
                let _ = item.set_enabled(text != "No focus session");
            }
        }
    }
}

fn show_main(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
