# Quickstart: GitHub Feedback Button

**Feature**: `specs/006-github-feedback` | **Date**: 2026-11-07

Manual validation after implementation. Record outcomes in `checklists/verification-evidence.md` during `/speckit-implement`.

## Prerequisites

- Repo on `feature/007-github-feedback` with this feature implemented
- `pnpm install`
- Prefer `pnpm --filter @los/desktop tauri:dev` for real browser open; Vite preview only checks UI + popup path

## Automated checks

```bash
pnpm --filter @los/domain test   # includes feedback.test.ts
pnpm --filter @los/desktop lint
```

Expect URL builder, validation, and length-budget cases green.

## Scenario A — Happy path (blank / label fallback)

1. Open Settings → **Send feedback**.
2. Choose **Bug**, title `Feedback smoke test`, short description.
3. Confirm diagnostics visible in the description; leave or edit them.
4. Read privacy notice → **Continue**.
5. Default browser opens `github.com/.../issues/new` with title (and labels or template).
6. LOS closes the dialog and shows confirmation that the **browser opened** (not that an issue was filed).
7. Submit or cancel on GitHub; return to LOS — Today still works; no tokens prompted in-app.

## Scenario B — Command palette

1. `⌘K` / `Ctrl+K` → type `feedback` → **Send feedback**.
2. Same dialog as Settings; cancel with Escape — no browser, draft discarded, prior route intact.

## Scenario C — Clipboard fallback

1. Paste a very long description (enough to exceed the 2k URL budget).
2. Continue.
3. Browser opens with title/kind; confirmation mentions **paste**.
4. Paste into GitHub body — content matches what was in the dialog.

## Scenario D — Offline / open failure

1. Disable network or block opener (or use preview with popup blocked).
2. Continue from a valid draft.
3. Error is visible; dialog stays open; Copy draft works; navigate to Today and add a next-action line successfully.

## Scenario E — Validation

1. Open Feedback; leave kind unset or clear title/body → Continue blocked or shows required errors.
2. No browser window opens.

## Done when

- A–E pass on Tauri-dev (D as applicable)
- Domain unit tests pass
- No new migration; Settings/palette only entry points (no sidebar Feedback control)
