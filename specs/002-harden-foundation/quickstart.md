# Quickstart / Verification: Harden Foundation

**Feature**: `002-harden-foundation`  
**Purpose**: Pre-implementation review + post-implementation verification commands (no code changes until review).

## Prerequisites

- Branch `feature/002-harden-foundation`
- macOS for tray/shortcut acceptance
- Read baseline: `specs/001-foundation-workspace/spec.md`, constitution, foundation audit findings

## After implementation (do not claim pass until run)

```bash
export PATH="$HOME/.local/bin:$PATH:$HOME/.cargo/bin"
pnpm install
pnpm lint
pnpm test
pnpm --filter @los/desktop build
(cd apps/desktop/src-tauri && cargo check)
pnpm --filter @los/desktop tauri:dev
```

### Persistence / restore

- Confirm DB path in `apps/desktop/README.md` matches live app-data SQLite file
- Run Vitest backup_restore against SQLite
- Manual: capture → quit → relaunch offline → item present (3×)

### Corrupt open

- Place invalid bytes at DB path (while app quit) → launch → original file unchanged + recoverable error

### Fortnight / shortcut / keyboard

- Select action → complete → still listed on fortnight
- Toggle/deny shortcut → in-app capture works; status shows failure
- Keyboard-only: capture → triage → open actions

Record all results in `checklists/verification-evidence.md` (create during T016/T027).

## Migration risk note

Prototype `localStorage` / JSON users: one-time import only if SQLite absent and source validates. Prefer export Settings/JSON before first hardened launch.
