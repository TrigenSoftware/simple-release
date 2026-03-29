# simple-github-release

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/simple-github-release.svg
[npm-url]: https://www.npmjs.com/package/simple-github-release

[node]: https://img.shields.io/node/v/simple-github-release.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/simple-github-release
[deps-url]: https://libraries.io/npm/simple-github-release

[size]: https://packagephobia.com/badge?p=simple-github-release
[size-url]: https://packagephobia.com/result?p=simple-github-release

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/simple-release/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/simple-release/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/simple-release/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/simple-release?branch=main

A simple tool to create GitHub releases. It reads the latest notes from changelog and creates a release on the GitHub repository with them.

## Usage

1. Install

```bash
# pnpm
pnpm add -D simple-github-release
# yarn
yarn add -D simple-github-release
# npm
npm i -D simple-github-release
```

2. Add script to package.json

```json
{
  "scripts": {
    "release": "simple-github-release"
  }
}
```

3. Configure it in package.json

```json
{
  "simple-github-release": {
    "releaseName": "Release ${version}"
  }
}
```

or create `.simple-github-release.js` or `.simple-github-release.json` file

```js
export default {
  releaseName: 'Release ${version}'
}
```

or just add options to script

```json
{
  "scripts": {
    "release": "simple-github-release --ci"
  }
}
```

4. Create a [personal access token](https://github.com/settings/tokens/new?scopes=repo&description=simple-github-release) and make sure the token is available as an environment variable. Or use `browser` option to create release manually. GitHub will be opened in browser with pre-populated fields.

5. Now you can run it!

```bash
pnpm release
```

## Options

| Options | Description | Default |
|---------|-------------|---------|
| titleRegExp | Regular expression to find release title in changelog. Must contain capture group, which will be used to detect release version. As fallback, version will read from package.json. | not required |
| includeTitle | Include release title into release notes. | `false` |
| remoteUrl | GitHub repository remote url. | From local environment. |
| host | Custom API host. | `'github.com'` |
| changelogLocation | Path to read changelog file. | `'CHANGELOG.md'` |
| releaseName | Release name to create. You are able to use some placeholders: `${tag}` - latest git tag name, as fallback will used `'v${version}'`; `${version}` - version. | `'${tag}'` |
| draft | Create release draft. | `false` |
| prerelease | Create pre-release. | `false` |
| auto | Create release with automatically generated notes. Changelog file will be ignored. | `false` |
| browser | Create link to create release in browser. | `!process.env.GITHUB_TOKEN` |
| ci | Do not trigger user interactions. | `false` |

## Why?

Quick comparison with other tools:

- [semantic-release](https://github.com/semantic-release/semantic-release) - this tool is intended to be used in CI. It is hard to use locally;
- [release-it](https://github.com/release-it/release-it) - has [issues with conventional changelog](https://github.com/release-it/conventional-changelog/issues);
- [conventional-github-releaser](https://github.com/conventional-changelog/releaser-tools/tree/master/packages/conventional-github-releaser) - doesn't have fallback to create release in browser.

Also, all these tools generate release notes from commits, simple-github-release reads notes from an already existing changelog file. For example, you can use [standard-version](https://github.com/conventional-changelog/standard-version) to bump version and generate changelog, and then use simple-github-release to create release on GitHub.
