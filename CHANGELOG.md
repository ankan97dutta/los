# Changelog

All notable changes to LOS (Lead OS) are recorded here. The format follows Keep a Changelog, and versions follow semantic versioning.

## [0.1.0] - 2026-10-20

First release. A local-first desktop workspace for an engineering lead: capture, plan, focus, and review, all on your own device with no account and no cloud.

### Added
- Focus mode with Pomodoro, Deep work and Custom techniques in a redesigned overlay (progress ring, technique cards, block dots, wrap-up state), a live header timer, the countdown mirrored in the system tray with tooltip and menu status, and turn-offable end notifications that are generic by default
- Monthly (MBR) and Quarterly (QBR) report drafts inside Reviews, built only from local data, with editing, section remove-and-undo, refresh that keeps edited sections word for word, and copy and print with honest covers-to-today wording
- Ember orange and Signal red primary colors, paired independently with the dark and light appearances across all screens
- Lead command UX shell: command palette, six keyboard-first sections, UI tour, shortcuts dialog, and tray plus global shortcut capture
- Fortnight capacity planning with soft gates, close and carry-forward, and conflict warnings in plain words
- Foundation workspace: Today brief, Inbox triage, Personal Actions, Team roster and Threads, monthly reviews and planning history, on SQLite with backup, restore and reset
- Automated copy check (`pnpm check:copy`) guarding every user-facing surface against dash characters and stock phrases

### Fixed
- Global shortcut registration and status detection in the Tauri 2 shell
- Keyboard handling behind open dialogs: global jump keys no longer fire under modals, and Tab stays trapped inside the palette, shortcuts dialog and focus overlay

### Changed
- Insight-first screen passes so Today, Inbox, Planning, Team and Reviews lead with the answer, plus a full plain-language copy review
- Consistent desktop control system and redesigned inbox, planning, threads and reviews calendar surfaces
