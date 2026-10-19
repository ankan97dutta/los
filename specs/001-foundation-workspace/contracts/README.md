# Contracts: Foundational LOS Desktop Workspace

In-process **command/query ports** between the UI (and tray/shortcut entrypoints) and `app-services`. Not HTTP. Implementations live in `packages/app-services`; UI calls via Tauri `invoke` or direct import in tests.

See:
- [workspace-commands.md](./workspace-commands.md) — mutations
- [workspace-queries.md](./workspace-queries.md) — reads
