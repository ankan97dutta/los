# Research: GitHub Feedback Button

**Feature**: `specs/006-github-feedback` | **Date**: 2026-11-07

## R1 — Destination repository

**Decision**: Official builds target `https://github.com/ankan97dutta/los` Issues. Kind→template/label map lives in `apps/desktop/src/lib/feedbackConfig.ts` as compile-time constants (not user settings).

**Rationale**: Spec assumes a fixed product destination; the public LOS repo already hosts releases and is the natural triage surface. Maintainer-side GitHub Project auto-add stays outside the app.

**Alternatives considered**: Per-user destination URL (rejected for v1 — settings surface and abuse risk); hardcoding only a Project board URL (rejected — Projects API/auth out of scope).

## R2 — Opening the browser

**Decision**: Use `@tauri-apps/plugin-opener` (`openUrl`) in Tauri builds, scoped in capabilities to `https://github.com/*`. Wrap in `feedbackOpen.ts`. On failure, return an error the UI can show without crashing the shell.

**Rationale**: Tauri 2 recommends opener for external URLs; keeps allow-lists explicit. Matches constitution soft-fail for optional OS integrations.

**Alternatives considered**: `tauri-plugin-shell` `open` (acceptable fallback if opener is unavailable in the pinned CLI); embedding a WebView to GitHub (rejected — login UX and security surface); GitHub REST API with PAT (rejected by clarify/spec).

## R3 — Vite preview behavior

**Decision**: In non-Tauri preview, attempt `window.open(url, '_blank', 'noopener,noreferrer')`. If the popup is blocked, show the same non-blocking failure path as opener failure, with copy-draft available.

**Rationale**: Preview remains useful for UI validation; honesty over fake success.

**Alternatives considered**: Disable Feedback entirely in preview (worse for UI iteration); silently no-op (fails UX constitution).

## R4 — Prefill length budget and clipboard fallback

**Decision**: Build the candidate URL with title + body query params (blank issue) or title where forms support it. If encoded URL length exceeds **2,000 characters**, or body encoding fails the budget after title/kind, omit body from the URL, copy the full description (including user-accepted diagnostics) to `navigator.clipboard`, set `usedClipboardFallback: true`, and open with title/kind only. Confirmation copy must mention paste when fallback was used.

**Rationale**: Spec FR-003b; 2k is a conservative cross-browser query-string budget for GitHub new-issue links. Clipboard pattern already used in Reports.

**Alternatives considered**: Truncate body in URL (rejected in clarify); block continue until shortened (rejected in clarify); always clipboard (worse happy path).

## R5 — Kind → GitHub mapping

**Decision**: Config shape per kind: optional `template` (GitHub issue template/form query value, e.g. `bug.yml`) and `labels` (string array). Builder prefers `.../issues/new?template=<id>&title=...` when `template` is set; otherwise `.../issues/new?title=...&labels=...&body=...` (body subject to R4). Ship v1 with sensible default labels (`bug`, `enhancement`, `feedback` for Other) even if templates are empty strings until maintainers add `.github/ISSUE_TEMPLATE` files.

**Rationale**: Clarify chose template-prefer with label fallback so shipping is not blocked on repo template setup.

**Alternatives considered**: Templates-only (rejected); labels-only (weaker triage structure when templates exist).

## R6 — Module placement

**Decision**: Pure draft validation + URL construction in `@los/domain` (`feedback.ts`). Desktop config + dialog + opener adapter only.

**Rationale**: Domain tests without Tauri; constitution modular boundaries.

**Alternatives considered**: All logic in `apps/desktop` (harder reuse/test); new package (unnecessary scope).

## R7 — Diagnostics defaults

**Decision**: Default-on appendix lines: app version from package/`tauri.conf` version surface already shown in-app where available, and `navigator.userAgent` platform summary or Tauri OS arch string when cheap. Rendered inside the editable description textarea (or a clearly editable block merged into description before handoff) so removal is ordinary text edit.

**Rationale**: FR-006; keeps one editable surface.

**Alternatives considered**: Separate toggles per diagnostic field (more UI than needed for v1); auto-attach without showing (privacy violation).
