---
name: "speckit-git-hotfix"
description: >-
  Create a gitflow hotfix branch from the production branch for urgent production
  fixes. Use when the user asks for a hotfix, production fix branch, or
  /speckit-git-hotfix.
---

# Create Hotfix Branch (Gitflow)

Create and switch to a hotfix branch from the configured production branch.

## User Input

```text
$ARGUMENTS
```

Treat non-empty user input as the hotfix description (used to build a short slug). If empty, ask for a brief description.

## Configuration

Read `.specify/extensions/git/git-config.yml`:

- `branching.strategy` — must be `gitflow` (warn and stop if not)
- `branching.production` — base branch (default `main`)
- `branching.development` — develop branch to keep in sync later (default `develop`)
- `branching.prefixes.hotfix` — prefix (default `hotfix`)
- `branching.ensure_base_branches` — if true, create missing `production` / `development` branches from the current default branch

## Prerequisites

- Verify Git: `git rev-parse --is-inside-work-tree`
- Working tree should be clean; if not, offer to run `/speckit-git-commit` or ask the user to stash/commit first

## Workflow

1. Load branching config from `git-config.yml`.
2. If `ensure_base_branches` is true:
   - Ensure `production` exists (create from `HEAD` / default branch if missing).
   - Ensure `development` exists (create from `production` if missing).
3. Fetch remotes when available: `git fetch origin` (ignore failures offline).
4. Check out and update the production branch:
   ```bash
   git checkout <production>
   git pull --ff-only origin <production>   # skip pull if no remote
   ```
5. Generate a short kebab-case slug (2–4 words) from the description.
6. Create and switch to:
   ```text
   <hotfix-prefix>/<slug>
   ```
   Example: `hotfix/fix-login-timeout`
   ```bash
   git checkout -b <hotfix-prefix>/<slug>
   ```
7. Report: branch name, base (`production`), and next steps (fix → commit → `/speckit-git-pr` targeting `production`, then merge back to `development`).

## Notes

- NEVER update the git config
- NEVER force-push to `main`/`master`/`develop`
- Do not merge or open a PR unless the user asks (use `/speckit-git-pr`)
- Hotfixes are for production emergencies; routine work stays on `feature/*` via `/speckit-git-feature`
