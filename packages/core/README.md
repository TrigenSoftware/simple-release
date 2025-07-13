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
[deps-url]: https://libraries.io/npm/@simple-release%2Fcore/tree

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

*New to Сonventional Сommits? [Check out The Complete Guide](https://github.com/TrigenSoftware/simple-release/blob/main/GUIDE.md).*

<hr />
<a href="#install">Install</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#usage">Usage</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#addons">Addons</a>
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
<a href="#custom-addons">Custom addons</a>
<br />
<hr />

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

### Options

| Option | Description |
| --- | --- |
| `project` | Project instance. |
| `hosting` | Git repository hosting instance. Optional. |
| `dryRun` | If true, do not write files, just change the version in memory. |
| `verbose` | If true, log more information to the console. |
| `silent` | If true, do not log anything to the console. |

### Available steps

| Step | Description |
| --- | --- |
| checkout | Checkout the desired branch. |
| bump | Bump the version of the project and generate changelog. |
| commit | Commit the changes with the new version. |
| tag | Tag the commit with the new version. |
| push | Push the changes to the remote repository. |
| release | Create a release in the remote repository. |
| publish | Publish the project to the package registry. |
| pullRequest | Create a pull request with the changes. |

## Addons

- [npm](https://github.com/TrigenSoftware/simple-release/tree/main/packages/npm) - for projects using `npm` as a package manager.
- [pnpm](https://github.com/TrigenSoftware/simple-release/tree/main/packages/pnpm) - for projects using `pnpm` as a package manager.
- [github](https://github.com/TrigenSoftware/simple-release/tree/main/packages/github) - for projects hosted on GitHub.

## Custom addons

### Manifest

If you want to create your own project addon, firstly you can need to create a custom manifest adapter. Manifest adapter is a class that reads basic information about the project from the manifest file (like `package.json`) and can write version to it.

```js
import { ProjectManifest } from '@simple-release/core'

export class CustomManifest extends ProjectManifest {
  static Filename = 'custom.json'

  async readManifest() {
    // Read the manifest file and return its parsed content
  }

  async getName() {
    // Return the name of the project
  }

  async getVersion() {
    // Return the current version of the project
  }

  async isPrivate() {
    // Return true if the project is private
  }

  async writeVersion(version, dryRun) {
    // Write the new version to the manifest file
    // If dryRun is true, do not write the file, just change the version in memory
  }
}
```

For more detailed example you can look at the [PackageJsonManifest](./src/manifest/packageJson.ts) implementation.

### Project

Project is a class that represents the project and provides methods to work with it:

- bump version
- get information from git
- publish the project
- etc.

Most of the methods are implemented in base class [Project](./src/project/project.ts) and you can extend it to create your own project class.

In most casses you need just prepare options for the base class and implement `publish` method (like it is done in [PackageJsonProject](./src/project/packageJson.ts)).

```js
import { Project } from '@simple-release/core'

export class CustomProject extends Project {
  constructor(options) {
    super({
      ...options,
      manifest: new CustomManifest(options.path)
    })
  }

  async publish(options) {
    // Publish the project
  }
}
```

There also is a base class for monorepo projects - [MonorepoProject](./src/project/monorepo.ts). It provides methods to work with monorepo projects and you can extend it to create your own monorepo project class (alos see [PackageJsonMonorepoProject](./src/project/packageJsonMonorepo.ts)).

### GitRepositoryHosting

GitRepositoryHosting is a class that represents a git repository hosting service (like GitHub, GitLab, etc.) or whatever you want. It is used to create a release in the remote repository and create a pull request with the changes.

```js
import { GitRepositoryHosting } from '@simple-release/core'

export class MyRepositoryHosting extends GitRepositoryHosting {
  async createRelease({ project, dryRun, logger }) {
    // Create the release in the remote repository
    // You can use `project` to get information about the project
    // or more precisely you can use `project.getReleaseData()` to get the data for the release
  }

  async createPullRequest({ from, to, project, dryRun, logger }) {
    // Create a pull request with the changes
    // You can use `project` to get information about the project
  }
}
```

For more detailed example you can look at the [GithubHosting](../github/src/index.ts) implementation.
