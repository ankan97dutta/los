---
name: "speckit-git-release"
description: >-
  Run gitflow release management: create a release branch, bump version, update
  CHANGELOG from Conventional Commits, tag, and publish a GitHub Release. Use when
  the user asks to release, cut a version, bump version, tag, publish a release,
  or invokes /speckit-git-release.
---

# Release Management (Gitflow)

Cut a release from the development branch: version bump, changelog, tag, and GitHub Release.

Only run a release when the user asks. If the bump level is unclear and `release.bump` is not `auto`, ask (`major` | `minor` | `patch`).

## User Input

```text
$ARGUMENTS
```

Accept optional args such as `major`, `minor`, `patch`, or an explicit version (`1.2.0` / `v1.2.0`). Explicit version wins over auto-bump.

## Configuration

Read `.specify/extensions/git/git-config.yml`:

| Key | Purpose | Default |
|-----|---------|---------|
| `release.enabled` | Must be true | — |
| `release.version_file` | `VERSION`, `package.json`, or `pyproject.toml` | `VERSION` |
| `release.changelog` | Changelog path | `CHANGELOG.md` |
| `release.tag_prefix` | Tag prefix | `v` |
| `release.bump` | `auto` \| `major` \| `minor` \| `patch` | `auto` |
| `release.create_github_release` | Create GitHub Release via `gh` | `true` |
| `release.branch_from` | Branch to cut from | `develop` |
| `release.merge_targets` | Branches to merge into after release | `[main, develop]` |
| `branching.production` | Production branch | `main` |
| `branching.development` | Development branch | `develop` |
| `branching.prefixes.release` | Release branch prefix | `release` |
| `branching.ensure_base_branches` | Create missing base branches | `true` |

If `release.enabled` is false, stop and tell the user how to enable it in `git-config.yml`.

## Prerequisites

- Git worktree; clean working tree (offer `/speckit-git-commit` if dirty)
- `gh` available when `create_github_release: true`
- NEVER update the git config; NEVER force-push to protected branches

## Workflow

### 1. Resolve version

1. Read current version from `release.version_file`:
   - `VERSION`: trim file contents
   - `package.json`: `.version`
   - `pyproject.toml`: `project.version` or `tool.poetry.version`
   - Missing `VERSION`: treat current as `0.0.0` and create the file later
2. Find latest semver tag matching `<tag_prefix>*` (e.g. `v1.2.3`).
3. Determine next version:
   - Explicit user version → use it (strip leading `v` for the number; keep tag as `<tag_prefix><version>`)
   - Else if `bump: auto` → inspect `git log <last-tag>..HEAD` (or all commits if no tag):
     - any `BREAKING CHANGE` / `type!:` → **major**
     - any `feat:` / `feat(` → **minor**
     - else → **patch**
   - Else use configured/requested `major` | `minor` | `patch`
4. Set `TAG=<tag_prefix><version>` (e.g. `v1.3.0`) and `RELEASE_BRANCH=<release-prefix>/<TAG>` (e.g. `release/v1.3.0`).

### 2. Cut release branch

1. If `ensure_base_branches`, create missing production/development branches.
2. `git fetch origin` when possible.
3. Check out `branch_from` (usually `develop`) and fast-forward pull when remote exists.
4. Create and switch to `RELEASE_BRANCH`:
   ```bash
   git checkout -b "$RELEASE_BRANCH"
   ```

### 3. Bump version + changelog

1. Write the new version into `version_file`.
2. Update `changelog`:
   - Ensure file exists; use Keep a Changelog style
   - Insert a new section at the top (below any `# Changelog` heading):

     ```markdown
     ## [<version>] - <YYYY-MM-DD>

     ### Added
     - …

     ### Fixed
     - …

     ### Changed
     - …
     ```

   - Populate bullets from Conventional Commits since the last tag (`feat`→Added, `fix`→Fixed, others→Changed). Skip `chore`/`ci`/`style` noise unless meaningful.
3. Commit with Conventional Commits (via message file + `/speckit-git-commit` pattern, or direct commit):
   ```text
   chore(release): bump version to <version>
   ```
   Do **not** use `git commit --amend` unless amend rules from the git safety protocol all apply.

### 4. Tag and GitHub Release

1. Create annotated tag on the release commit:
   ```bash
   git tag -a "$TAG" -m "Release $TAG"
   ```
2. Push branch and tag:
   ```bash
   git push -u origin HEAD
   git push origin "$TAG"
   ```
3. If `create_github_release: true`:
   ```bash
   gh release create "$TAG" --title "$TAG" --notes-file <changelog-section-or-notes-file>
   ```
   Prefer notes derived from the new changelog section. Return the release URL.

### 5. Finish gitflow (only if user asks to merge/finish)

Do **not** merge into production/development unless the user explicitly asks to finish/merge the release.

When asked to finish:

1. Merge `RELEASE_BRANCH` into each `merge_targets` entry with `--no-ff` (or open PRs via `/speckit-git-pr` if the user prefers PR review).
2. Ensure `TAG` remains on the production merge commit (retag only if the user explicitly requests).
3. Delete local/remote release branch only if the user asks.

## Output

Report:

- New version and tag
- Release branch name
- Changelog path updated
- GitHub Release URL (if created)
- Reminder: merge to `main` + `develop` (or say `/speckit-git-pr`) to finish gitflow

## Notes

- NEVER update the git config
- NEVER skip hooks (`--no-verify`) unless the user explicitly asks
- NEVER force-push to `main` / `master` / `develop`
- Use `gh` for all GitHub release operations
