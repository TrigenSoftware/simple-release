import fs from 'fs/promises'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  tmpfile,
  copyMockFile,
  getMockFilePath
} from 'test'
import {
  changelogHeader,
  addReleaseNotes,
  extractLastRelease,
  extractLastReleaseFromFile
} from './change-log.js'

async function* stringToIterable(str: string) {
  const lines = str.split('\n')

  for (let i = 0, len = lines.length; i < len; i++) {
    yield await Promise.resolve(lines[i])

    if (i < len - 1) {
      yield '\n'
    }
  }
}

describe('core', () => {
  describe('changelog', () => {
    describe('addReleaseNotes', () => {
      it('should create a new changelog file', async () => {
        const tmpChangelogPath = tmpfile('changelog')
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'
        const notesIterator = stringToIterable(notes)

        await addReleaseNotes(tmpChangelogPath, notesIterator)

        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(content.startsWith(`${changelogHeader}${notes}`)).toBe(true)
      })

      it('should add release notes to an existing changelog file', async () => {
        const tmpChangelogPath = await copyMockFile('CHANGELOG_0.md')
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'
        const notesIterator = stringToIterable(notes)

        await addReleaseNotes(tmpChangelogPath, notesIterator)

        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(content).toContain(notes)
      })
    })

    describe('extractLastReleaseFromFile', () => {
      it('should extract the last release from the changelog file', async () => {
        let result = await extractLastReleaseFromFile(getMockFilePath('CHANGELOG_0.md'))

        expect(result).toMatchInlineSnapshot(`
          {
            "nextTag": "v8.0.0-alpha.2",
            "notes": "### Bug Fixes

          * **deps:** update dependency dotenv to v11 ([#16](https://github.com/TrigenSoftware/scripts/issues/16)) ([27e4ce7](https://github.com/TrigenSoftware/scripts/commit/27e4ce7414f6d50fec9fe363238d771cf49b4cd7))

          ### Features

          * **browserslist-config:** update queries, add esm queries ([3031c6b](https://github.com/TrigenSoftware/scripts/commit/3031c6b322330be57654bdebc1012bddc20e7972))",
            "previousTag": "v8.0.0-alpha.1",
            "version": "8.0.0-alpha.2",
          }
        `)

        result = await extractLastReleaseFromFile(getMockFilePath('CHANGELOG_1.md'))

        expect(result).toMatchInlineSnapshot(`
          {
            "nextTag": "v0.0.1-1",
            "notes": "### Bug Fixes

          * **cli:** fix config file loading ([8603c2f](https://github.com/TrigenSoftware/simple-github-release/commit/8603c2fde4aeb53619fae8bb9feba53093f51c65))",
            "previousTag": "v0.0.1-0",
            "version": "0.0.1-1",
          }
        `)

        result = await extractLastReleaseFromFile(getMockFilePath('CHANGELOG_2.md'))

        expect(result).toMatchInlineSnapshot(`
          {
            "nextTag": "",
            "notes": "### Added
          - Version navigation.
          - Links to latest released version in previous versions.
          - "Why keep a changelog?" section.

          ### Changed
          - Start using "changelog" over "change log" since it's the common usage.
          - Start versioning based on the current English version at 0.3.0 to help
          translation authors keep things up-to-date.

          ### Removed
          - Section about "changelog" vs "CHANGELOG".",
            "previousTag": "",
            "version": "1.0.0",
          }
        `)
      })
    })

    describe('extractLastRelease', () => {
      it('should decode tags extracted from the compare link', async () => {
        const result = await extractLastRelease(
          '## [1.1.0](https://github.com/TrigenSoftware/dummy-independent-monorepo/compare/dummy-independent-monorepo-foo%401.0.0...dummy-independent-monorepo-foo%401.1.0) (2026-07-06)\n\nRELEASE NOTES\n'
        )

        expect(result).toMatchObject({
          version: '1.1.0',
          previousTag: 'dummy-independent-monorepo-foo@1.0.0',
          nextTag: 'dummy-independent-monorepo-foo@1.1.0'
        })
      })
    })
  })
})
