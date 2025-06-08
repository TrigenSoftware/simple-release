# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.1.0](https://github.com/TrigenSoftware/simple-release/compare/v2.0.3...v2.1.0) (2025-06-08)

### Features

* **config:** addon queries feature ([8fffed4](https://github.com/TrigenSoftware/simple-release/commit/8fffed439e1b527491d8db0c2b178dff44f02a3a))

### Bug Fixes

* **core:** bump fixed monorepo using root version as base ([fc3a73f](https://github.com/TrigenSoftware/simple-release/commit/fc3a73fa1a89bcdb0c1e7ae81361ebc0c5067d91))

## [2.0.3](https://github.com/TrigenSoftware/simple-release/compare/v2.0.2...v2.0.3) (2025-06-07)

### Bug Fixes

* **core:** extract correct version from changelog ([4486435](https://github.com/TrigenSoftware/simple-release/commit/44864354dcf9522782c40a21ab19874a00265e9d))

## [2.0.2](https://github.com/TrigenSoftware/simple-release/compare/v2.0.1...v2.0.2) (2025-06-07)

### Bug Fixes

* **core:** load preset with local import function ([0bc9e62](https://github.com/TrigenSoftware/simple-release/commit/0bc9e62aa2386446760a7d4790765ce0ce4d2096))

## [2.0.1](https://github.com/TrigenSoftware/simple-release/compare/v2.0.0...v2.0.1) (2025-06-07)

### Bug Fixes

* **core,github-action:** consistent type imports ([9253aff](https://github.com/TrigenSoftware/simple-release/commit/9253aff53c9a232661d694f13728217d003fec25))
* **core,simple-github-release:** package build fix ([73817a5](https://github.com/TrigenSoftware/simple-release/commit/73817a5d03ffdae1fbaae38faed18f32f1fbbefd))

## [2.0.0](https://github.com/TrigenSoftware/simple-release/compare/v1.0.0...v2.0.0) (2025-06-05)

### ⚠ BREAKING CHANGES

* **simple-github-release:** Now node 18 is minimal required version

### Features

* **config:** a simple-release config loader ([97965d2](https://github.com/TrigenSoftware/simple-release/commit/97965d29ab28d40836cf5ef3d5e4e04f908e7037))
* **core:** a simple tool to release projects with monorepo support ([d695be5](https://github.com/TrigenSoftware/simple-release/commit/d695be51e9e0fdf12acfb86a8d0cefe802012271))
* **github-action:** a simple-release api for github action ([#95](https://github.com/TrigenSoftware/simple-release/issues/95)) ([6842da1](https://github.com/TrigenSoftware/simple-release/commit/6842da1a008f9bd921046c1aadf24e3f45eb3a51))
* **github-release:** a github release addon for simple-release ([e648f45](https://github.com/TrigenSoftware/simple-release/commit/e648f45ce2005b2ec90824217951d5f7d152976f))
* **github:** a github addon for simple-release ([71430be](https://github.com/TrigenSoftware/simple-release/commit/71430be20ab9aa680f89d4d36b6dec7f76df4a82))
* **npm:** a npm addon for simple-release ([5cc6e7a](https://github.com/TrigenSoftware/simple-release/commit/5cc6e7a94687f480a315becd8d1d3fd10e8ec08a))
* **pnpm:** a pnpm addon for simple-release ([17606de](https://github.com/TrigenSoftware/simple-release/commit/17606de0172cccac9d5227036c8594284a59f102))
* **simple-github-release:** add tag cli option ([9cf268f](https://github.com/TrigenSoftware/simple-release/commit/9cf268f22fe8a68055be213b211d8268ce69a3f3))
* **simple-github-release:** drop git-url-parse dependency in favor of @simple-libs/hosted-git-info ([f022984](https://github.com/TrigenSoftware/simple-release/commit/f02298413e0b9c084a6d3579bc474a7364dda5cc))
* **simple-github-release:** upgrade node minimal version to 18 ([#82](https://github.com/TrigenSoftware/simple-release/issues/82)) ([c248fba](https://github.com/TrigenSoftware/simple-release/commit/c248fba43f1d5fe6a296711af88bcf4370a7fc3e))

### Bug Fixes

* badge url in readme ([2ac1202](https://github.com/TrigenSoftware/simple-release/commit/2ac12021d4d90e67133841645321525ef6a3716d))
* **deps:** update dependency @octokit/rest to v19 ([#24](https://github.com/TrigenSoftware/simple-release/issues/24)) ([bd8ee16](https://github.com/TrigenSoftware/simple-release/commit/bd8ee168cd9f978a4489d858f44e736eeef9d024))
* **deps:** update dependency @octokit/rest to v20 ([#43](https://github.com/TrigenSoftware/simple-release/issues/43)) ([a71db82](https://github.com/TrigenSoftware/simple-release/commit/a71db82a2fe70163b0e992a3c38769ca09129c34))
* **deps:** update dependency git-url-parse to v13 ([#31](https://github.com/TrigenSoftware/simple-release/issues/31)) ([0dcfdc4](https://github.com/TrigenSoftware/simple-release/commit/0dcfdc43b3b41328c80e413c40b6eccff03216e8))
* **deps:** update dependency lilconfig to v3 ([#60](https://github.com/TrigenSoftware/simple-release/issues/60)) ([b475e8f](https://github.com/TrigenSoftware/simple-release/commit/b475e8f9d9ae439c07c48248e7ae891e609436ca))
* **deps:** update dependency open to v10 ([#66](https://github.com/TrigenSoftware/simple-release/issues/66)) ([d14c94b](https://github.com/TrigenSoftware/simple-release/commit/d14c94b464ec50c4b31b6cdf3b1a45fcb399da73))
* **deps:** update dependency open to v9 ([#37](https://github.com/TrigenSoftware/simple-release/issues/37)) ([fe212fb](https://github.com/TrigenSoftware/simple-release/commit/fe212fb4ff0179455959d84ccccdc828e778f61b))
