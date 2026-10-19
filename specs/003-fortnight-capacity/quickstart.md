# Quickstart Validation: Fortnight Capacity Planning

**Feature**: `003-fortnight-capacity`  
**Purpose**: Validate after implementation (not a substitute for `tasks.md`).

## Prerequisites

- Branch `feature/003-fortnight-capacity`
- 002 SQLite durable path working (`pnpm tauri:dev`)
- Read [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/planning-api.md](./contracts/planning-api.md)

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
pnpm --filter @los/domain test          # capacity/load pure tests
pnpm --filter @los/persistence test     # migrate + round-trip planning tables
pnpm --filter @los/app-services test    # overload warnings; close snapshot
```

Expected: SC-C01 calculation cases green; unknown ≠ zero; close snapshot immutable to later status changes.

## Manual / recorded (verification-evidence.md)

1. **Capacity** — Add 2 members; set hours/leave/buffer; confirm net breakdown.
2. **Demand** — Add ≥3 items including one unknown estimate and one blocked.
3. **Plan** — Allocate; mark commitments + one stretch; trigger overload warning; accept only with explicit confirm.
4. **Relaunch (SC-C02)** — Quit/relaunch ×3; data intact.
5. **Close (SC-C04)** — Close period; mark a live item done; history still shows prior incomplete commitment.
6. **Keyboard (SC-C06)** — Tab/Enter path for member + work + allocate + save.
7. **Offline / scope (SC-C07)** — Airplane mode; no Jira/LLM required.

## Evidence rule

Do not mark tasks complete without a recorded command or smoke row.
