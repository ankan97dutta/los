# Design Refresh — Premium Lead Command Center (2026-10-20)

Status: proposed plan, implemented as Phase 22 (T104–T112) in tasks.md.
Supersedes no prior acceptance criteria; builds on T001–T103.

## Audit findings (before changes)

- Stack is React 19 + CSS variables (tokens.css/base.css), **no MUI/Tailwind** — spec
  004 already forbids a second UI framework without ADR. Keep it.
- Shell existed but: no contextual page header, no right detail panel, content
  capped at 52rem (wasted wide-desktop space), nav ungrouped, no shortcut hints
  or Inbox count, palette ungrouped without hints.
- Planning existed but was a CRUD form: summary strip omitted net/committed/
  remaining totals (service returns them), no workload visualization, warnings
  only in a global banner (service warnings carry `workItemId`/`teamMemberId`),
  close flow conflated carryover notes with trade-off notes via `window.confirm`.
- **Key correction to 004 Track B**: the service layer *does* expose priority,
  actualHours, applicationId, dependencyNotes (`planningWorkUpsert`) and separate
  tradeoff/outcome/carryover notes (`planningPeriodSaveMeta`,
  `planningPeriodClose`). They were UI omissions, not missing domain fields.
  This refresh wires them; no domain/SQLite change is needed or made.
- Today was a bare Daily Review form; it answered none of the three brief
  questions structurally.

## Preserved

Domain/app-service/persistence boundaries, soft-gate + conflicted persistence,
freeze on close, carry-forward copy semantics, FR-U14 LocalStatus phrases,
autosave + SaveIndicator, command palette, theme in localStorage, Tauri sizing.

## Design system (concise)

- Graphite dark default (`--bg #0e1116`-family, raised surfaces by tone, hairline
  borders), polished light theme; indigo accent (`#7c7ff0` dark / `#4f46c8`
  light) reserved for primary action, selection, focus.
- Semantic colors only for meaning: ok / warning / danger / conflicted /
  unknown — always paired with text (StatusCue), never color alone.
- Type: IBM Plex Sans, tabular numerals (`font-variant-numeric`) for all hours;
  13px dense base, clear h1/h2 hierarchy.
- Density: 232px sidebar, fluid workspace (no 52rem cap), 340px detail panel;
  radius 6/8px; minimal shadows (palette/dialog only); motion ≤160ms,
  disabled under `prefers-reduced-motion`.

## Screen map (actual operations only)

| Screen | Backing service | Refresh |
|---|---|---|
| Today | `dailyGet/Upsert` | Brief structure: Next actions (move forward) → Blockers (who is blocked) → Follow-ups/decisions; autosave unchanged |
| Inbox | `inboxCapture/List/Triage`, Actions via sub-nav | Capture-first; count in nav; triage unchanged |
| Planning | `planningPeriodGet`, capacity/work/allocate/saveMeta/close/history, `applicationsList` | Decision canvas + detail panel (below) |
| Team | members + Applications | Existing sub-nav; inherits tokens/header |
| Reviews & History | Monthly, Fortnight, closed snapshot | Existing sub-nav; inherits tokens/header |
| Settings | settings, backup/restore, theme | Grouped prefs; SYSTEM group in nav |

## Planning canvas layout

```
Header: Fortnight 12–23 Oct · Open/Clean|Conflicted      [Prev] [Next]
Summary (tabular): Net | Committed | Remaining | Unallocated | Unestimated
Team workload: per-member bar (committed vs net), stretch shown separately,
  over-capacity + zero-capacity text beside the member; click → affected work
Warnings: banner list where each warning has Review → selects affected item/member
Demand: compact rows (priority, title, application, est/Unknown, actual,
  assignee, Committed●/Stretch○, status, blocked cue) → click opens detail panel
Detail panel (right, in-flow): edit title/priority/estimate/actual/application/
  dependency notes/status/assignee/kind; read-only when closed
Close review (inline, not window.confirm): warnings, committed/done/incomplete
  counts, carry-forward checkboxes, separate Trade-off / Outcome / Carryover
  fields, explicit acknowledge-warnings checkbox, then Close
Capacity explanation: "Net = Available − Leave − Reserved − Buffer" caption
```

Rules kept: Unknown never renders as 0h; commitment requires assignee (service
rejects; UI disables with explanation); no silent reassignment; closed periods
read-only for structure, notes editable; history snapshot unchanged.

## Increments (reviewable)

1. Tokens + shell (grouped nav, hints, counts, contextual header, palette groups)
2. Planning canvas + detail panel + close review (fields above)
3. Today brief restructure; remaining screens inherit
4. Focused tests for pure planning view helpers; full regression + build;
   honest gaps in verification-evidence.md
