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
import {
  ReleaserGithubAction,
  getInputOptions,
  ifReleaseCommit
} from '@simple-release/github-action'

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
  .publish()
  .release()
  .run(ifReleaseCommit)

// Run all steps to create a pull request with version bump
action
  .setOptions(options)
  .runPullRequestAction()

// Run all steps to release project
action
  .setOptions(options)
  .runReleaseAction()

// Run all steps to publish a snapshot version
action
  .setOptions(options)
  .runSnapshotAction('canary')

// Detect action by commit type and run appropriate steps
action
  .setOptions(options)
  .runAction()

// Read supported GitHub Action inputs
const inputOptions = getInputOptions()
```

## API

### Action helpers

| Helper | Description |
| --- | --- |
| `fetchOptions` | Read extra releaser options from pull request comments. |
| `runPullRequestAction` | Run the default pull request flow. |
| `runReleaseAction` | Run the default release flow. |
| `runSnapshotAction` | Publish a temporary snapshot version. |
| `runAction` | Detect current GitHub event context and run pull request or release flow. |

#### fetchOptions

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

#### Default flows

`runPullRequestAction` runs:

```js
action
  .checkout()
  .fetchOptions()
  .bump()
  .commit()
  .push()
  .pullRequest()
  .run()
```

`runReleaseAction` runs release steps in an order that lets project-specific `publish` implementations prepare final release artifacts before the GitHub release is created:

```js
action
  .maintenanceBranch()
  .tag()
  .push()
  .publish()
  .release()
  .run(ifReleaseCommit)
```

`maintenanceBranch` is disabled by default. It can be enabled through `setOptions`, pull request comments, or action inputs.

`runSnapshotAction(snapshotTag)` publishes a temporary snapshot version. It bumps with a timestamped prerelease identifier, skips changelog generation, publishes with `tag: snapshotTag`, then reverts the version updates.

```js
action
  .bump({
    snapshot: snapshotTag,
    skipChangelog: true
  })
  .publish({
    tag: snapshotTag,
    gitChecks: false
  })
  .revert()
  .run()
```

### Input options

`getInputOptions` reads GitHub Action inputs and maps them to environment variables and releaser step options.

| Input | Target option |
| --- | --- |
| `github-token` | `GITHUB_TOKEN` |
| `npm-token` | `NODE_AUTH_TOKEN` |
| `publish-token` | `PUBLISH_TOKEN` |
| `branch` | `checkout.branch` |
| `bump-version` | `bump.version` |
| `bump-as` | `bump.as` |
| `bump-prerelease` | `bump.prerelease` |
| `bump-snapshot` | `bump.snapshot` |
| `bump-first-release` | `bump.firstRelease` |
| `bump-skip` | `bump.skip` |
| `bump-by-project` | `bump.byProject` |
| `maintenance-branch` | `maintenanceBranch.enabled` |
| `publish-skip` | `publish.skip` |
| `publish-access` | `publish.access` |
| `publish-tag` | `publish.tag` |
