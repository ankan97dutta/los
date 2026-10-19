---
name: "speckit-git-branch"
description: >-
  Gitflow branching helpers: ensure main/develop exist, report branch model, or
  create/switch long-lived base branches. Use when the user asks about branching
  strategy, to bootstrap develop, or invokes /speckit-git-branch.
---

# Gitflow Branch Helpers

Lightweight helpers for the project's gitflow model. For feature branches use `/speckit-git-feature`; for hotfixes `/speckit-git-hotfix`; for releases `/speckit-git-release`.

## User Input

```text
$ARGUMENTS
```

Supported intents (infer from args or ask once if unclear):

| Intent | Action |
|--------|--------|
| `status` / empty | Show strategy, bases, prefixes, current branch |
| `ensure` | Create missing `production` / `development` branches |
| `checkout develop` / `checkout main` | Switch to that base (ff-only pull if remote exists) |

## Configuration

Read `.specify/extensions/git/git-config.yml`:

- `branching.strategy` (expect `gitflow`)
- `branching.production` / `branching.development`
- `branching.prefixes` (`feature`, `release`, `hotfix`)
- `branch_prefix` / `branch_numbering` (Spec Kit feature branches)

## Ensure base branches

When `ensure` (or `branching.ensure_base_branches` flows need it):

1. Resolve default branch (`main` / `master` / current).
2. If `production` missing: create it from default and push `-u` when remote exists (ask before first push if remote has divergent history).
3. If `development` missing: create it from `production` and push `-u` when possible.
4. Report created vs already-present branches.

## Status output

Print a short summary:

```text
Strategy: gitflow
Production: main
Development: develop
Prefixes: feature/  release/  hotfix/
Features via Spec Kit: feature/{number}-{slug} (branch_prefix)
Current: <branch>
```

## Notes

- NEVER update the git config
- NEVER force-push to `main` / `master` / `develop`
- Do not create feature/release/hotfix branches here — delegate to the dedicated skills
