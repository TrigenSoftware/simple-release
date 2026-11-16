import fs from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  tmpfile,
  copyMockFile,
  getMockFilePath,
  createDirectory
} from 'test'
import {
  changelogHeader,
  addReleaseNotes,
  extractLastRelease,
  extractLastReleaseFromFile
} from './changelog.js'

async function* stringToIterable(str: string) {
  const lines = str.split('\n')

  for (let i = 0, len = lines.length; i < len; i++) {
    yield await Promise.resolve(lines[i])

    if (i < len - 1) {
      yield '\n'
    }
  }
}

async function createChangelogFile(content: string) {
  const changelogPath = join(await createDirectory('changelog'), 'CHANGELOG.md')

  await fs.writeFile(changelogPath, content)

  return changelogPath
}

// Default chunk size of fs read streams.
const READ_CHUNK_SIZE = 64 * 1024

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

      it('should add release notes to an existing changelog file without version headers', async () => {
        const changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n'
        const tmpChangelogPath = await createChangelogFile(changelog)
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'
        const changes = await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))
        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(changes).toBe(notes)
        expect(content).toBe(`${changelog}\n${notes}`)
      })

      it('should add release notes after the unreleased section', async () => {
        const changelog = '# Changelog\n\n## [Unreleased]\n'
        const tmpChangelogPath = await createChangelogFile(changelog)
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'
        const changes = await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))
        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(changes).toBe(notes)
        expect(content).toBe(`${changelog}\n${notes}`)
      })

      it('should add the changelog header when the existing changelog file is empty', async () => {
        const tmpChangelogPath = await createChangelogFile('')
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'
        const changes = await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))
        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(changes).toBe(notes)
        expect(content).toBe(`${changelogHeader}${notes}`)
      })

      it('should find a version header crossing a read chunk boundary', async () => {
        const title = '# Changelog\n\n'
        // The first version header starts 4 bytes before the end of the first read chunk.
        const intro = `${title}${'x'.repeat(READ_CHUNK_SIZE - 4 - title.length - 1)}\n`
        const releases = '## [1.0.0] - 2023-09-01\n\n- Old release\n\n## [0.9.0] - 2023-08-01\n\n- Older release\n'
        const tmpChangelogPath = await createChangelogFile(`${intro}${releases}`)
        const notes = '## [1.1.0] - 2023-10-01\n\n### Added\n\n- New feature\n'

        await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))

        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(content).toBe(`${intro}${notes}\n${releases}`)
      })

      it('should find a version header on the last line without a line break', async () => {
        const title = '# Changelog\n\n'
        const release = '## [1.0.0] - 2023-09-01'
        const tmpChangelogPath = await createChangelogFile(`${title}${release}`)
        const notes = '## [1.1.0] - 2023-10-01\n\n### Added\n\n- New feature\n'

        await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))

        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(content).toBe(`${title}${notes}\n${release}`)
      })

      it('should keep multibyte characters crossing a read chunk boundary', async () => {
        const title = '# Changelog\n\n'
        const releaseHeader = '## [1.0.0] - 2023-09-01\n\n- '
        // The two bytes of "é" are split between the first and the second read chunks.
        const release = `${releaseHeader}${'x'.repeat(READ_CHUNK_SIZE - 1 - title.length - releaseHeader.length)}é\n`
        const tmpChangelogPath = await createChangelogFile(`${title}${release}`)
        const notes = '## [1.1.0] - 2023-10-01\n\n### Added\n\n- New feature\n'

        await addReleaseNotes(tmpChangelogPath, stringToIterable(notes))

        const content = await fs.readFile(tmpChangelogPath, 'utf-8')

        expect(content).toBe(`${title}${notes}\n${release}`)
      })

      it('should remove the temporary file when the changelog file cannot be read', async () => {
        const dir = await createDirectory('changelog')
        const changelogPath = join(dir, 'CHANGELOG.md')
        const notes = '## [1.0.0] - 2023-10-01\n\n### Added\n\n- Initial release\n'

        // Reading a directory in place of the changelog file fails.
        await fs.mkdir(changelogPath)

        await expect(addReleaseNotes(changelogPath, stringToIterable(notes))).rejects.toThrow()
        expect(await fs.readdir(dir)).toEqual(['CHANGELOG.md'])
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

      it('should extract the last release crossing a read chunk boundary', async () => {
        const header = '# Changelog\n\n## [1.1.0] - 2023-10-01\n\n- '
        // The line with "é" starts in the first read chunk and ends in the second one, "é" bytes are split too.
        const line = `${'x'.repeat(READ_CHUNK_SIZE - 1 - header.length)}é tail`
        const tmpChangelogPath = await createChangelogFile(`${header}${line}\n- Second line\n\n## [1.0.0] - 2023-09-01\n\n- Old release\n`)

        expect(await extractLastReleaseFromFile(tmpChangelogPath)).toMatchObject({
          version: '1.1.0',
          notes: `- ${line}\n- Second line`
        })
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

      it('should join lines split between chunks', async () => {
        const result = await extractLastRelease(Readable.from([
          '## [1.1.0] - 2023-10-01\n\n- New fea',
          'ture\n\n## [1.0.0] - 2023-09-01\n'
        ]))

        expect(result).toMatchObject({
          version: '1.1.0',
          notes: '- New feature'
        })
      })
    })
  })
})
