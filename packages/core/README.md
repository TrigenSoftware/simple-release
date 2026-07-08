# @simple-release/core

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/core.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/core

[node]: https://img.shields.io/node/v/@simple-release/core.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/core
[deps-url]: https://libraries.io/npm/@simple-release%2Fcore

[size]: https://packagephobia.com/badge?p=@simple-release/core
[size-url]: https://packagephobia.com/result?p=@simple-release/core

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A simple tool to automate version bumps, changelogs, and releases using [Conventional Commits](https://conventionalcommits.org).

- 📄 Uses [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) to parse commits, determine the next version, and generate a changelog.
- 🗂️ Supports monorepos and can release multiple packages in a single run.
- 🧩 Flexible and extensible with custom addons for different project types.
- 🚀 Has [GitHub Action](https://github.com/TrigenSoftware/simple-release-action) to automate releases in CI/CD pipelines.

*New to Conventional Commits? [Check out The Complete Guide](https://simple-release.js.org/getting-started/complete-guide/).*

## Install

```bash
# pnpm
pnpm add @simple-release/core
# yarn
yarn add @simple-release/core
# npm
npm i @simple-release/core
```

## Usage

```js
import { Releaser } from '@simple-release/core'
import { PnpmProject } from '@simple-release/pnpm'
import { GithubHosting } from '@simple-release/github'

await new Releaser({
  project: new PnpmProject(),
  hosting: new GithubHosting({
    token: process.env.GITHUB_TOKEN
  })
})
  .bump()
  .commit()
  .tag()
  .push()
  .release()
  .publish()
  .run()
```

Monorepo example:

```js
import { Releaser } from '@simple-release/core'
import { PnpmWorkspacesProject } from '@simple-release/pnpm'
import { GithubHosting } from '@simple-release/github'

await new Releaser({
  project: new PnpmWorkspacesProject({
    mode: 'independent'
  }),
  hosting: new GithubHosting({
    token: process.env.GITHUB_TOKEN
  })
})
  .bump()
  .commit()
  .tag()
  .push()
  .release()
  .publish()
  .run()
```

## Addons

- [npm](https://github.com/TrigenSoftware/simple-release/tree/main/packages/npm) - for projects using `npm` as a package manager.
- [pnpm](https://github.com/TrigenSoftware/simple-release/tree/main/packages/pnpm) - for projects using `pnpm` as a package manager.
- [node-gha](https://github.com/TrigenSoftware/simple-release/tree/main/packages/node-gha) - for Node.js GitHub Action projects published through git refs.
- [github](https://github.com/TrigenSoftware/simple-release/tree/main/packages/github) - for projects hosted on GitHub.

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/js-api/).
