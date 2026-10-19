# Proposed Constitution Amendment: Interaction & Presentation Honesty

**Status**: Awaiting review — **do not apply** until approved  
**Target file**: `.specify/memory/constitution.md`  
**Suggested version**: `1.0.0` → `1.1.0` (MINOR: expand Principle X + Desktop UX gate; no principle renumbering)  
**Date**: 2026-10-19

## Gap analysis (current vs desired enduring rules)

| Concern | Today (v1.0.0) | Gap |
|---------|----------------|-----|
| Interaction quality | X: “keyboard-friendly”, “responsive” | No MUST for predictable controls, accessible names, or minimal friction beyond capture |
| Visual consistency | Modular architecture (VI) only | No enduring rule that core surfaces share coherent presentation patterns (themes stay out of constitution) |
| Information clarity | Offline/degraded communication in X | Unknown, conflict, and error states not required to be non-color-only / explicit |
| Progressive disclosure | Absent | Risk of dumping or hiding critical conflict info |
| Data integrity in UX | VII: no silent discard; confirm destructive | Save success/failure observability not stated for UI |
| Native desktop | Tray, shortcut, offline status | Practical window sizing / platform conventions not stated |

## Smallest justified change

**Expand Principle X in place** (keep number X). **Do not** add theme colors, typography stacks, or component libraries to the constitution — those belong in feature `004` / design-system plan.

### Replace Principle X body with

```markdown
### X. Usable Desktop Experience
LOS MUST support quick capture, keyboard-operable primary workflows, a system-tray
entry point, clear offline/degraded status, and responsive interactions.
Core functionality MUST remain accessible if optional capabilities
(integrations, AI, sync) are unavailable.
UI MUST communicate degraded or offline state without blocking core paths.

Interactive controls for primary workflows MUST be keyboard-operable and MUST
expose accessible names (and roles where the toolkit supports them).
Decision-critical status—including unknown values, conflicts, persistence
outcomes (saved / failed / pending), offline or degraded mode, and errors—MUST
be communicated with an explicit non-color-only cue (text, icon+text, or
equivalent), never by color alone.
Successful and failed durable saves for core workflows MUST be observable to
the user; consequential and destructive actions MUST remain confirmable
(aligned with Principle VII).
The UI MUST use progressive disclosure: surface essential decisions and
blocking conflicts first; reveal advanced detail on demand without hiding
required warnings or errors.
Core surfaces MUST share coherent navigation and status patterns so the
product remains learnable; specific visual themes and component libraries are
feature-level choices, not constitutional mandates.
Native desktop conventions MUST be respected: system tray and global shortcuts
where provided by the OS, practical default window sizing for lead workflows,
and non-blocking behavior when optional OS integrations fail.
```

### Replace Desktop UX quality gate row with

```markdown
| Desktop UX | Keyboard path exists for primary capture, navigation, and core planning/review entry; offline/degraded, conflict, unknown, and error states use non-color-only cues when applicable; durable save success/failure is observable in core flows. |
```

### Version footer

```markdown
**Version**: 1.1.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
```

## What stays out of the constitution

- Graphite/light themes, font families, spacing scales, radii  
- Command palette UX details, specific nav IA labels  
- MUI/Tailwind/other framework choices  

## Impact on in-flight work

- **001 / 002**: Already mostly aligned; gate clarification may require documenting save status (autosave already exists).  
- **003**: Soft-gate and conflicted states must remain text-visible under amended X; incomplete UI field surface is a **003 remediation / 004 presentation** split (see feature 004).  
- **004 (proposed)**: Implementation MUST NOT start until this amendment is applied (or explicitly deferred with written exception).

## Approval

- [x] Approve as written  
- [ ] Approve with edits: ________________  
- [ ] Reject / revise  

**Next (on approval)**:
1. Apply via `/speckit-constitution` (or equivalent reviewable edit) → constitution **1.1.0**.
2. Create/switch `feature/004-lead-command-ux` and set `.specify/feature.json` → `specs/004-lead-command-ux`.
3. Proceed with `/speckit-implement` against drafted `specs/004-lead-command-ux/` (spec/plan/tasks already prepared for review).

**Do not** modify `.specify/memory/constitution.md` until this proposal is approved.
