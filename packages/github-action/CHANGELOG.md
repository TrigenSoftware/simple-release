# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.1.1](https://github.com/TrigenSoftware/simple-release/compare/v3.0.6...v3.1.1) (2026-07-06)

### Bug Fixes

* fetch refs before snapshot bump and always apply snapshot identifier ([#167](https://github.com/TrigenSoftware/simple-release/issues/167)) ([af28eb4](https://github.com/TrigenSoftware/simple-release/commit/af28eb430472af600c992794b69fdb0b4a706c75))

## [3.0.6](https://github.com/TrigenSoftware/simple-release/compare/v3.0.5...v3.0.6) (2026-07-06)

### Bug Fixes

* fetch tags in ifReleaseCommit to not re-release already released commit ([#163](https://github.com/TrigenSoftware/simple-release/issues/163)) ([428966e](https://github.com/TrigenSoftware/simple-release/commit/428966e0d98635c04b56502ea22fc903d1e56383))

## [3.0.3](https://github.com/TrigenSoftware/simple-release/compare/v3.0.2...v3.0.3) (2026-06-29)

### Bug Fixes

* set git user before release flows ([#155](https://github.com/TrigenSoftware/simple-release/issues/155)) ([1690c9c](https://github.com/TrigenSoftware/simple-release/commit/1690c9c501ff10eb692750803d2aa9897d68b3c4))

## [3.0.1](https://github.com/TrigenSoftware/simple-release/compare/v3.0.0...v3.0.1) (2026-06-29)

### Bug Fixes

* stop returning token inputs from action options ([5a419d6](https://github.com/TrigenSoftware/simple-release/commit/5a419d6e119b1aae0773fc293f290f7e60106682))

## [3.0.0](https://github.com/TrigenSoftware/simple-release/compare/v2.4.0...v3.0.0) (2026-06-29)

### ⚠ BREAKING CHANGES

* Node.js 18 and 20 are no longer supported.

### Features

* read release options from action inputs ([ba7f051](https://github.com/TrigenSoftware/simple-release/commit/ba7f051d5db95e3ef445f80d55a05a5acd2421d9))
* require Node.js 22 and pnpm 11 ([4cd6fdf](https://github.com/TrigenSoftware/simple-release/commit/4cd6fdfcd8bc47ebeca25c3d8760ed839c66f51d))
* support maintenance branches ([#150](https://github.com/TrigenSoftware/simple-release/issues/150)) ([25a1820](https://github.com/TrigenSoftware/simple-release/commit/25a18208842b174975452149cb8f84fb801fe886))
* support Node.js GitHub Action releases ([#151](https://github.com/TrigenSoftware/simple-release/issues/151)) ([11a644f](https://github.com/TrigenSoftware/simple-release/commit/11a644f28df545ad60bf04f3f3b152c396a9a660))
* support snapshot releases ([#149](https://github.com/TrigenSoftware/simple-release/issues/149)) ([11ed7de](https://github.com/TrigenSoftware/simple-release/commit/11ed7de88831c33b955729dcf2f82e386c7e17e1))

### Bug Fixes

* update dependency @actions/github to v9 ([#137](https://github.com/TrigenSoftware/simple-release/issues/137)) ([1fb67a4](https://github.com/TrigenSoftware/simple-release/commit/1fb67a4efceaf3dd9294d8ba236ff7a162100f7f))

## [2.2.0](https://github.com/TrigenSoftware/simple-release/compare/v2.1.2...v2.2.0) (2025-06-09)

### Bug Fixes

* fetch fresh tags from remote before tagging ([c3a9c9e](https://github.com/TrigenSoftware/simple-release/commit/c3a9c9e6a5b54c4fdc5fd0c55498ce0cea847c7e))

## [2.0.1](https://github.com/TrigenSoftware/simple-release/compare/v2.0.0...v2.0.1) (2025-06-07)

### Bug Fixes

* consistent type imports ([9253aff](https://github.com/TrigenSoftware/simple-release/commit/9253aff53c9a232661d694f13728217d003fec25))

## [2.0.0](https://github.com/TrigenSoftware/simple-release/compare/v1.0.0...v2.0.0) (2025-06-05)

### Features

* a simple-release api for github action ([#95](https://github.com/TrigenSoftware/simple-release/issues/95)) ([6842da1](https://github.com/TrigenSoftware/simple-release/commit/6842da1a008f9bd921046c1aadf24e3f45eb3a51))
