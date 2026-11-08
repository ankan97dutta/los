# Verification Evidence: GitHub Feedback Button

**Feature**: `specs/006-github-feedback`  
**Created**: 2026-11-07

## Success criteria

| ID | Result | Notes |
|----|--------|-------|
| SC-001 | PASS (dev) | Settings → Send feedback → kind/title/body → Continue opens GitHub new-issue URL builder path; under 60s on a known build |
| SC-002 | n/a | Moderated first-use study deferred |
| SC-003 | PASS (dev) | Failed open keeps dialog + Copy draft; Today still editable |
| SC-004 | PASS (dev) | Builder/tests never inject workspace DB fields; body matches draft |
| SC-005 | PASS | No LOS account or GitHub token UI |
| SC-006 | PASS (unit) | Domain tests cover URL budget clipboard fallback |

## Quickstart scenarios

| Scenario | Result | Notes |
|----------|--------|-------|
| A Happy path | PASS (dev) | Label fallback (templates empty in config until ISSUE_TEMPLATE exists) |
| B Palette | PASS (dev) | Capture → Send feedback |
| C Clipboard fallback | PASS (unit) | `feedback.test.ts` long body |
| D Offline / open failure | PASS (dev) | Preview popup-blocked / opener error path |
| E Validation | PASS (dev + unit) | Kind/title/body required |

## Shell chrome

- No always-visible Feedback control in `AppShell` (Settings + palette only).

## Commands run

```bash
pnpm --filter @los/domain test
pnpm --filter @los/desktop lint
```
