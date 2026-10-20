<!--
Sync Impact Report (temporary — remove before commit if desired)
- Version change: 1.0.0 → 1.1.0 (MINOR: expand Principle X + Desktop UX gate)
- Modified principles: X. Usable Desktop Experience (expanded; title unchanged)
- Modified gates: Desktop UX row (expanded honesty / keyboard / save observability)
- Added sections: none
- Removed sections: none
- Source: .specify/proposals/2026-10-19-constitution-ux-amendment.md (Approve as written)
- Follow-up TODOs: none
-->

# LOS (Lead OS) Constitution

## Core Principles

### I. Local-First and Offline-Capable
Core workflows MUST function without internet connectivity or external services.
Local data is the default source of truth for personal workflow information.
Network-dependent features MAY enhance the experience but MUST NOT block
capture, planning, review, or other core lead workflows when offline.

**Rationale**: Engineering leads need a reliable personal operating system that
works on planes, restricted networks, and during outages.

### II. Deterministic Core
Daily, fortnightly, and monthly planning, prioritization, capacity calculations,
dependency tracking, reviews, and reminders MUST work without an LLM.
AI is optional and MUST NEVER be a runtime requirement for core behavior.
Any AI-assisted feature MUST degrade gracefully to a fully usable non-AI path.

**Rationale**: Predictable planning and prioritization cannot depend on model
availability, latency, or non-deterministic output.

### III. Privacy and User Control
LOS MUST NOT require a mandatory account, cloud backend, or telemetry.
Local data and credentials MUST be protected.
Any external data sharing MUST be explicit, user-initiated or clearly
configurable, and revocable.
Silent background upload of personal workflow data is forbidden.

**Rationale**: Personal notes, reviews, and capacity data are sensitive; the
user retains control over what leaves the machine.

### IV. Integration Isolation
Jira, Confluence, and future integrations MUST be optional adapters.
Integration failures MUST NOT break core workflows or corrupt local data.
Adapters MUST isolate auth, rate limits, schema drift, and partial responses
from domain logic.
Core features MUST remain usable when no integration is configured.

**Rationale**: External systems are unreliable relative to local planning;
failure at the edge must not compromise the product's primary value.

### V. Clear Ownership of Data
Personal actions, reviews, notes, and planning decisions belong to LOS.
Shared delivery issues remain owned by their external source systems when
connected.
LOS MUST avoid becoming a duplicate source of truth for shared delivery state.
Synced entities MUST retain clear provenance (local-owned vs externally-owned).

**Rationale**: Dual ownership creates conflict and drift; boundaries keep local
intent separate from team delivery systems of record.

### VI. Small, Modular Architecture
Domain logic MUST remain independent of UI, persistence implementation,
AI providers, and external integrations.
Prefer simple abstractions over speculative extensibility.
Cross-cutting shortcuts that couple domain rules to adapters or UI frameworks
are forbidden without an explicit architecture decision record.

**Rationale**: Modularity preserves offline determinism, testability, and the
ability to swap or disable optional capabilities.

### VII. Data Integrity and Recoverability
LOS MUST use versioned database migrations, transactional writes where
appropriate, and validated inputs.
Backup and restore workflows MUST be tested.
User data MUST NEVER be silently discarded.
Destructive operations MUST be confirmable and, where feasible, recoverable.

**Rationale**: A personal lead OS is only trustworthy if history and planning
state survive upgrades, crashes, and user error.

### VIII. Testable Behavior
Domain rules, prioritization, date and cycle boundaries, persistence,
integration failure handling, and critical user workflows MUST be covered by
automated tests appropriate to their risk.
Important behavior MUST be verifiable without a live Jira connection or an LLM.
Flaky tests that require live external systems for core assertions are forbidden;
use fakes, fixtures, or contract tests at adapter boundaries.

**Rationale**: Deterministic, offline-first behavior is only enforceable if it
is continuously verified in isolation.

### IX. Incremental, Spec-Driven Delivery
Each feature MUST have an agreed specification, technical plan, ordered tasks,
acceptance criteria, and verification evidence before it is considered complete.
Scope MUST stay small.
Specification inconsistencies MUST be resolved before implementation proceeds.
"Done" without spec, plan, tasks, acceptance criteria, and verification evidence
is not done.

**Rationale**: Spec-driven increments prevent ambiguous delivery and keep the
constitution's constraints visible during build-out.

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

**Rationale**: A lead OS fails if it is slow to capture context, opaque about
connectivity and sync, or unclear about conflicts, unknown values, and save
outcomes.

## Quality Gates

A change MUST NOT be considered complete unless the applicable gates below are
met. Gates are measurable and reviewable in PR or release verification.

| Gate | Requirement |
|------|-------------|
| Offline core | Documented core workflows pass with network disabled (or equivalent simulated offline mode). |
| No LLM required | Core planning/prioritization/capacity/review paths execute successfully with AI providers disabled or absent. |
| Privacy default | No account, cloud backend, or telemetry is required to complete core workflows; new outbound data paths are opt-in and documented. |
| Adapter isolation | Integration adapter tests demonstrate failure/timeout/auth-error cases leave local data intact and core UI usable. |
| Ownership clarity | Features that sync external entities document provenance and do not treat external issue state as solely LOS-owned. |
| Modular boundaries | Domain tests do not import UI frameworks, concrete remote clients, or live AI SDKs. |
| Migration safety | Schema changes ship with versioned migrations; backup/restore smoke test passes for persistence-touching releases. |
| Test evidence | New/changed domain rules include automated tests; critical workflows have verification notes or automated coverage. |
| Spec completeness | Linked spec, plan, tasks, acceptance criteria, and verification evidence exist for the feature increment. |
| Desktop UX | Keyboard path exists for primary capture, navigation, and core planning/review entry; offline/degraded, conflict, unknown, and error states use non-color-only cues when applicable; durable save success/failure is observable in core flows. |

## Spec-Driven Delivery

1. **Specify** — Capture user-facing intent, acceptance criteria, and
   non-goals. Resolve `[NEEDS CLARIFICATION]` items before planning.
2. **Plan** — Record technical approach, module boundaries, data ownership,
   and integration/AI optionality consistent with this constitution.
3. **Tasks** — Produce ordered, verifiable tasks sized for incremental delivery.
4. **Implement** — Execute tasks against the plan; keep constitution gates in
   review checklists.
5. **Verify** — Attach evidence for applicable Quality Gates before calling the
   increment complete.

Scope expansions discovered mid-implementation MUST update the specification
(and plan/tasks as needed) before coding continues on the expanded scope.

## Governance

This constitution is the highest-order engineering governance for LOS.
When project practices, templates, or informal habits conflict with it, the
constitution prevails unless formally amended.

### Amendments
1. Propose the change with rationale, impacted principles/gates, and migration
   notes for in-flight work.
2. Update `.specify/memory/constitution.md` via `/speckit-constitution` (or
   equivalent reviewable edit).
3. Bump **Version** using the semantic-versioning policy below.
4. Set **Last Amended** to the amendment date (ISO `YYYY-MM-DD`).
5. Ensure dependent specs/plans for active features acknowledge material
   governance changes before further implementation.

### Semantic Versioning (Constitution)
- **MAJOR**: Remove or redefine a principle/gate in a backward-incompatible way,
  or weaken a non-negotiable constraint (e.g., allowing mandatory cloud or
  LLM-required core paths).
- **MINOR**: Add a principle/section or materially expand guidance/gates
  without invalidating prior compliance.
- **PATCH**: Clarifications, wording fixes, and non-semantic refinements.

### Compliance Review
- Pull requests and feature reviews MUST check applicable Quality Gates.
- Complexity that couples domain logic to UI, persistence engines, AI, or
  integrations MUST be justified in the plan or an architecture note.
- Exceptions are temporary, written, time-bounded, and MUST include a removal
  plan; unreviewed exceptions are not allowed.

**Version**: 1.1.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
