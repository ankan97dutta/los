use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

fn los_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    let dir = base.join("los");
    fs::create_dir_all(&dir).map_err(|e| format!("create los dir: {e}"))?;
    Ok(dir)
}

pub fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(los_dir(app)?.join("los.sqlite"))
}

fn sqlite_url(path: &Path) -> String {
    // Absolute path form for tauri-plugin-sql
    format!("sqlite:{}", path.to_string_lossy())
}

/// Ensure app-data `los/` exists. Create flag = file absent. Corrupt/locked open handled in webview.
#[tauri::command]
pub fn db_bootstrap(app: tauri::AppHandle) -> serde_json::Value {
    match db_path(&app) {
        Ok(path) => {
            let created = !path.exists();
            if let Some(parent) = path.parent() {
                if let Err(e) = fs::create_dir_all(parent) {
                    return serde_json::json!({
                        "ok": false,
                        "dbPath": path.to_string_lossy(),
                        "error": { "code": "DB_OPEN_FAILED", "message": format!("Cannot create app-data dir: {e}") }
                    });
                }
            }
            serde_json::json!({
                "ok": true,
                "dbPath": path.to_string_lossy(),
                "sqliteUrl": sqlite_url(&path),
                "created": created
            })
        }
        Err(e) => serde_json::json!({
            "ok": false,
            "error": { "code": "DB_OPEN_FAILED", "message": e }
        }),
    }
}

#[tauri::command]
pub fn db_export_backup(
    app: tauri::AppHandle,
    dest_path: Option<String>,
) -> Result<serde_json::Value, String> {
    let live = db_path(&app)?;
    if !live.exists() {
        return Err("Live database not found".into());
    }
    let dest = match dest_path {
        Some(p) => PathBuf::from(p),
        None => {
            let dir = los_dir(&app)?.join("backups");
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let secs = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0);
            dir.join(format!("los-backup-{secs}.sqlite"))
        }
    };
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::copy(&live, &dest).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "backupPath": dest.to_string_lossy() }))
}

/// Replace live DB. Caller MUST close plugin-sql first and MUST refuse DB_SCHEMA_TOO_NEW in JS before invoke.
#[tauri::command]
pub fn db_restore_backup(
    app: tauri::AppHandle,
    source_path: String,
) -> Result<serde_json::Value, String> {
    let source = PathBuf::from(&source_path);
    if !source.exists() {
        return Err("Backup file not found".into());
    }
    let bytes = fs::read(&source).map_err(|e| e.to_string())?;
    if bytes.len() < 16 || &bytes[0..16] != b"SQLite format 3\0" {
        return Err("Backup is not a SQLite database".into());
    }
    let live = db_path(&app)?;
    fs::copy(&source, &live).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "dbPath": live.to_string_lossy(),
        "sqliteUrl": sqlite_url(&live)
    }))
}

#[tauri::command]
pub fn db_path_cmd(app: tauri::AppHandle) -> Result<String, String> {
    Ok(db_path(&app)?.to_string_lossy().to_string())
}

/// Delete the live DB (plus WAL/SHM sidecars) so the next boot creates a
/// fresh workspace. Caller MUST close plugin-sql first. Most reliable reset:
/// cannot be blocked by a locked table or dangling transaction.
#[tauri::command]
pub fn db_reset_all(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let live = db_path(&app)?;
    for suffix in ["", "-wal", "-shm", "-journal"] {
        let path = if suffix.is_empty() {
            live.clone()
        } else {
            PathBuf::from(format!("{}{}", live.to_string_lossy(), suffix))
        };
        if path.exists() {
            fs::remove_file(&path).map_err(|e| format!("remove {}: {e}", path.display()))?;
        }
    }
    Ok(serde_json::json!({
        "dbPath": live.to_string_lossy(),
        "sqliteUrl": sqlite_url(&live)
    }))
}
