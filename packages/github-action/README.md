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
[deps-url]: https://libraries.io/npm/@simple-release%2Fgithub-actions

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
import { ReleaserGithubAction, ifReleaseCommit } from '@simple-release/github-action'

const {
  project,
  releaser,
  ...options
} = await load({
  config: true,
  project: true
})
const action = await new ReleaserGithubAction({
  project,
  octokit: getOctokit(token),
  ...releaser
})

// Create pull request with version bump
action
  .setOptions(options)
  .checkout()
  .fetchOptions()
  .bump()
  .commit()
  .push()
  .pullRequest()
  .run()

// Publish release and project
action
  .setOptions(options)
  .tag()
  .push()
  .release()
  .publish()
  .run(ifReleaseCommit)

// Run all steps to create a pull request with version bump
action
  .setOptions(options)
  .runPullRequestAction()

// Run all steps to release project
action
  .setOptions(options)
  .runReleaseAction()

// Detect action by commit type and run appropriate steps
action
  .setOptions(options)
  .runAction()
```

### fethchOptions

You can pass additional options to releaser via comment in your pull request. Your comment should start with `!simple-release/set-options` and contain JSON object with options. For example:

````md
!simple-release/set-options

```json
{
  "bump": {
    "prerelease": "alpha"
  }
}
```
````

To fetch and parse comments you should use `fetchOptions` step after `checkout` step.
