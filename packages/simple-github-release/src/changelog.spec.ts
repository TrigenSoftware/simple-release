import {
  describe,
  it,
  expect
} from 'vitest'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import { readLastChangesFromStream } from './change-log.js'

const dirname = fileURLToPath(new URL('.', import.meta.url))
const mocks = path.join(dirname, '..', 'test', 'mocks')

describe('simple-github-release', () => {
  describe('changelog', () => {
    describe('readLastChangesFromStream', () => {
      it('should read last changes from file', async () => {
        const stream = fs.createReadStream(path.join(mocks, 'CHANGELOG_0.md'))

        expect(await readLastChangesFromStream(stream)).toMatchInlineSnapshot(`
  [
    "8.0.0-alpha.2",
    "### Bug Fixes

  * **deps:** update dependency dotenv to v11 ([#16](https://github.com/TrigenSoftware/scripts/issues/16)) ([27e4ce7](https://github.com/TrigenSoftware/scripts/commit/27e4ce7414f6d50fec9fe363238d771cf49b4cd7))

  ### Features

  * **browserslist-config:** update queries, add esm queries ([3031c6b](https://github.com/TrigenSoftware/scripts/commit/3031c6b322330be57654bdebc1012bddc20e7972))
  ",
  ]
  `)
      })

      it('should read last changes from file with header', async () => {
        const stream = fs.createReadStream(path.join(mocks, 'CHANGELOG_0.md'))
        const options = {
          includeTitle: true
        }

        expect(await readLastChangesFromStream(stream, options)).toMatchInlineSnapshot(`
  [
    "8.0.0-alpha.2",
    "# [8.0.0-alpha.2](https://github.com/TrigenSoftware/scripts/compare/v8.0.0-alpha.1...v8.0.0-alpha.2) (2022-01-14)

  ### Bug Fixes

  * **deps:** update dependency dotenv to v11 ([#16](https://github.com/TrigenSoftware/scripts/issues/16)) ([27e4ce7](https://github.com/TrigenSoftware/scripts/commit/27e4ce7414f6d50fec9fe363238d771cf49b4cd7))

  ### Features

  * **browserslist-config:** update queries, add esm queries ([3031c6b](https://github.com/TrigenSoftware/scripts/commit/3031c6b322330be57654bdebc1012bddc20e7972))
  ",
  ]
  `)
      })

      it('should split titile without link', async () => {
        const stream = fs.createReadStream(path.join(mocks, 'CHANGELOG_1.md'))

        expect(await readLastChangesFromStream(stream)).toMatchInlineSnapshot(`
  [
    "0.0.1-1",
    "### Bug Fixes

  * **cli:** fix config file loading ([8603c2f](https://github.com/TrigenSoftware/simple-github-release/commit/8603c2fde4aeb53619fae8bb9feba53093f51c65))
  ",
  ]
  `)
      })

      it('should read keep a changelog', async () => {
        const stream = fs.createReadStream(path.join(mocks, 'CHANGELOG_2.md'))

        expect(await readLastChangesFromStream(stream)).toMatchInlineSnapshot(`
          [
            "1.0.0",
            "### Added
          - Version navigation.
          - Links to latest released version in previous versions.
          - "Why keep a changelog?" section.

          ### Changed
          - Start using "changelog" over "change log" since it's the common usage.
          - Start versioning based on the current English version at 0.3.0 to help
          translation authors keep things up-to-date.

          ### Removed
          - Section about "changelog" vs "CHANGELOG".
          ",
          ]
        `)
      })
    })
  })
})
