---
name: simple-release-action
description: Operate simple-release-action release automation that is already set up in a GitHub repository — find and squash-merge the release pull request, reshape the pending release with `!simple-release` pull request comments, run manual releases and snapshots with the GitHub CLI, release fixes from maintenance branches, and diagnose why a release did not happen.
license: MIT
compatibility:
  - Claude Code
  - Codex
  - Cursor
  - Gemini CLI
  - GitHub Copilot
  - Windsurf
  - Cline
  - Roo Code
  - Goose
  - Continue
  - OpenCode
  - Amp
  - universal
metadata:
  author: dangreen
  tags:
    - simple-release
    - release-automation
    - conventional-commits
    - github-actions
    - github-cli
    - changelog
    - monorepo
---

# Simple Release Action

Use this skill when the user wants to ship a release, change what the pending release will be, publish a snapshot, release a fix for a previous major, or find out why a release did not happen — in a repository where [simple-release-action](https://github.com/TrigenSoftware/simple-release-action) is already set up. Setting the automation up from scratch is the job of the `setup-simple-release-action` skill.

The flow everything below builds on:

1. A push to the main branch (or to a maintenance branch, when configured) runs the **pull request** flow: the action computes the next version from the Conventional Commits since the last release tag, recreates the release branch (`simple-release` by default) with the version bump and changelog, and creates or updates the **release pull request** — titled `chore(release): X.Y.Z`, or `chore(release): monorepo release` in independent monorepos.
2. Squash-merging that pull request puts the `chore(release): ...` commit on the branch head. The push of that commit runs the **release** flow: tags, publishing, the GitHub release, and maintenance branches when enabled.
3. A comment on the release pull request that starts with a `!simple-release/...` command re-runs the pull request flow with extra options.

Documentation: <https://simple-release.js.org/github-action/>

## Read the Setup First

Do not assume which flows exist — read them from the repository:

```bash
cat .simple-release.json
grep -l simple-release-action .github/workflows/*.yml
gh repo view --json nameWithOwner,defaultBranchRef -q '"\(.nameWithOwner) \(.defaultBranchRef.name)"'
```

The config may also be `.simple-release.js`, `.mjs`, or `.cjs`. From it note the project addon and, for monorepos, the `mode` (`fixed` or `independent`), plus `maintenanceBranch.enabled`, `publish.skip`, and `bump.extraScopes`.

From the release workflow — usually `.github/workflows/release.yml` — note:

- `on.push.branches`: the flow runs only for pushes to these branches.
- A `workflow_dispatch` trigger with `version`, `as`, `prerelease` (and `by-project`) inputs forwarded to the `bump-*` action inputs: the **manual release** add-on.
- A `branch` input on the action steps: the release branch name. It defaults to `simple-release`; the `gh pr list --head` commands below use it.
- A job running `workflow: snapshot` — a separate `.github/workflows/snapshot.yml`, or a `snapshot` job in `release.yml` guarded by a `snapshot` dispatch input: the **snapshot** add-on.
- How the release job publishes: `npm-token` and `registry-url` mean the token flow; `id-token: write` in the job permissions and no token mean [trusted publishing](https://simple-release.js.org/github-action/trusted-publishing/), where the trusted publisher on npmjs.com is bound to the workflow file — that is why the snapshot job then usually sits in `release.yml`. Node.js GitHub Action projects publish built git refs instead (the `latest` and `v{major}` branches and the `v{version}` tag), and projects with `publish.skip` only tag and create the GitHub release.

A single job running `workflow: full` (the default) behaves like the three-job layout with `check`, `pull-request`, and `release` — the action picks the flow from the event, so everything below applies to both.

When the user asks for a flow that is not set up, say so and offer the `setup-simple-release-action` skill. Do not improvise: `gh workflow run` rejects unknown inputs and workflows without a `workflow_dispatch` trigger.

## Guardrails

- Merging the release pull request is the release. It is one click for the user, so it is not part of any flow below: merge only when the user explicitly asked to release or to merge the release pull request. The same goes for dispatching a workflow that publishes — do it when asked, show the exact command otherwise.
- Never push to the release branch by hand — the pull request flow deletes and recreates it on every run, so manual edits are lost. Reshape the release with comments or dispatch inputs instead.
- Always squash-merge release pull requests. A merge commit hides the `chore(release): ...` title and the release does not run.
- Never use `latest` or `release-N.x` as a snapshot tag: a snapshot is published under the dist-tag it is given and would take over real releases.

## The Regular Release

Nothing needs to be run. Pushing or merging releasable commits into the main branch creates or updates the release pull request. Which commit types and scopes release what is the domain of the `conventional-commit-message` skill from conventional-changelog — use it to write the commits, and suggest installing it when it is missing: `npx skills add conventional-changelog/conventional-changelog --skill conventional-commit-message`.

Find the pull request and the run that produced it:

```bash
gh pr list --head simple-release
gh pr view <number>
gh run list --workflow release.yml --limit 5
gh run view <run-id> --log-failed
```

The pull request body is the changelog preview followed by a cheatsheet of the comment commands. Every comment on any issue or pull request also triggers a run in which the `check` job stops early and the other jobs are skipped — expected noise in the run list.

Stop here by default: report the pull request and its proposed version, and leave the merge to the user — squash-merging it in the GitHub UI is the release. Merge from the CLI only when the user explicitly asked to release or to merge the release pull request:

```bash
gh pr view <number> --json title -q .title
gh pr merge <number> --squash --subject "$(gh pr view <number> --json title -q .title)"
gh run list --workflow release.yml --event push --limit 1
gh run watch <run-id>
```

Passing the title as the squash subject keeps the `chore(release): ...` commit title whatever the repository's squash-merge defaults are. Once the release run has finished — whoever merged — verify the result:

```bash
gh release view vX.Y.Z
npm view <package> dist-tags
```

In independent monorepos the tags and GitHub releases are per package: `pkg-name@X.Y.Z`.

### How the version is decided

- No release tags yet: the manifest version is released as is and the changelog covers the whole history.
- Otherwise the bump is derived from the commits since the last release tag. No releasable commits — no pull request; the pull request job logs "No version changes detected".
- Fixed monorepo: only packages with changes are bumped, all to the same shared version. `bump.force: true` in the config bumps every package on every release (strict lockstep).
- Independent monorepo: each package is bumped from its own `pkg-name@X.Y.Z` tag; packages without matching commits are left out of the release.
- Forcing a release type when nothing releasable happened (a dispatch with `as`, or a `set-options` comment) produces a changelog section saying "Version bump without any changes."

## Reshape the Pending Release with Comments

Two commands are recognized in comments on the open release pull request. Rules shared by both:

- The command must be the very first thing in the comment body — no text or whitespace before it.
- Only comments by the repository owner, organization members, and collaborators are honored; other authors, bots included, are ignored silently.
- Posting or deleting a comment re-runs the pull request flow and regenerates the pull request. Editing a comment does not trigger a run — the workflow listens to `created` and `deleted` only — so post a new comment instead; the newest valid one wins.
- The options belong to the pull request: every regeneration until the merge re-applies them, including regenerations caused by further pushes to the main branch. The next release pull request starts clean.
- Comments shape the pull request only. The release job runs on the merged commit and does not read comments, so `publish` options in a comment have no effect — they belong in the config or the workflow. Prereleases get their identifier as the npm dist-tag automatically.

Post from the CLI with the body on standard input, so the fenced block survives shell quoting:

````bash
gh pr comment <number> --body-file - <<'EOF'
!simple-release/set-options

```json
{
  "bump": {
    "as": "major"
  }
}
```
EOF
````

Undo by deleting the comment: `gh pr comment <number> --delete-last --yes` removes the current user's last comment, and any command comment can be found and deleted by id:

```bash
gh api repos/{owner}/{repo}/issues/<number>/comments --jq '.[] | select(.body | startswith("!simple-release/")) | "\(.id)\t\(.author_association)\t\(.body | split("\n")[0])"'
gh api -X DELETE repos/{owner}/{repo}/issues/comments/<comment-id>
```

### `!simple-release/set-options`

The command line, then a fenced `json` block with releaser step options — the same sections as the config file, merged over it key by key. The JSON must be valid and inside a `json` fence, otherwise the comment is skipped and the previous valid one applies. The options that shape a pull request live under `bump`:

| Option | Effect |
| --- | --- |
| `version` | Exact version, e.g. `"3.0.0"`. Overrides everything else. |
| `as` | Release type: `major`, `minor`, `patch`, or `prerelease`. The last one keeps the type derived from the commits (a patch when there are none) and makes the version a prerelease. |
| `prerelease` | Pre-release identifier, e.g. `"alpha"`. |
| `byProject` | Per-package options in monorepos, keyed by full package name: `version`, `as`, `prerelease`, `firstRelease`, `skip`, `preamble`. |
| `firstRelease` | Release the current manifest version as is, as if no release existed yet. |
| `extraScopes` | Extra commit scopes counted for every package in a monorepo, e.g. `["deps"]`. Better set permanently in the config. |
| `force` | Fixed monorepos: bump every package, not only the changed ones. |

Recipes for a pull request that proposes `1.2.0` on top of the released `1.1.0`:

| Comment JSON | Result |
| --- | --- |
| `{"bump": {"as": "major"}}` | `2.0.0` |
| `{"bump": {"version": "3.0.0"}}` | `3.0.0` |
| `{"bump": {"prerelease": "alpha"}}` | `1.2.0-alpha.0` — the release type still comes from the commits |
| `{"bump": {"as": "major", "prerelease": "alpha"}}` | `2.0.0-alpha.0` |
| `{"bump": {"as": "prerelease", "prerelease": "alpha"}}` | `1.2.0-alpha.0` — like the identifier alone, but released even without new commits (`1.1.1-alpha.0` then) |
| `{"bump": {"byProject": {"@org/pkg-a": {"as": "minor"}, "@org/pkg-b": {"skip": true}}}}` | Independent monorepo: `pkg-a` gets a minor, `pkg-b` is held back, the rest follow their commits |

Prerelease lines: once `1.2.0-alpha.0` is released, the next pull request is computed from the commits after that tag. With `prerelease: "alpha"` again it becomes `1.2.0-alpha.1`, without it `1.2.0` (graduation), with `prerelease: "beta"` `1.2.0-beta.0`, and a breaking change moves it to `2.0.0-alpha.0`. To graduate when no releasable commits landed since the last prerelease, force the type: `{"bump": {"as": "patch"}}` gives `1.2.0`.

Older action versions produced no pull request for `as: "prerelease"` with an identifier on a stable version. If that happens, start the line with the identifier alone or with `as` set to `major`, `minor`, or `patch`.

### `!simple-release/set-preamble`

The command line, then markdown. Everything after the first line becomes the changelog preamble: it is inserted right after the version header, before the generated sections, and ends up in the GitHub release notes too. Handy for a highlights summary or upgrade notes. Start its headings at `###` — the version header is `##` and the generated sections are `###` (`### Features`, `### Bug Fixes`), so the preamble reads as one of them; use `####` for subsections:

````md
!simple-release/set-preamble

### ✨ Highlights

#### Self-closing tags in rich text

`rich` now understands self-closing tags like `<br/>` — handy for line breaks in translations:

```tsx
rich({ br: () => '\n' })
```
````

In a monorepo the plain command applies to every package's changelog. Pass the full package name after the command to target one package — wrap it in backticks so GitHub keeps it as text instead of a mention:

```md
!simple-release/set-preamble `@org/core`

### ✨ Highlights

- New plugin system
```

The newest comment per target wins — one without a name for the whole release plus one per package, and a per-package preamble overrides the global one for that package. A comment with nothing after the command line is ignored. Deleting the comment drops the preamble on the next run.

## Manual Release from the CLI

Requires the `workflow_dispatch` inputs in the release workflow. A dispatch produces or updates the release pull request with the forced bump — nothing is released until that pull request is squash-merged.

```bash
gh workflow run release.yml -f as=minor
gh workflow run release.yml -f version=3.0.0
gh workflow run release.yml -f as=minor -f prerelease=beta
gh workflow run release.yml -f by-project='{"@org/pkg-a": {"as": "minor"}, "@org/pkg-b": {"skip": true}}'
gh workflow run release.yml --ref v1 -f as=patch
gh run list --workflow release.yml --event workflow_dispatch --limit 1
gh run watch <run-id>
```

| Input | Effect |
| --- | --- |
| `version` | Exact version. Overrides everything else. |
| `as` | Release type: `major`, `minor`, `patch`, or `prerelease`. The last one keeps the type derived from the commits (a patch when there are none) and makes the version a prerelease. |
| `prerelease` | Pre-release identifier — `as=minor` with `prerelease=beta` on `1.0.0` gives `1.1.0-beta.0`. |
| `by-project` | JSON keyed by full package names with per-package `version`, `as`, `prerelease`, and `skip`. |

Notes:

- The inputs apply to the dispatched run only, while comments on the pull request are re-applied on every run — when both set the same option, the comment wins.
- With no releasable commits since the last release, `as` produces a "Version bump without any changes." release — the way to cut a version on a schedule.
- A dispatch with no inputs just re-runs the pull request flow for the branch head — a way to regenerate the pull request after a config change without pushing anything.
- `--ref` picks the branch: the default branch when omitted, a maintenance branch such as `v1` to force a release there.
- The same caveat as for comments: older action versions produced nothing for `as=prerelease` with an identifier on a stable version — use `as=minor` (or `patch`, `major`) with the identifier there.

## Snapshot from Any Branch

Requires the snapshot add-on. A snapshot publishes the current state of a branch as a timestamped prerelease under its own npm dist-tag — nothing is committed, tagged, or written to the changelog. Not applicable to projects that publish nothing (Node.js GitHub Action projects, `publish.skip`).

```bash
git push -u origin my-feature
gh workflow run snapshot.yml --ref my-feature -f tag=canary
gh run list --workflow snapshot.yml --limit 1
gh run watch <run-id>
npm view <package> dist-tags
```

When the snapshot job lives in `release.yml` (the trusted publishing layout), dispatch that workflow with its `snapshot` input instead — the `check` job and the release flow are skipped for such a run:

```bash
gh workflow run release.yml --ref my-feature -f snapshot=canary
gh run list --workflow release.yml --event workflow_dispatch --limit 1
```

The branch must exist on the remote — `--ref` names the branch to check out and to take the workflow file from. The `tag` input is both the prerelease identifier and the dist-tag: a repository released as `1.1.0` with a `feat` on the branch publishes `1.2.0-canary.20260707111020`, installable with `npm i <package>@canary`. Without new commits the version falls back to a patch bump, so a snapshot never collides with a real release. In a monorepo every package is snapshotted in one run, each from its own version.

## Maintenance Branches

Applies when the config has `maintenanceBranch.enabled: true` and the release workflow's push trigger includes the maintenance pattern — `'v*'` for single packages and fixed monorepos, `'*@*'` for independent monorepos.

- When a release crosses a major boundary, the release job creates the branch for the previous major from its last release tag: `v1` from `v1.1.0`; in independent monorepos `pkg-name@1` from `pkg-name@1.1.0`, only for packages that crossed a major. An existing branch is never overwritten. List them with `gh api repos/{owner}/{repo}/branches --paginate --jq '.[].name'`.
- Releasing a fix for the old major is the same flow on that branch: land a conventional commit on `v1` (a pull request into `v1` squash-merged with a conventional title, or a cherry-pick), get the release pull request targeting `v1`, squash-merge it. The package is published under the `release-1.x` dist-tag, `latest` stays on the newest line, and the GitHub release is not marked as Latest.
- Comments and dispatches work there too: `!simple-release/set-options` on the `v1` release pull request, or `gh workflow run release.yml --ref v1 -f as=patch`.
- The release branch name is shared between the lines (`simple-release` by default) and the action looks the open pull request up by that head branch. Keep at most one release pull request pending at a time — merge the pending one for `main` before pushing a fix to `v1`, and vice versa.
- A maintenance branch created by hand from the release tag works the same way — for when the option was enabled after the major had shipped: `git branch v1 v1.1.0 && git push origin v1`.

## Permanent Changes

Anything that should hold for every release belongs in `.simple-release.json`, not in comments or dispatch inputs — commit it and the next run picks it up:

| Key | Effect |
| --- | --- |
| `bump.extraScopes` | Scopes counted for every package in a monorepo, e.g. `["deps"]` for Renovate and Dependabot commits. |
| `bump.force` | Fixed monorepos: lockstep bumps of every package. |
| `maintenanceBranch.enabled` | Create maintenance branches on major releases. |
| `publish.skip`, `publish.access`, `publish.tag` | Release-time publish options. |
| `pullRequest.draft` | Open new release pull requests as drafts. |
| `releaser.verbose` | Detailed logs — including how comment options were parsed and which publish command ran. Turn it on when diagnosing. |

## Diagnose

Work from evidence: the run list, the job log, the branch head, and the tags.

```bash
gh run list --workflow release.yml --limit 10
gh run view <run-id> --log-failed
git fetch --tags origin && git log -1 --format=%s origin/main
git tag --sort=-v:refname | head
gh release list --limit 5
gh api repos/{owner}/{repo}/actions/permissions/workflow
```

| Symptom | Cause | Fix |
| --- | --- | --- |
| No release pull request after a push | Only hidden commit types, or in a monorepo a scope that is not the package name without the npm scope (`fix(core): ...` for `@org/core`) — the log says "No version changes detected" | Land a releasable commit, fix the scope, or force a type with a dispatch |
| | "GitHub Actions is not permitted to create or approve pull requests" | `gh api -X PUT repos/{owner}/{repo}/actions/permissions/workflow -F can_approve_pull_request_reviews=true` (Settings → Actions → General) |
| | The push went to a branch not listed in `on.push.branches` | Merge into the main branch, or add the branch (maintenance add-on) |
| Pull request merged, no release | The head commit is not `chore(release): ...` — merged with a merge commit | Push an empty commit with the release title: `git commit --allow-empty -m "chore(release): X.Y.Z" && git push`. The check sees a release commit whose tag does not exist yet and runs the release job. Use `chore(release): monorepo release` for independent monorepos |
| Release job failed halfway | The tag was created, a later step failed. Re-running does nothing by itself — an existing tag means "already released" | Publish failed: delete the GitHub release if it exists (`gh release delete vX.Y.Z --yes --cleanup-tag`) and the tag if it is still there (`git push origin :refs/tags/vX.Y.Z`), then `gh run rerun <run-id> --failed`. Packages published but the GitHub release missing: create it by hand from the changelog section, `gh release create vX.Y.Z --title vX.Y.Z --notes-file notes.md`. Never delete and republish an npm version |
| A comment changed nothing | The run was skipped: the command is not at the very start of the body, or the pull request is not the bot's open release pull request | Post a new comment starting with the command |
| | The run happened but the options were not applied: invalid JSON, no `json` fence, or the author is not an owner, member, or collaborator | Fix and post again; with `releaser.verbose` the log says "Failed to parse parameters comment" for invalid JSON |
| | The comment was edited — edits do not trigger runs | Post a new comment, or delete and re-post |
| `gh workflow run` fails | "Workflow does not have 'workflow_dispatch' trigger", or unexpected inputs | The manual release or snapshot add-on is not set up — offer the setup skill |
| Publish fails with `ENEEDAUTH` or "Unable to authenticate" | Trusted publishing: the workflow filename or repository does not match the trusted publisher registered on npmjs.com, the job lacks `id-token: write`, npm is older than 11.5.1 (Node.js below 24), or the package was never published, so no publisher could be registered. In the token flow: `NPM_TOKEN` missing or expired | Compare the registration with the workflow file name and repository, check the job permissions and Node.js version; publish a brand-new package's first version with a token; rotate the secret in the token flow |
| Prerelease produced no pull request | An older action version: `as: prerelease` with an identifier on a stable version used to yield nothing | Update simple-release-action, or use the identifier alone or with `as` set to `major`, `minor`, or `patch` |
| Renovate or Dependabot commits do not release a monorepo package | The `deps` scope is not a package name | `bump.extraScopes: ["deps"]` in the config |
| Fixed monorepo: unchanged packages kept their version | By design — only changed packages are bumped | `bump.force: true` in the config |

## Report Back

After acting, tell the user what they need to continue: the pull request URL with the proposed version (or the per-package versions), the run URL — `https://github.com/{owner}/{repo}/actions/runs/<run-id>` — and what happens next: "squash-merge to release", "the release run is in progress", "the snapshot is installable as `<package>@canary`". When a run failed, quote the failing step from `gh run view <run-id> --log-failed` instead of guessing.
