# Implementation Plan: Foundational LOS Desktop Workspace

**Branch**: `feature/001-foundation-workspace` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-foundation-workspace/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Deliver a local-first macOS desktop workspace where an engineering lead can capture inbox items, triage them into personal actions, organize actions under four renameable applications, and run daily / fortnightly / monthly planning reviews—all offline, with no Jira/Confluence/LLM dependency. Technical approach: **Tauri 2 + React + TypeScript**, a **pure TypeScript domain** with Vitest, **SQLite + versioned migrations** behind a persistence adapter, system tray + global quick-capture shortcut with in-app fallbacks, debounced autosave for review editors, and fixed Monday-anchored fortnights (configurable start weekday).

## Technical Context

**Language/Version**: TypeScript 5.x (domain + UI); Rust stable (Tauri shell only)

**Primary Dependencies**: Tauri 2, React 19, Vite, Vitest, SQLite (via persistence adapter / Tauri SQL plugin or rusqlite bridge)

**Storage**: Local SQLite database in OS app data directory; versioned SQL migrations on startup

**Testing**: Vitest for domain + persistence-fakes; adapter tests against SQLite; manual/desktop smoke for tray & global shortcut (documented in quickstart)

**Target Platform**: macOS first (tray + global shortcut acceptance); domain/persistence portable

**Project Type**: Desktop application (local-first personal productivity)

**Performance Goals**: Cold start → capture inbox item &lt; 30s (SC-001); quick capture &lt; 15s active time (SC-005); UI remains responsive during debounced autosave

**Constraints**: Fully offline core; no account/cloud/telemetry; no LLM/Jira/Confluence; domain must not import UI/Tauri/SQLite drivers; constitution quality gates apply

**Scale/Scope**: Single-user local install; four application slots; inbox/actions/reviews for personal use (thousands of rows, not multi-tenant)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Plan disposition |
|------|------------------|
| Offline core | Pass — SQLite local; no network required for any FR in this feature |
| No LLM required | Pass — no AI packages or runtime hooks |
| Privacy default | Pass — no account, cloud, or telemetry |
| Adapter isolation | Pass (N/A adapters) — no external integrations; future adapters out of tree |
| Ownership clarity | Pass — all entities are LOS-owned personal data |
| Modular boundaries | Pass — `packages/domain` pure TS; UI and DB are adapters |
| Migration safety | Pass — versioned SQL migrations; seed apps in migration; backup note in quickstart |
| Test evidence | Pass — domain + period math + triage/next-action rules under Vitest |
| Spec completeness | Pass — spec clarified; this plan + later tasks |
| Desktop UX | Pass — tray, global shortcut when permitted, in-app capture, local-only status |

**Post-design re-check**: Structure below preserves domain independence; contracts are in-process command ports (not remote APIs). No constitution violations. Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-workspace/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
└── desktop/                 # Tauri 2 + React UI shell
    ├── src/                 # React views: inbox, actions, apps, reviews, tray/quick-capture
    ├── src-tauri/           # Rust: window, tray, global shortcut, DB path, invoke handlers
    └── package.json

packages/
├── domain/                  # Pure TS: entities, commands, fortnight math, validation
│   ├── src/
│   └── tests/
├── persistence/             # SQLite repositories + migrations implementing domain ports
│   ├── src/
│   ├── migrations/
│   └── tests/
└── app-services/            # Use-case orchestration (wire domain + persistence ports)
    ├── src/
    └── tests/

tests/
├── domain/                  # (or live under packages/*/tests)
└── desktop-smoke/           # Optional scripted smoke checklist runners later
```

**Structure Decision**: Monorepo with `apps/desktop` (UI + Tauri) and `packages/{domain,persistence,app-services}` so domain tests never import React/Tauri/SQLite. Persistence is the only package that knows SQLite. App-services expose command handlers invoked from the UI (and from tray/shortcut entrypoints).

## Complexity Tracking

> No constitution violations requiring justification.
