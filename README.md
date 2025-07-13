# simple-release

[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release-tools/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release-tools/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A simple tool to automate version bumps, changelogs, and releases using [Conventional Commits](https://conventionalcommits.org).

- 📄 Uses [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) to parse commits, determine the next version, and generate a changelog.
- 🗂️ Supports monorepos and can release multiple packages in a single run.
- 🧩 Flexible and extensible with custom addons for different project types.
- 🚀 Has [GitHub Action](https://github.com/TrigenSoftware/simple-release-action) to automate releases in CI/CD pipelines.

> [!TIP]
> New to Сonventional Сommits? [Check out The Complete Guide](./GUIDE.md).

## Available packages

| Name | Description | Version | Dependencies |
|------|-------------|---------|--------------|
| [`@simple-release/core`](packages/core#readme) | A simple tool to release projects with monorepo support. | [![NPM version][core-npm]][core-npm-url] | [![Dependencies status][core-deps]][core-deps-url] |
| [`@simple-release/config`](packages/config#readme) | A simple-release config loader. | [![NPM version][config-npm]][config-npm-url] | [![Dependencies status][config-deps]][config-deps-url] |
| [`@simple-release/npm`](packages/npm#readme) | A npm addon for simple-release. | [![NPM version][npm-npm]][npm-npm-url] | [![Dependencies status][npm-deps]][npm-deps-url] |
| [`@simple-release/pnpm`](packages/pnpm#readme) | A pnpm addon for simple-release. | [![NPM version][pnpm-npm]][pnpm-npm-url] | [![Dependencies status][pnpm-deps]][pnpm-deps-url] |
| [`@simple-release/github`](packages/github#readme) | A github release addon for simple-release. | [![NPM version][github-npm]][github-npm-url] | [![Dependencies status][github-deps]][github-deps-url] |
| [`@simple-release/github-action`](packages/github-action#readme) | A simple-release api for github action. | [![NPM version][github-action-npm]][github-action-npm-url] | [![Dependencies status][github-action-deps]][github-action-deps-url] |
| [`simple-github-release`](packages/simple-github-release#readme) | A simple tool to create GitHub releases. | [![NPM version][simple-github-release-npm]][simple-github-release-npm-url] | [![Dependencies status][simple-github-release-deps]][simple-github-release-deps-url] |

<!-- core -->

[core-npm]: https://img.shields.io/npm/v/@simple-release/core.svg
[core-npm-url]: https://www.npmjs.com/package/@simple-release/core

[core-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/core
[core-deps-url]: https://libraries.io/npm/@simple-release%2Fcore/tree

<!-- config -->

[config-npm]: https://img.shields.io/npm/v/@simple-release/config.svg
[config-npm-url]: https://www.npmjs.com/package/@simple-release/config

[config-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/config
[config-deps-url]: https://libraries.io/npm/@simple-release%2Fconfig/tree

<!-- npm -->

[npm-npm]: https://img.shields.io/npm/v/@simple-release/npm.svg
[npm-npm-url]: https://www.npmjs.com/package/@simple-release/npm

[npm-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/npm
[npm-deps-url]: https://libraries.io/npm/@simple-release%2Fnpm/tree

<!-- pnpm -->

[pnpm-npm]: https://img.shields.io/npm/v/@simple-release/pnpm.svg
[pnpm-npm-url]: https://www.npmjs.com/package/@simple-release/pnpm

[pnpm-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/pnpm
[pnpm-deps-url]: https://libraries.io/npm/@simple-release%2Fpnpm/tree

<!-- github -->

[github-npm]: https://img.shields.io/npm/v/@simple-release/github.svg
[github-npm-url]: https://www.npmjs.com/package/@simple-release/github

[github-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/github
[github-deps-url]: https://libraries.io/npm/@simple-release%2Fgithub/tree

<!-- github-action -->

[github-action-npm]: https://img.shields.io/npm/v/@simple-release/github-action.svg
[github-action-npm-url]: https://www.npmjs.com/package/@simple-release/github-action

[github-action-deps]: https://img.shields.io/librariesio/release/npm/@simple-release/github-action
[github-action-deps-url]: https://libraries.io/npm/@simple-release%2Fgithub-action/tree

<!-- simple-github-release -->

[simple-github-release-npm]: https://img.shields.io/npm/v/simple-github-release.svg
[simple-github-release-npm-url]: https://www.npmjs.com/package/simple-github-release

[simple-github-release-deps]: https://img.shields.io/librariesio/release/npm/simple-github-release
[simple-github-release-deps-url]: https://libraries.io/npm/simple-github-release/tree
