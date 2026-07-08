# @simple-release/github

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/github.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/github

[node]: https://img.shields.io/node/v/@simple-release/github.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/github
[deps-url]: https://libraries.io/npm/@simple-release%2Fgithub

[size]: https://packagephobia.com/badge?p=@simple-release/github
[size-url]: https://packagephobia.com/result?p=@simple-release/github

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A github addon for simple-release.

## Install

```bash
# pnpm
pnpm add @simple-release/github
# yarn
yarn add @simple-release/github
# npm
npm i @simple-release/github
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
  .publish()
  .release()
  .run()
```

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/hostings/github/).
