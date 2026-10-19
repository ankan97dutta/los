# Contracts (002 deltas)

Primary command/query contracts remain those in `specs/001-foundation-workspace/contracts/`.

This remediation does **not** change product command shapes. Implementation must satisfy 001 contracts over SQLite + Tauri invoke.

### Expected bridge clarifications (implementation notes, not new product APIs)

- Packaged desktop: UI → Tauri invoke → persistence/app-services with SQLite
- Errors for corrupt DB open: stable error code/message suitable for recoverable UI (define during implement; document in evidence)
- `workspace.status` continues to report `mode: "local_only"` plus tray/shortcut capability flags including registration failure reason when available
