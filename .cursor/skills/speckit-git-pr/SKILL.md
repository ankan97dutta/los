---
name: "speckit-git-pr"
description: >-
  Create a GitHub pull request for the current Spec Kit feature branch using gh.
  Use when the user asks to open a PR, create a pull request, or publish a feature
  branch for review after Spec Kit specify/plan/tasks/implement work.
---

# Create Pull Request

Use the `gh` command via the Shell tool for ALL GitHub-related tasks including working with issues, pull requests, checks, and releases. If given a Github URL use the `gh` command to get the information needed.

Only create a PR when the user asks. If unclear, ask first.

## Workflow

When the user asks you to create a pull request, follow these steps carefully:

1. ALWAYS run the following shell commands in parallel using the Shell tool, in order to understand the current state of the branch since it diverged from the main branch:
   - Run a git status command to see all untracked files
   - Run a git diff command to see both staged and unstaged changes that will be committed
   - Check if the current branch tracks a remote branch and is up to date with the remote, so you know if you need to push to the remote
   - Run a git log command and `git diff [base-branch]...HEAD` to understand the full commit history for the current branch (from the time it diverged from the base branch)
2. Analyze all changes that will be included in the pull request, making sure to look at all relevant commits (NOT just the latest commit, but ALL commits that will be included in the pull request!!!), and draft a pull request summary
3. Run the following commands sequentially:
   - Create new branch if needed (prefer Spec Kit feature branches via `/speckit-git-feature` / `before_specify` hook)
   - Commit outstanding work first if needed via `/speckit-git-commit` (or ask the user)
   - Push to remote with -u flag if needed
   - Create PR using `gh pr create` with the format below. Use a HEREDOC to pass the body to ensure correct formatting.

```bash
git push -u origin HEAD

gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points>

## Test plan
[Checklist of TODOs for testing the pull request...]

EOF
)"
```

## Notes

- NEVER update the git config
- NEVER run force push to main/master; warn the user if they request it
- DO NOT use the TodoWrite or Task tools
- Prefer Conventional Commits style in the PR title when it fits (e.g. `feat: add user auth`)
- Return the PR URL when you're done, so the user can see it
