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
[deps-url]: https://libraries.io/npm/@simple-release%2Fpnpm

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

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/project-types/pnpm/).
