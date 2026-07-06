# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.2.2](https://github.com/TrigenSoftware/simple-release/compare/v3.2.0...v3.2.2) (2026-07-06)

### Bug Fixes

* pass options to monorepo tags and release data overrides ([#173](https://github.com/TrigenSoftware/simple-release/issues/173)) ([e6f614d](https://github.com/TrigenSoftware/simple-release/commit/e6f614d7afd4080f5f840d3035c10f4326018e1c))

## [3.2.0](https://github.com/TrigenSoftware/simple-release/compare/v3.1.1...v3.2.0) (2026-07-06)

### Features

* do not mark maintenance releases as latest ([#169](https://github.com/TrigenSoftware/simple-release/issues/169)) ([4f7dc13](https://github.com/TrigenSoftware/simple-release/commit/4f7dc13c342b1770666281588f7949a2711fbde0))

## [3.1.1](https://github.com/TrigenSoftware/simple-release/compare/v3.1.0...v3.1.1) (2026-07-06)

### Bug Fixes

* fetch refs before snapshot bump and always apply snapshot identifier ([#167](https://github.com/TrigenSoftware/simple-release/issues/167)) ([af28eb4](https://github.com/TrigenSoftware/simple-release/commit/af28eb430472af600c992794b69fdb0b4a706c75))

## [3.1.0](https://github.com/TrigenSoftware/simple-release/compare/v3.0.3...v3.1.0) (2026-07-06)

### Features

* resolve last release tag through project to support bundled release commits ([#165](https://github.com/TrigenSoftware/simple-release/issues/165)) ([5e65aa7](https://github.com/TrigenSoftware/simple-release/commit/5e65aa7ddbc9252fd802fd4e7d9d68765a0b78b2))

## [3.0.3](https://github.com/TrigenSoftware/simple-release/compare/v3.0.2...v3.0.3) (2026-06-29)

### Bug Fixes

* set git user before release flows ([#155](https://github.com/TrigenSoftware/simple-release/issues/155)) ([1690c9c](https://github.com/TrigenSoftware/simple-release/commit/1690c9c501ff10eb692750803d2aa9897d68b3c4))

## [3.0.0](https://github.com/TrigenSoftware/simple-release/compare/v2.4.0...v3.0.0) (2026-06-29)

### ⚠ BREAKING CHANGES

* Node.js 18 and 20 are no longer supported.

### Features

* require Node.js 22 and pnpm 11 ([4cd6fdf](https://github.com/TrigenSoftware/simple-release/commit/4cd6fdfcd8bc47ebeca25c3d8760ed839c66f51d))
* support maintenance branches ([#150](https://github.com/TrigenSoftware/simple-release/issues/150)) ([25a1820](https://github.com/TrigenSoftware/simple-release/commit/25a18208842b174975452149cb8f84fb801fe886))
* support snapshot releases ([#149](https://github.com/TrigenSoftware/simple-release/issues/149)) ([11ed7de](https://github.com/TrigenSoftware/simple-release/commit/11ed7de88831c33b955729dcf2f82e386c7e17e1))

### Bug Fixes

* generate release notes for new fixed monorepo packages ([#147](https://github.com/TrigenSoftware/simple-release/issues/147)) ([c3a15ce](https://github.com/TrigenSoftware/simple-release/commit/c3a15ceb8159283442da598b94ad526934cd9a4a))
* show fallback notes for forced version bumps ([#148](https://github.com/TrigenSoftware/simple-release/issues/148)) ([41f36fe](https://github.com/TrigenSoftware/simple-release/commit/41f36fe9bce5a8f9f91485bee81301f8becd972d))
* update conventional changelog packages ([0ac3291](https://github.com/TrigenSoftware/simple-release/commit/0ac32910e3c1b429ae221820f7567d90b40c8f5d))

## [2.4.0](https://github.com/TrigenSoftware/simple-release/compare/v2.3.0...v2.4.0) (2025-07-10)

### Features

* extraScopes monorepo bump parameter ([89ddc63](https://github.com/TrigenSoftware/simple-release/commit/89ddc63116b1aa9108a4e184756eb3332b03e175))

## [2.3.0](https://github.com/TrigenSoftware/simple-release/compare/v2.2.1...v2.3.0) (2025-07-08)

### Features

* add skip option to publish step ([7213cc7](https://github.com/TrigenSoftware/simple-release/commit/7213cc76d27d9ee276b072132d5786109df94dd9))

## [2.2.1](https://github.com/TrigenSoftware/simple-release/compare/v2.2.0...v2.2.1) (2025-06-27)

### Bug Fixes

* options object is optional for PackageJsonProject ([0a18fd1](https://github.com/TrigenSoftware/simple-release/commit/0a18fd1f681477e069a0b4fef40090a140438d7f))

## [2.2.0](https://github.com/TrigenSoftware/simple-release/compare/v2.1.2...v2.2.0) (2025-06-09)

### Features

* `fetch` option for tag step to update local tags before tagging ([e3137e4](https://github.com/TrigenSoftware/simple-release/commit/e3137e439e313661e52dabfba38497c2b274a642))

## [2.1.0](https://github.com/TrigenSoftware/simple-release/compare/v2.0.3...v2.1.0) (2025-06-08)

### Bug Fixes

* bump fixed monorepo using root version as base ([fc3a73f](https://github.com/TrigenSoftware/simple-release/commit/fc3a73fa1a89bcdb0c1e7ae81361ebc0c5067d91))

## [2.0.3](https://github.com/TrigenSoftware/simple-release/compare/v2.0.2...v2.0.3) (2025-06-07)

### Bug Fixes

* extract correct version from changelog ([4486435](https://github.com/TrigenSoftware/simple-release/commit/44864354dcf9522782c40a21ab19874a00265e9d))

## [2.0.2](https://github.com/TrigenSoftware/simple-release/compare/v2.0.1...v2.0.2) (2025-06-07)

### Bug Fixes

* load preset with local import function ([0bc9e62](https://github.com/TrigenSoftware/simple-release/commit/0bc9e62aa2386446760a7d4790765ce0ce4d2096))

## [2.0.1](https://github.com/TrigenSoftware/simple-release/compare/v2.0.0...v2.0.1) (2025-06-07)

### Bug Fixes

* consistent type imports ([9253aff](https://github.com/TrigenSoftware/simple-release/commit/9253aff53c9a232661d694f13728217d003fec25))
* package build fix ([73817a5](https://github.com/TrigenSoftware/simple-release/commit/73817a5d03ffdae1fbaae38faed18f32f1fbbefd))

## [2.0.0](https://github.com/TrigenSoftware/simple-release/compare/v1.0.0...v2.0.0) (2025-06-05)

### Features

* a simple tool to release projects with monorepo support ([d695be5](https://github.com/TrigenSoftware/simple-release/commit/d695be51e9e0fdf12acfb86a8d0cefe802012271))
