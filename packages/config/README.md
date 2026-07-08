# @simple-release/config

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/@simple-release/config.svg
[npm-url]: https://www.npmjs.com/package/@simple-release/config

[node]: https://img.shields.io/node/v/@simple-release/config.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/@simple-release/config
[deps-url]: https://libraries.io/npm/@simple-release%2Fconfig

[size]: https://packagephobia.com/badge?p=@simple-release/config
[size-url]: https://packagephobia.com/result?p=@simple-release/config

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A simple-release config loader.

## Install

```bash
# pnpm
pnpm add @simple-release/config
# yarn
yarn add @simple-release/config
# npm
npm i @simple-release/config
```

## Usage

This package provides a function to find and load the config file for simple-release.

```js
import { load } from '@simple-release/config'

await load() // Returns config object or null
await load({ config: true }) // Returns config object or throws an error if config is not found
await load({ [propertyName]: true }) // Returns config object with desired property or null or throws an error if property is not set in config
```

## Documentation

For comprehensive guides and API reference, visit the [documentation website](https://simple-release.js.org/js-api/config/).
