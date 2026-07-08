---
name: setup-simple-release-action
description: Set up simple-release-action release automation in a GitHub repository — detect the project type and toolchain from the repository, generate the config and release workflows, and add optional manual release, snapshot, and maintenance branch flows.
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
    - changelog
    - monorepo
---

# Setup Simple Release Action

Use this skill when the user asks to set up release automation for a GitHub repository with `simple-release` or [simple-release-action](https://github.com/TrigenSoftware/simple-release-action): on every push to the main branch the action maintains a **release pull request** with the version bump and changelog, and when that pull request is squash-merged it tags the release, publishes the packages, and creates the GitHub release.

The setup produces:

- `.simple-release.json` — the config describing the project.
- `.github/workflows/release.yml` — the release workflow.
- `.github/workflows/snapshot.yml` — only when the snapshot flow is requested.
- A short checklist of repository settings the user must change manually.

Documentation: <https://simple-release.js.org/github-action/>

## Gather Requirements

By default set up only the **main flow** (release pull request → release on merge). There are three optional add-ons:

1. **Manual release** — a `workflow_dispatch` form to force a specific version, release type, or prerelease through the same pull request flow.
2. **Snapshot release** — publish a temporary timestamped prerelease from any branch under its own npm dist-tag, without committing anything.
3. **Maintenance branches** — when a release crosses a major boundary, create a branch for the previous major so fixes for it keep releasing under their own dist-tag.

If the user has already said which add-ons they want — including "just the default" — do not ask. Otherwise ask once, in a single concise question listing the three add-ons with one-line explanations, with "none" as the default.

The user may also name the project type or addon explicitly (for example "this is a pnpm monorepo with independent versions"). An explicit statement always wins over detection.

## Detect the Project Type

Inspect the repository root:

```bash
ls action.yml action.yaml pnpm-workspace.yaml pnpm-lock.yaml package-lock.json yarn.lock package.json
cat package.json
cat pnpm-workspace.yaml
```

Pick the project addon by the first matching rule:

1. `action.yml` or `action.yaml` in the root with `runs.using: node...` and a `package.json` — the repository is itself a Node.js GitHub Action: `@simple-release/node-gha#NodeGhaProject`. Check this first — an action repository also has a lock file.
2. `pnpm-workspace.yaml` with a non-empty `packages` list: `@simple-release/pnpm#PnpmWorkspacesProject` (requires `mode`, see below).
3. `pnpm-lock.yaml`: `@simple-release/pnpm#PnpmProject`.
4. `package.json` with a `workspaces` field: `@simple-release/npm#NpmWorkspacesProject` (requires `mode`).
5. `package.json`: `@simple-release/npm#NpmProject`.

Caveats:

- **yarn**: there is no yarn addon. The npm addon works for yarn-managed repositories — publishing runs `npm publish` — but confirm this with the user before proceeding.
- **No `package.json`**: no bundled addon fits. A custom manifest and project addon is needed — see <https://simple-release.js.org/js-api/>. Offer to write one; do not force an npm addon onto a non-JavaScript project.
- **Private single package** (`"private": true` and not a workspaces root): ask whether it should be published anywhere. If not, add `"publish": { "skip": true }` to the config and drop the npm token and registry setup from the release job — the flow still bumps, tags, and creates GitHub releases.

### Monorepo versioning mode

`PnpmWorkspacesProject` and `NpmWorkspacesProject` require `mode`:

- `fixed` — all packages share one version and one `vX.Y.Z` tag.
- `independent` — each package versions on its own, tagged `pkg-name@X.Y.Z`.

The mode is a policy choice that cannot be detected reliably — ask the user unless they already said. If all workspace package versions are currently equal, suggest `fixed` as the likely intent; differing versions suggest `independent`.

In monorepos commits are attributed to packages by the commit scope: `fix(pkg-name): ...` bumps `pkg-name` (the package name without the npm scope). Mention this to the user — wrong scopes mean no bump.

### Pin the addon version

Resolve the current version and pin it in the query:

```bash
npm view @simple-release/pnpm version
```

Use the pinned form, for example `@simple-release/pnpm@3.2.4#PnpmWorkspacesProject`. The action caches installed addons — an unpinned query means "whatever was latest when the cache was first built"; changing the pinned version also refreshes the cache.

## Detect the Toolchain

Fill the workflow from the repository, not from assumptions:

- **Default branch** — `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`, or `git symbolic-ref --short refs/remotes/origin/HEAD`. Used in the `on.push.branches` trigger.
- **Node.js version** — in priority order: `.nvmrc` or `.node-version` file (then prefer `node-version-file` over a hardcoded `node-version` in `actions/setup-node`), the minimum major satisfying `engines.node`, `volta.node`, existing CI workflows. Fall back to the current LTS major.
- **Package manager version** — if `package.json` has a `packageManager` field, use `pnpm/action-setup` **without** a `version` input — it reads the field. Otherwise infer the major from `pnpm-lock.yaml`'s `lockfileVersion` (`'6.0'` → pnpm 8, `'9.0'` → pnpm 9 or 10 — prefer the latest and tell the user what you assumed). npm needs no setup beyond `actions/setup-node`.
- **Registry** — default `https://registry.npmjs.org`. If `publishConfig.registry` or `.npmrc` points to GitHub Packages (`npm.pkg.github.com`): set that `registry-url` plus `scope: '@owner'` in `actions/setup-node`, pass `npm-token: ${{ secrets.GITHUB_TOKEN }}`, and add `packages: write` to the release job permissions. GitHub Packages requires the package scope to match the repository owner — flag a mismatch instead of publishing into the void.
- **Existing workflows** — reuse the action versions and conventions the repository already has where they don't conflict with this setup.

## Generate the Config

`.simple-release.json` in the repository root. The action reads the query and installs the addon itself — the repository needs no new dependencies.

Single package:

```json
{
  "project": "@simple-release/pnpm@3.2.4#PnpmProject"
}
```

Workspaces monorepo:

```json
{
  "project": ["@simple-release/pnpm@3.2.4#PnpmWorkspacesProject", {
    "mode": "fixed"
  }]
}
```

Node.js GitHub Action — the built refs (`latest` branch, `v{major}` branch, `v{version}` tag) are what consumers use, so the publish step gets a build command and the files to ship:

```json
{
  "project": "@simple-release/node-gha@3.2.4#NodeGhaProject",
  "publish": {
    "build": "pnpm install --prod --config.node-linker=hoisted",
    "files": ["node_modules", "src", "action.yml"]
  }
}
```

If maintenance branches were requested, enable them in the config — not via a workflow input, so the setting is permanent and versioned:

```json
{
  "project": ["@simple-release/pnpm@3.2.4#PnpmWorkspacesProject", {
    "mode": "fixed"
  }],
  "maintenanceBranch": {
    "enabled": true
  }
}
```

## Generate the Release Workflow

The base template — three jobs: `check` decides what should run for the current event, `pull-request` maintains the release pull request, `release` runs on the merged release commit. Shown for a pnpm project publishing to npm; the placeholders to fill from detection are the branch names, package manager setup, Node.js version, and registry:

```yaml
name: Release
on:
  issue_comment:
    types: [created, deleted]
  push:
    branches:
      - main
jobs:
  check:
    runs-on: ubuntu-latest
    name: Context check
    permissions:
      contents: read
    outputs:
      continue: ${{ steps.check.outputs.continue }}
      workflow: ${{ steps.check.outputs.workflow }}
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v7
      - name: Context check
        id: check
        uses: TrigenSoftware/simple-release-action@v2
        with:
          workflow: check
          github-token: ${{ secrets.GITHUB_TOKEN }}
  pull-request:
    runs-on: ubuntu-latest
    name: Pull request
    needs: check
    if: needs.check.outputs.workflow == 'pull-request'
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v7
      - name: Create or update pull request
        uses: TrigenSoftware/simple-release-action@v2
        with:
          workflow: pull-request
          github-token: ${{ secrets.GITHUB_TOKEN }}
  release:
    runs-on: ubuntu-latest
    name: Release
    needs: check
    if: needs.check.outputs.workflow == 'release'
    permissions:
      contents: write
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v7
      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 11
      - name: Install Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      - name: Install dependencies
        run: pnpm install
      - name: Release
        uses: TrigenSoftware/simple-release-action@v2
        with:
          workflow: release
          github-token: ${{ secrets.GITHUB_TOKEN }}
          npm-token: ${{ secrets.NPM_TOKEN }}
```

The `issue_comment` trigger is required: the pending release can be reshaped from the release pull request with a `!simple-release/set-options` comment, and the action re-runs on comment events.

Variations:

- **npm project** — drop the `Install pnpm` step, use `cache: 'npm'` and `run: npm ci`.
- **Node.js GitHub Action project** — keep the package manager and Node.js setup and the install step in the `release` job (the configured `build` command needs them), but drop `registry-url` and `npm-token`: publishing pushes git refs, not registry packages.
- **No publishing** (`publish.skip` in the config) — drop `registry-url` and `npm-token` from the `release` job.
- **GitHub Packages** — see the registry point in the toolchain section.

### Manual release add-on

Add a `workflow_dispatch` trigger and forward its inputs in the `pull-request` job:

```yaml
on:
  workflow_dispatch:
    inputs:
      version:
        description: Force specific version
        type: string
      as:
        description: Release type
        type: choice
        options:
          - ''
          - major
          - minor
          - patch
          - prerelease
      prerelease:
        description: Pre-release identifier (e.g. alpha, beta)
        type: string
  # ...the issue_comment and push triggers stay as they are
```

```yaml
      - name: Create or update pull request
        uses: TrigenSoftware/simple-release-action@v2
        with:
          workflow: pull-request
          github-token: ${{ secrets.GITHUB_TOKEN }}
          bump-version: ${{ inputs.version }}
          bump-as: ${{ inputs.as }}
          bump-prerelease: ${{ inputs.prerelease }}
```

On regular pushes the `inputs` context is empty, so the flow is unaffected. For an independent monorepo also offer a `by-project` string input forwarded to `bump-by-project` — a JSON object keyed by full package names, for example `{"@org/pkg-a":{"as":"minor"}}`.

### Maintenance branches add-on

Besides `maintenanceBranch.enabled` in the config, let the workflow react to pushes to the maintenance branches:

```yaml
  push:
    branches:
      - main
      - 'v*'
```

Use `'v*'` for single packages and fixed monorepos (branches like `v1`), and `'*@*'` for independent monorepos (branches like `pkg-name@1`).

### Snapshot add-on

A separate `.github/workflows/snapshot.yml` with its own dispatch trigger — snapshots run on demand from any branch:

```yaml
name: Snapshot
on:
  workflow_dispatch:
    inputs:
      tag:
        description: Snapshot tag
        type: string
        required: true
        default: snapshot
jobs:
  snapshot:
    runs-on: ubuntu-latest
    name: Snapshot
    permissions:
      contents: read
    steps:
      - name: Checkout the repository
        uses: actions/checkout@v7
      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 11
      - name: Install Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      - name: Install dependencies
        run: pnpm install
      - name: Publish snapshot
        uses: TrigenSoftware/simple-release-action@v2
        with:
          workflow: snapshot
          github-token: ${{ secrets.GITHUB_TOKEN }}
          npm-token: ${{ secrets.NPM_TOKEN }}
          bump-snapshot: ${{ inputs.tag }}
```

The package manager, Node.js, and registry setup follows the same detection as the release job. Snapshots publish to a registry — skip this add-on for project types that do not (a Node.js GitHub Action).

## Validate

- The config must be valid JSON and the workflows valid YAML — parse them (for example with `node -e` or a YAML-aware tool). Run `actionlint` on the workflows if it is available.
- Do not invent action inputs or config keys — everything this skill needs is listed above; the full reference is <https://simple-release.js.org/github-action/> and <https://simple-release.js.org/getting-started/configuration/>.

## Tell the User

Finish with a checklist of the steps that cannot be automated:

1. **Allow pull request creation**: repository **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. Without it the `pull-request` job fails with "GitHub Actions is not permitted to create or approve pull requests". With the GitHub CLI:

   ```bash
   gh api -X PUT repos/{owner}/{repo}/actions/permissions/workflow \
     -F can_approve_pull_request_reviews=true
   ```

2. **`NPM_TOKEN` secret** — required when publishing to the npm registry: an npm automation (granular) token with publish permission for the packages. Not needed for GitHub Packages (the workflow token is used) or for non-publishing projects.
3. **Squash-merge release pull requests** — the release is recognized by the `chore(release): ...` commit title on the branch head. A regular merge commit hides it and the release job will not run. Recommend enabling squash merging for the repository.
4. **The first release** — after the setup is merged, the next push of a releasable commit (or the setup push itself) opens a release pull request. When no release tags exist yet, the version is taken from the manifest as is and the changelog covers the whole history.
5. **Reshaping a pending release** — a comment on the release pull request starting with `!simple-release/set-options` followed by a JSON code block (for example `{"bump": {"as": "major"}}`) rebuilds it with those options; the pull request body includes a cheatsheet.

Suggest a hidden-type commit message for the setup itself, such as `ci: set up release automation`.
