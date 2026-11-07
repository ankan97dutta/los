# Contract: Feedback Handoff

**Feature**: `specs/006-github-feedback` | **Date**: 2026-11-07

## Pure API (`@los/domain`)

### `validateFeedbackDraft(draft) → { ok, errors[] }`

- Errors use stable codes: `kind_required`, `title_required`, `description_required`.
- Whitespace-only title/description ⇒ required errors.

### `buildFeedbackIssueUrl(draft, config) → HandoffResult`

Preconditions: draft validates.

Behavior:

1. Resolve kind config (`template`, `labels`).
2. If `template` non-empty →  
   `https://github.com/{owner}/{repo}/issues/new?template={template}&title={encodeURIComponent(title)}`  
   Body is **not** assumed supported on forms → set clipboard fallback with full description (always for template path), unless a future config flag enables body query (v1: always clipboard for template path when description non-empty).
3. Else →  
   `.../issues/new?title=...&labels={comma-separated encoded}&body=...`  
   If encoded URL length `> 2000`, drop `body`, set `usedClipboardFallback`, set `bodyForClipboard` to description.
4. Never append workspace DB fields.

### `composeDiagnostics({ appVersion, platform }) → string`

Returns a short markdown-ish or plain appendix block the UI can insert into the description editor.

## Desktop adapters

### `openFeedbackUrl(url: string) → Promise<{ ok: true } | { ok: false; error: string }>`

- Tauri: opener plugin, allowlist `https://github.com/*`.
- Preview: `window.open`; treat blocked popup as failure.
- Must not throw across the UI boundary.

### Clipboard

- When `usedClipboardFallback`, call `navigator.clipboard.writeText(bodyForClipboard)` before or immediately after open.
- If clipboard write fails, still attempt open; confirmation must say paste may be needed manually / copy failed.

## UI contract

### Entry points

| Source | Behavior |
|--------|----------|
| Settings → “Send feedback” (accessible name) | Opens `FeedbackDialog` |
| Command palette → “Send feedback” | Same dialog; group e.g. `Capture` |

### Dialog

- Fields: kind (radios or select), title, description (multiline).
- Privacy notice visible before Continue.
- Continue disabled until validation would pass (or validates on click with inline errors).
- Cancel/Escape closes without side effects.
- Success: close dialog; toast/banner: browser opened; if clipboard fallback, mention paste.
- Failure: keep dialog open; show error; offer Copy draft.

### Forbidden claims

- Never “Issue created” / “Feedback submitted to GitHub” after open alone.

## Command palette action shape

Extend `PaletteAction`:

- `run: 'feedback'` (or equivalent)
- `id: 'send-feedback'`
- `label: 'Send feedback'`
