# Data Model: GitHub Feedback Button

**Feature**: `specs/006-github-feedback` | **Date**: 2026-11-07

No durable storage. Entities below are in-memory / config only.

## FeedbackKind

| Value | Meaning |
|-------|---------|
| `bug` | Something broken or incorrect |
| `idea` | Enhancement or feature request |
| `other` | Anything else |

Canonical UI labels: **Bug**, **Idea**, **Other**.

## FeedbackDraft

Session-only object built in the UI and passed to the pure handoff builder.

| Field | Type | Rules |
|-------|------|-------|
| `kind` | `FeedbackKind` | Required before continue |
| `title` | string | Required; trim; non-empty after trim |
| `description` | string | Required; trim; non-empty after trim; may include diagnostics the user kept |
| `includeDiagnostics` | boolean | Default `true`; when true, builder/UI seeds diagnostics into the editable description once |

**Lifecycle**: create empty → edit → validate → handoff attempt → on success discard; on failure retain for copy/retry; on cancel discard.

## FeedbackTargetConfig (compile-time)

| Field | Type | Notes |
|-------|------|-------|
| `owner` | string | e.g. `ankan97dutta` |
| `repo` | string | e.g. `los` |
| `kinds` | map kind → `{ template?: string; labels: string[] }` | Empty `template` ⇒ label-only blank issue |

## HandoffResult (pure function output)

| Field | Type | Notes |
|-------|------|-------|
| `ok` | boolean | Validation passed and URL produced |
| `url` | string | Absolute `https://github.com/.../issues/new?...` |
| `usedClipboardFallback` | boolean | Body omitted from URL; caller must copy description |
| `bodyForClipboard` | string \| null | Full description to copy when fallback |
| `errors` | string[] | Validation messages (`kind`, `title`, `description`) |

## Persistence

None. No tables, migrations, or `localStorage` keys for drafts in v1.
