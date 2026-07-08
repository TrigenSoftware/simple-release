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
[deps-url]: https://libraries.io/npm/@simple-release%2Fnpm

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

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/project-types/npm/).
