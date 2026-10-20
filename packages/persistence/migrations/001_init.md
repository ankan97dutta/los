# Migration 001 — initial schema

Implemented as `LosDbSnapshot` version `1` in `memory_store.ts` / JSON file DB:

- Application (4 seeded slots)
- InboxItem
- PersonalAction
- DailyReview (+ next action lines embedded)
- FortnightPlan (+ selectedActionIds)
- MonthlyReview
- WorkspaceSettings singleton

Future SQL/native SQLite can replace the JSON file while keeping repository ports stable.
