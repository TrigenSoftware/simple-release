# @simple-release/npm

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/npm.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/npm

[node]: https://img.shields.io/node/v/@simple-release/npm.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/npm
[deps-url]: https://libraries.io/npm/@simple-release%2Fnpm/tree

[size]: https://packagephobia.com/badge?p=@simple-release/npm
[size-url]: https://packagephobia.com/result?p=@simple-release/npm

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A npm addon for simple-release.

## Install

```bash
# pnpm
pnpm add @simple-release/npm
# yarn
yarn add @simple-release/npm
# npm
npm i @simple-release/npm
```

## Usage

```js
import { Releaser } from '@simple-release/core'
import { NpmProject } from '@simple-release/npm'

await new Releaser({
  project: new NpmProject()
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
import { NpmWorkspacesProject } from '@simple-release/npm'

await new Releaser({
  project: new NpmWorkspacesProject({
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

`NpmWorkspacesProject` will read workspaces from the `package.json` in the root of the project.

## Options

### NpmProject

#### `path`

Path to the `package.json` manifest file. Defaults to `'package.json'`.

#### `changelogFile`

Path to the changelog file. Defaults to `'CHANGELOG.md'`.

#### `compose`

Function to compose the main manifest with secondaries. It can be needed if you have some secondary manifests where version also should be updated. Optional.

```js
import { ComposedProjectManifest } from '@simple-release/core'
import { NpmProject } from '@simple-release/npm'

new NpmProject({
  compose: main => new ComposedProjectManifest(main, [
    new SomeManifest(/* ... */)
  ])
})
```

### NpmWorkspacesProject

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
import { NpmWorkspacesProject } from '@simple-release/npm'

new NpmWorkspacesProject({
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

Publish options for `NpmProject` and `NpmWorkspacesProject`.

#### `skip`

If true, skip publishing. Optional.

#### `access`

Access level for the package. Optional.

#### `tag`

String or function to format tag name. Function accepts version string and prerelease versions. Optional.

#### `otp`

One-time password for publishing. Optional.

#### `env`

Environment variables to set before publishing. Defaults to `process.env`.
