# @simple-release/pnpm

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/pnpm.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/pnpm

[node]: https://img.shields.io/node/v/@simple-release/pnpm.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/pnpm
[deps-url]: https://libraries.io/npm/@simple-release%2Fpnpm/tree

[size]: https://packagephobia.com/badge?p=@simple-release/pnpm
[size-url]: https://packagephobia.com/result?p=@simple-release/pnpm

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A pnpm addon for simple-release.

## Install

```bash
# pnpm
pnpm add @simple-release/pnpm
# yarn
yarn add @simple-release/pnpm
# npm
npm i @simple-release/pnpm
```

## Usage

```js
import { Releaser } from '@simple-release/core'
import { PnpmProject } from '@simple-release/pnpm'

await new Releaser({
  project: new PnpmProject()
})
  .bump()
  .commit()
  .tag()
  .push()
  .publish()
  .run()
```

Workspaces example:

```js
import { Releaser } from '@simple-release/core'
import { PnpmWorkspacesProject } from '@simple-release/pnpm'

await new Releaser({
  project: new PnpmWorkspacesProject({
    mode: 'independent'
  })
})
  .bump()
  .commit()
  .tag()
  .push()
  .publish()
  .run()
```

`PnpmWorkspacesProject` will read workspaces from the `pnpm-workspace.yaml` in the root of the project.

## Options

### PnpmProject

#### `path`

Path to the `package.json` manifest file. Defaults to `'package.json'`.

#### `changelogFile`

Path to the changelog file. Defaults to `'CHANGELOG.md'`.

#### `compose`

Function to compose the main manifest with secondaries. It can be needed if you have some secondary manifests where version also should be updated. Optional.

```js
import { ComposedProjectManifest } from '@simple-release/core'
import { PnpmProject } from '@simple-release/pnpm'

new PnpmProject({
  compose: main => new ComposedProjectManifest(main, [
    new SomeManifest(/* ... */)
  ])
})
```

### PnpmWorkspacesProject

#### `mode`

Mode to determine how to bump versions in the monorepo. Required.

- `independent` - each package can have its own version.
- `fixed` - all packages have the same version.

#### `root`

Path to the monorepo root. Defaults to the current working directory.

#### `changelogFile`

Path to the changelog file. Defaults to `'CHANGELOG.md'`.

#### `compose`

Function to compose the main manifest with secondaries. It can be needed if you have some secondary manifests where version also should be updated. Will be called for each manifest in monorepo. Optional.

```js
import { ComposedProjectManifest } from '@simple-release/core'
import { PnpmWorkspacesProject } from '@simple-release/pnpm'

new PnpmWorkspacesProject({
  compose: (main, isRoot) => (
    isRoot
      ? main
      : new ComposedProjectManifest(main, [
        new SomeManifest(/* ... */)
      ])
  )
})
```

#### `scope`

Function to format scope name from the package name. By default, scope part of the package name will dropped (`@scope/pkg-name` -> `pkg-name`).

#### `tagPrefix`

Function to format tag prefix from scope name. By default, tag prefix will be the scope name with `@` sign (`pkg-name` -> `pkg-name@`) for independent mode and empty string for fixed mode.

### publish

Publish options for `PnpmProject` and `PnpmWorkspacesProject`.

#### `skip`

If true, skip publishing. Optional.

#### `access`

Access level for the package. Optional.

#### `tag`

String or function to format tag name. Function accepts version string and prerelease versions. Optional.

#### `otp`

One-time password for publishing. Optional.

#### `gitChecks`

Whether to run git checks before publishing. Defaults to `true`.

#### `env`

Environment variables to set before publishing. Defaults to `process.env`.
