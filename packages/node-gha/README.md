# @simple-release/node-gha

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/node-gha.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/node-gha

[node]: https://img.shields.io/node/v/@simple-release/node-gha.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/node-gha
[deps-url]: https://libraries.io/npm/@simple-release%2Fnode-gha

[size]: https://packagephobia.com/badge?p=@simple-release/node-gha
[size-url]: https://packagephobia.com/result?p=@simple-release/node-gha

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A Node.js GitHub Actions addon for simple-release.

## Install

```bash
# pnpm
pnpm add @simple-release/node-gha
# yarn
yarn add @simple-release/node-gha
# npm
npm i @simple-release/node-gha
```

## Usage

```js
import { Releaser } from '@simple-release/core'
import { NodeGhaProject } from '@simple-release/node-gha'

await new Releaser({
  project: new NodeGhaProject()
})
  .publish({
    build: 'pnpm install --prod',
    files: [
      'node_modules',
      'dist'
    ]
  })
  .run()
```

`NodeGhaProject` publishes a built Node.js GitHub Action state by creating or updating:

- `latest` branch from the current release commit.
- `v{major}` branch from the built `latest` state.
- `v{version}` tag from the built `latest` state.

If `build` is provided, the command runs on the `latest` branch. After the command completes, files from the publish option `files` are force-added and the release commit is amended before refs are pushed. If `files` is not provided, package.json `files` is used.

## Options

### NodeGhaProject

#### `path`

Path to the `package.json` manifest file. Defaults to `'package.json'`.

#### `changelogFile`

Path to the changelog file. Defaults to `'CHANGELOG.md'`.

#### `compose`

Function to compose the main manifest with secondaries. It can be needed if you have some secondary manifests where version also should be updated. Optional.

### publish

Publish options for `NodeGhaProject`.

#### `skip`

If true, skip publishing. Optional.

#### `latestBranch`

Branch that points to the latest built GitHub Action state. Defaults to `'latest'`.

#### `majorBranchPrefix`

Prefix for the major branch. Defaults to `'v'`.

#### `tagPrefix`

Prefix for version tags. Defaults to `'v'`.

#### `build`

Build or install command to run before publishing refs. Optional.

#### `files`

Files to stage after `build`. Defaults to package.json `files`.

#### `env`

Environment variables to set before running build commands. Defaults to `process.env`.
