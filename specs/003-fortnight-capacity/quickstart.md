# Quickstart Validation: Fortnight Capacity Planning

**Feature**: `003-fortnight-capacity`  
**Purpose**: Validate after implementation (not a substitute for `tasks.md`).  
**Contracts**: [planning-api.md](./contracts/planning-api.md) · **Model**: [data-model.md](./data-model.md)

## Prerequisites

- Branch `feature/003-fortnight-capacity`
- 002 SQLite durable path working (`pnpm tauri:dev`)
- Read [spec.md](./spec.md)

## Setup

```bash
export PATH="$HOME/.local/bin:$PATH:$HOME/.cargo/bin"
pnpm install
pnpm lint
pnpm test
pnpm --filter @los/desktop tauri:dev
```

## Automated

```bash
pnpm --filter @los/domain test          # capacity/load; unknown≠zero; assignee rule
pnpm --filter @los/persistence test     # migrate + round-trip planning tables
pnpm --filter @los/app-services test    # soft-gate warnings; close snapshot; carry-forward
```

Expected: SC-C01 calculation cases green; SC-C03 soft gate keeps `planConflicted`; SC-C04 snapshot immutable; SC-C08 carry-forward + auto next period.

## Manual / recorded (verification-evidence.md)

1. **Capacity** — Add 2 members; set hours/leave/buffer; confirm net breakdown.
2. **Demand** — Add ≥3 items including one unknown estimate and one blocked.
3. **Plan** — Allocate; mark commitments + one stretch; UI confirms before conflicted allocate; verify `planConflicted` remains after ack.
4. **Assignee rule** — Try commitment while unallocated → rejected; stretch while unallocated OK.
5. **Relaunch (SC-C02)** — Quit/relaunch ×3; data intact.
6. **Close + history (SC-C04)** — Close with `acceptWarnings` if still conflicted; attempt structural edit → rejected; edit outcome notes OK; mark a live item done; history still shows prior incomplete commitment.
7. **Carry-forward (SC-C08)** — Close with subset of commitments whose status is not done/dropped; confirm copies in next period; closed snapshot unchanged. Repeat once with no next period pre-created (auto-create). Done/dropped must not be offered or must error if forced.
8. **Keyboard (SC-C06)** — Tab/Enter path for member + work + allocate + save.
9. **Offline / scope (SC-C07)** — Airplane mode; no Jira/LLM required.
10. **Backup/restore (C1)** — After capacity data exists, run backup then restore smoke (002 path); planning tables intact.

## Evidence rule

Do not mark tasks complete without a recorded command or smoke row.
