# Feature Specification: Fortnightly Capacity and Commitment Planning

**Feature Branch**: `feature/003-fortnight-capacity`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: Fortnightly capacity and commitment planning for an engineering lead—team capacity, work demand, allocation, conflict warnings, review/history—local-first on the existing LOS foundation (001/002), without Jira/LLM/cloud requirements.

**Baselines**: Constitution; `specs/001-foundation-workspace/`; `specs/002-harden-foundation/` (durable SQLite). Do not weaken offline, integrity, or modularity constraints. Reuse Applications and fortnight period identity; do not replace Personal Actions or Inbox.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set team capacity for a fortnight (Priority: P1)

An engineering lead opens the current fortnight planning period and configures who is on the team for that period, how many working hours each person has, planned leave, hours already reserved for existing commitments, and a reserved buffer for unplanned work. They see a clear breakdown of gross available time, deductions, and net capacity, and can edit any assumption.

**Why this priority**: Without believable capacity, commitment planning is guesswork. This is the foundation for every later story.

**Independent Test**: With only capacity data (no work items), the lead can save a period’s team roster and capacity inputs and, after quit/relaunch, see the same net capacity and editable breakdown.

**Acceptance Scenarios**:

1. **Given** a fortnight period with no capacity configured, **When** the lead adds team members and sets available hours, leave, reserved commitments, and unplanned buffer, **Then** the product shows gross hours, each deduction, and net capacity, and persists them for that period.
2. **Given** saved capacity for a period, **When** the lead changes leave or buffer and saves, **Then** net capacity recalculates immediately and the new values survive relaunch.
3. **Given** a team member with zero or negative net capacity after deductions, **When** the lead views the summary, **Then** the product shows that person’s overload/zero state without inventing capacity.

---

### User Story 2 - Capture and refine work demand (Priority: P1)

The lead maintains a list of candidate work for the period: priority, estimated effort, target application/project, dependencies, and status (including blocked, unestimated, or waiting on another team/vendor). Estimates are distinct from actual effort; unknown effort is distinct from zero.

**Why this priority**: Capacity without demand cannot produce a plan; demand modeling is required for MVP commitment selection.

**Independent Test**: Create several candidate items with mixed estimate/unknown/blocked states; reopen the period and confirm fields and distinctions are preserved.

**Acceptance Scenarios**:

1. **Given** an empty demand list for a period, **When** the lead adds candidate work with priority, estimate (or unknown), target application, and optional dependency notes, **Then** the item appears in the demand list and persists.
2. **Given** an item marked unestimated, **When** the lead views capacity impact, **Then** the product does not treat unknown effort as zero hours and does not silently auto-commit that item.
3. **Given** an item marked blocked or dependent on another team/vendor, **When** the lead selects commitments, **Then** the product warns that the item is not ready to promise without an explicit lead acknowledgment.
4. **Given** an item with an estimate and later an actual effort value, **When** both are present, **Then** both remain visible and are not overwritten by each other.

---

### User Story 3 - Build a commitment plan with visible load (Priority: P1)

The lead allocates candidate work to team members (or leaves it unallocated), marks intended commitments versus stretch goals, and sees available capacity, planned load, remaining capacity, overloads, and unallocated work. The product warns about capacity and dependency conflicts; it does not silently resolve them or auto-promise work.

**Why this priority**: This is the core value—deciding what the team can commit to with eyes open.

**Independent Test**: With capacity and demand set, allocate items until one person is overloaded; confirm warnings appear, commit requires explicit confirmation, and stretch items are labeled separately.

**Acceptance Scenarios**:

1. **Given** capacity and demand for a period, **When** the lead allocates work to members and selects commitments, **Then** the plan shows per-person load vs capacity, remaining capacity, and unallocated items.
2. **Given** planned load exceeding a member’s net capacity, **When** the lead tries to mark those allocations as commitments, **Then** the product shows a capacity conflict warning and does not silently accept the overload as healthy.
3. **Given** a dependency or blocked item, **When** it is included as a commitment, **Then** the product requires an explicit acknowledgment of the risk (not a silent accept).
4. **Given** stretch goals distinct from commitments, **When** the lead reviews the plan, **Then** stretch items are visually and persistently distinguished from committed work.
5. **Given** an overloaded or conflicted plan, **When** the lead documents a trade-off note, **Then** the note is saved with the period and remains readable later.

---

### User Story 4 - Close the period and keep honest history (Priority: P2)

When a fortnight ends (or the lead closes the plan), completed and incomplete commitments remain visible for that period. The lead records carryover, outcome summary, and reasons for material changes. Historical plans stay readable even if work items later change status.

**Why this priority**: Learning and accountability depend on history; MVP can ship commitment planning first, then closing/review.

**Independent Test**: Close a period with mixed done/incomplete commitments; change a work item’s live status afterward; reopen history and still see the period’s commitment snapshot and outcomes.

**Acceptance Scenarios**:

1. **Given** a period with committed items some done and some not, **When** the lead closes the period with outcome and carryover notes, **Then** history shows what was committed, what finished, and carryover intent.
2. **Given** a closed period, **When** a work item’s current status later changes, **Then** the historical plan still shows the commitment state as recorded for that period (no silent rewrite of history).
3. **Given** a material change during the period (scope drop or swap), **When** the lead records a reason, **Then** that reason is available in the period review.

---

### User Story 5 - Offline, durable, optional integrations (Priority: P2)

All capacity and planning workflows work offline on the durable local workspace. No Jira, LLM, or cloud account is required. Optional future Jira import must not block or corrupt local plans if absent or failing.

**Why this priority**: Constitution baseline; must not regress 001/002.

**Independent Test**: Airplane mode: edit capacity and commitments, quit, relaunch, data present. Confirm no mandatory external dependency in the flow.

**Acceptance Scenarios**:

1. **Given** offline operation, **When** the lead edits capacity and commitments and relaunches, **Then** all planning data for the period is still present.
2. **Given** no Jira or LLM configured, **When** the lead uses capacity planning, **Then** the workflow completes without prompts requiring those systems.

---

### Edge Cases

- Team member removed mid-period while still allocated work: allocations become unassigned with a clear warning; history retains the prior assignment label if the period was already closed.
- All members on leave (net capacity zero): plan allows viewing demand but warns that no capacity remains for new commitments.
- Unknown estimate included in load totals: unknown hours are excluded from numeric load totals and counted separately as “unestimated items,” never coerced to zero.
- Circular or mutual dependencies called out in notes: product warns on commit; does not auto-order or auto-resolve.
- Period with no Applications renamed yet: candidate work may still target an application slot by current name; renaming applications updates display without deleting planning links.
- Concurrent edit: single-writer assumption from 002; fail safe rather than corrupt.
- Closing an already-closed period: idempotent; does not wipe outcome notes.
- Stretch-only period (no commitments): allowed; summary shows zero committed load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-C01**: LOS MUST allow the lead to create and edit capacity configuration for a dated fortnight planning period aligned with the workspace fortnight calendar (same period start/end rules as existing fortnight planning).
- **FR-C02**: LOS MUST support a local team roster for a period (members with display names) without requiring user accounts or multi-user login.
- **FR-C03**: For each member in a period, LOS MUST capture available working time, planned leave, hours reserved for existing commitments, and reserved unplanned-work buffer, and MUST show an explainable calculation of net capacity (gross minus deductions).
- **FR-C04**: Capacity calculations MUST be deterministic given the same inputs; LOS MUST show the formula inputs used (not a black-box number).
- **FR-C05**: LOS MUST allow candidate work items for a period with at least: title/description, priority, estimated effort (or explicitly unknown), optional actual effort, target application (one of the workspace applications or unassigned), status including ready / blocked / waiting-external / done / dropped, and dependency notes.
- **FR-C06**: LOS MUST distinguish unknown estimate from zero estimate; unknown MUST NOT be treated as zero in load totals.
- **FR-C07**: LOS MUST distinguish estimated effort from actual effort when both are recorded.
- **FR-C08**: LOS MUST allow allocating candidate work to a team member or leaving it unallocated, and selecting items as commitment vs stretch for the period.
- **FR-C09**: LOS MUST display for a period: total and per-member net capacity, planned committed load, remaining capacity, overload indicators, unallocated work, and unestimated-item counts.
- **FR-C10**: LOS MUST warn on capacity overload and on committing blocked/waiting-external/unestimated items; LOS MUST NOT silently resolve conflicts or auto-promise work without explicit lead action.
- **FR-C11**: LOS MUST allow documenting trade-off notes for a period when the lead accepts risk or changes scope.
- **FR-C12**: When a period is closed, LOS MUST preserve a readable historical view of commitments (including incomplete ones), carryover notes, and outcome summary; later status changes to live work MUST NOT erase that historical view.
- **FR-C13**: All capacity and planning data MUST persist in the durable local workspace (same relaunch durability expectations as foundation hardening) and MUST remain usable offline.
- **FR-C14**: Capacity planning MUST NOT require Jira, Confluence, an LLM, an account, or a cloud backend.
- **FR-C15**: LOS MUST reuse existing Application slots as the project/application targets for candidate work and MUST NOT introduce a parallel application catalog.
- **FR-C16**: Personal Actions, Inbox, Daily Review, and existing fortnight personal selections remain available; capacity planning MUST NOT remove or break those workflows.
- **FR-C17**: Invalid inputs (empty member name, negative hours where not allowed, missing period) MUST be rejected with clear errors; LOS MUST NOT silently discard planning data after a successful save acknowledgment.
- **FR-C18**: Primary capacity and planning workflows MUST be keyboard-operable for create/edit/save of members, work items, and allocations.

### Key Entities

- **Planning Period**: A dated fortnight window (period start/end) used for capacity and commitments; shares calendar identity with existing fortnight planning.
- **Team Member (period roster)**: A named person included in a period’s capacity model (local roster, not an account).
- **Member Capacity Inputs**: Available hours, leave hours, reserved commitment hours, unplanned buffer; derived net capacity.
- **Candidate Work Item**: Demand unit for the period (priority, estimate/unknown, actual, application target, status, dependencies).
- **Allocation**: Assignment of a work item to a member (or unallocated) within a period.
- **Commitment Selection**: Whether an allocated (or listed) item is a commitment, stretch, or neither for the period.
- **Period Review Record**: Close-out outcome, carryover, and material-change reasons; historical commitment snapshot readability.
- **Application** (existing): Target project for candidate work (four slots).
- **Personal Action** (existing): Lead-owned actions; may be optionally linked from candidate work later but is not the team capacity unit of demand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-C01**: Given fixed sample inputs, net capacity and load totals match the documented deterministic rules in 100% of automated calculation cases (including unknown ≠ zero).
- **SC-C02**: After configuring capacity and commitments offline, quit and relaunch shows the same period data in 100% of verification trials (minimum 3).
- **SC-C03**: In scripted overload scenarios, a capacity warning is shown before the lead can treat the overloaded set as a clean commitment, in 100% of cases.
- **SC-C04**: After closing a period, reopening history shows committed items that were incomplete at close, even if those items are later marked done in the live list, in 100% of scripted cases.
- **SC-C05**: A lead can complete a first-pass capacity + commitment plan for a fortnight (roster, ≥3 work items, allocations, commit selection) in under 15 minutes in a timed dry-run.
- **SC-C06**: Keyboard-only path can add a member, add a work item, allocate it, and save without requiring a pointer, for the primary planning screen.
- **SC-C07**: No Jira, Confluence, or LLM dependency is required to complete any acceptance scenario for this feature.

## Assumptions

- Single local lead user models a team roster; this is not multi-user auth or shared editing.
- Effort and capacity are measured in **hours** (non-negative numbers; whole or half hours allowed in implementation). Story points are out of scope for this feature.
- Fortnight boundaries reuse the existing workspace fortnight start weekday setting and 14-day window.
- Candidate work for capacity planning is a **period-scoped planning entity**, not a replacement for Personal Actions or Inbox items. Optional linking to a Personal Action may be added later; not required for MVP.
- “Existing commitments” deducted from capacity are a numeric reserved-hours input for the period (not an automatic import from external calendars in this feature).
- Closing a period is an explicit lead action (not solely calendar time passing), so history is intentional.
- Jira/vendor sync remains out of scope; dependency on another team is captured as status + notes only.
- Soft maximum team size is left unbounded in product rules but expected to stay small (typical lead team); no enterprise resource-management features (skills matrices, Gantt, financial costing).
- Stretch goals never count toward “committed load” totals; they may be shown separately against remaining capacity as informational only.
- Constitution and 001/002 baselines remain in force; migrations must be versioned; no silent data loss.

## Out of Scope

- Full project portfolio / multi-team resource management
- Automatic scheduling or auto-balancing of work across people
- Required Jira/Confluence/LLM integration
- Payroll, billing, or HR systems of record
- Real-time multi-user collaboration
- Replacing Personal Actions, Inbox, or Daily Review
