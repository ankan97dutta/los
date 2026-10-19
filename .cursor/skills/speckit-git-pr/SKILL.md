---
name: "speckit-git-pr"
description: >-
  Create a GitHub pull request for the current Spec Kit / gitflow branch using gh.
  Use when the user asks to open a PR, create a pull request, or publish a feature,
  release, or hotfix branch for review.
---

# Create Pull Request (Gitflow)

Use the `gh` command via the Shell tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a Github URL use the `gh` command to get the information needed.

Only create a PR when the user asks. If unclear, ask first.

## Configuration

Read `.specify/extensions/git/git-config.yml` `branching` section:

| Current branch | Default PR base |
|----------------|-----------------|
| `feature/*` | `branching.development` (default `develop`) |
| `release/*` | `branching.production` (default `main`) |
| `hotfix/*` | `branching.production` (default `main`) |
| other | ask the user |

After merging a `release/*` or `hotfix/*` PR into production, remind the user to also merge into `development` (second PR or `/speckit-git-release` finish step).

## Workflow

When the user asks you to create a pull request, follow these steps carefully:

1. ALWAYS run the following shell commands in parallel using the Shell tool:
   - `git status`
   - `git diff` and `git diff --staged`
   - Check upstream tracking / need to push
   - `git log` and `git diff <base-branch>...HEAD` for full PR history
2. Resolve `<base-branch>` from the table above (or user override).
3. Analyze ALL commits in the PR range and draft the summary.
4. Sequentially:
   - Commit outstanding work via `/speckit-git-commit` if needed (or ask)
   - Push with `-u` if needed
   - Create the PR:

```bash
git push -u origin HEAD

gh pr create --base "<base-branch>" --title "the pr title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Test plan
[Checklist of TODOs for testing the pull request...]

EOF
)"
```

## Notes

- NEVER update the git config
- NEVER run force push to main/master/develop; warn the user if they request it
- DO NOT use the TodoWrite or Task tools
- Prefer Conventional Commits style in the PR title when it fits (e.g. `feat: add user auth`)
- Return the PR URL when you're done
