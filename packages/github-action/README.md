# @simple-release/github-action

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/github-action.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/github-action

[node]: https://img.shields.io/node/v/@simple-release/github-action.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/github-action
[deps-url]: https://libraries.io/npm/@simple-release%2Fgithub-action

[size]: https://packagephobia.com/badge?p=@simple-release/github-action
[size-url]: https://packagephobia.com/result?p=@simple-release/github-action

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A simple-release api for github action.

## Install

```bash
# pnpm
pnpm add @simple-release/github-action
# yarn
yarn add @simple-release/github-action
# npm
npm i @simple-release/github-action
```

## Usage

```js
import { getOctokit } from '@actions/github'
import { load } from '@simple-release/config'
import { ReleaserGithubAction } from '@simple-release/github-action'

const {
  project,
  releaser,
  ...options
} = await load({
  config: true,
  project: true
})

// Detect the current event context and run the pull request or release flow
await new ReleaserGithubAction({
  project,
  octokit: getOctokit(process.env.GITHUB_TOKEN),
  ...releaser
})
  .setOptions(options)
  .runAction()
```

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/js-api/github-action/).
