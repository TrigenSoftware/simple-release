import fs from 'fs/promises'
import { join } from 'path'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  packageJsonProject,
  forkProject,
  dummyCommit
} from 'test'
import { PackageJsonProject } from './packageJson.js'

describe('core', () => {
  describe('manifest', () => {
    describe('PackageJsonProject', () => {
      it('should get no tags', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.getTags()).toEqual([])
      })

      it('should get tags', async () => {
        const { cwd } = await packageJsonProject({
          version: '3.0.0'
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.getTags()).toEqual(['v3.0.0'])
      })

      it('should get release data', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const release = await project.getReleaseData()

        expect(release).toEqual([
          {
            title: 'v2.0.0',
            version: '2.0.0',
            previousTag: 'v1.0.0',
            nextTag: 'v2.0.0',
            notes: 'RELEASE NOTES',
            isPrerelease: false,
            isLatest: true
          }
        ])
      })

      it('should not get release data', async () => {
        const { cwd } = await packageJsonProject({
          version: '3.0.0'
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const release = await project.getReleaseData()

        expect(release).toEqual([])
      })

      it('should get maintenance branch refs', async () => {
        const { cwd } = await packageJsonProject({
          version: '3.0.0'
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.getMaintenanceBranches()).toEqual([
          {
            from: 'v2.0.0',
            to: 'v2'
          }
        ])
      })

      it('should not get maintenance branch refs for non-major releases', async () => {
        const { cwd } = await packageJsonProject({
          version: '2.1.0'
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.getMaintenanceBranches()).toEqual([])
      })

      it('should get maintenance branch refs with custom branch prefix', async () => {
        const { cwd } = await packageJsonProject({
          version: '3.0.0'
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.getMaintenanceBranches({
          branchPrefix: 'maintenance-v'
        })).toEqual([
          {
            from: 'v2.0.0',
            to: 'maintenance-v2'
          }
        ])
      })

      it('should get next version', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion()

        expect(version).toBe('2.1.0')
      })

      it('should not get next version for private package', async () => {
        const { cwd } = await packageJsonProject({
          private: true
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion()

        expect(version).toBe(null)
      })

      it('should get next version from options', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          version: '3.0.0'
        })

        expect(version).toBe('3.0.0')
      })

      it('should get next version from manifest because of first release', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          firstRelease: true
        })

        expect(version).toBe('2.0.0')
      })

      it('should get next version with given release type', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          as: 'major'
        })

        expect(version).toBe('3.0.0')
      })

      it('should get next prerelease version', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          prerelease: 'alpha'
        })

        expect(version).toBe('2.1.0-alpha.0')
      })

      it('should get next snapshot version from commits', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          snapshot: 'snapshot'
        })

        expect(version).toMatch(/^2\.1\.0-snapshot\.\d{14}$/)
      })

      it('should get next snapshot version with given release type', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          as: 'patch',
          snapshot: 'canary'
        })

        expect(version).toMatch(/^2\.0\.1-canary\.\d{14}$/)
      })

      it('should get next snapshot version for first release', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          firstRelease: true,
          snapshot: 'canary'
        })

        expect(version).toMatch(/^2\.0\.0-canary\.\d{14}$/)
      })

      it('should get next snapshot version from forced version', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          version: '3.0.0',
          snapshot: 'canary'
        })

        expect(version).toMatch(/^3\.0\.0-canary\.\d{14}$/)
      })

      it('should get next snapshot version without new commits', async () => {
        const { cwd } = await packageJsonProject({}, {
          postReleaseCommits: false
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const version = await project.getNextVersion({
          snapshot: 'canary'
        })

        expect(version).toMatch(/^2\.0\.1-canary\.\d{14}$/)
      })

      it('should detect latest release', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        expect(await project.isLatestRelease()).toBe(true)
      })

      it('should not detect maintenance release as latest', async () => {
        const { cwd, run } = await forkProject('maintenance-latest', packageJsonProject())
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        await run([
          ({ git }) => git.exec('checkout', '-b', 'next-major'),
          ctx => dummyCommit(ctx, 'feat'),
          ({ git }) => git.exec('tag', 'v3.0.0'),
          ({ git }) => git.exec('checkout', 'master'),
          ({ git }) => git.exec('branch', '-D', 'next-major')
        ])

        expect(await project.isLatestRelease()).toBe(false)
      })

      it('should ignore prerelease tags while detecting latest release', async () => {
        const { cwd, run } = await forkProject('prerelease-latest', packageJsonProject())
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        await run([
          ({ git }) => git.exec('tag', 'v3.0.0-alpha.0')
        ])

        expect(await project.isLatestRelease()).toBe(true)
      })

      it('should dry bump version', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          dryRun: true
        })

        expect(result).toBe(true)
        expect(project.changedFiles).toMatchObject([expect.stringMatching(/package\.json$/), expect.stringMatching(/CHANGELOG\.md$/)])
        expect(project.versionUpdates).toMatchObject([
          {
            from: '2.0.0',
            to: '2.1.0',
            files: [expect.stringMatching(/package\.json$/)],
            notes: expect.stringMatching(/^## \[2/)
          }
        ])

        expect(await fs.readFile(join(cwd, 'package.json'), 'utf8')).toContain('"version":"2.0.0"')
      })

      it('should bump version', async () => {
        const { cwd } = await forkProject('bump', packageJsonProject())
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump()

        expect(result).toBe(true)
        expect(project.changedFiles).toMatchObject([expect.stringMatching(/package\.json$/), expect.stringMatching(/CHANGELOG\.md$/)])
        expect(project.versionUpdates).toMatchObject([
          {
            from: '2.0.0',
            to: '2.1.0',
            files: [expect.stringMatching(/package\.json$/)],
            notes: expect.stringMatching(/^## \[2/)
          }
        ])

        expect(await fs.readFile(join(cwd, 'package.json'), 'utf8')).toMatch(/"version":"2\.(0\.1|1\.0)"/)
        expect(await fs.readFile(join(cwd, 'CHANGELOG.md'), 'utf8')).toMatch(/## \[2\.(0\.1|1\.0)\]/)
      })

      it('should add placeholder when generated release notes are empty', async () => {
        const { cwd } = await forkProject(
          'bump-empty-notes',
          packageJsonProject({}, {
            postReleaseCommits: false
          })
        )
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          as: 'patch'
        })

        expect(result).toBe(true)
        expect(project.versionUpdates[0].notes).toContain('Version bump without any changes.')
        expect(await fs.readFile(join(cwd, 'CHANGELOG.md'), 'utf8')).toContain('Version bump without any changes.')
      })

      it('should skip changelog generation', async () => {
        const { cwd } = await forkProject(
          'bump-without-changelog',
          packageJsonProject()
        )
        const changelogPath = join(cwd, 'CHANGELOG.md')
        const changelog = await fs.readFile(changelogPath, 'utf8')
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          as: 'patch',
          skipChangelog: true
        })

        expect(result).toBe(true)
        expect(project.changedFiles).toMatchObject([expect.stringMatching(/package\.json$/)])
        expect(project.versionUpdates[0].notes).toBe('')
        expect(await fs.readFile(changelogPath, 'utf8')).toBe(changelog)
      })

      it('should not add placeholder when generated release notes are not empty', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          dryRun: true
        })

        expect(result).toBe(true)
        expect(project.versionUpdates[0].notes).not.toContain('Version bump without any changes.')
      })

      it('should insert the preamble after the version header', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          dryRun: true,
          preamble: '## What\'s new?\n\n- Redesigned website'
        })
        const { notes } = project.versionUpdates[0]

        expect(result).toBe(true)
        expect(notes).toContain('## What\'s new?')
        expect(notes).toContain('- Redesigned website')
        // The preamble sits between the version header and the generated sections.
        expect(notes.indexOf('## [2')).toBeLessThan(notes.indexOf('## What\'s new?'))
        expect(notes.indexOf('## What\'s new?')).toBeLessThan(notes.indexOf('### '))
      })

      it('should replace the no-change placeholder with the preamble', async () => {
        const { cwd } = await packageJsonProject({}, {
          postReleaseCommits: false
        })
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })
        const result = await project.bump({
          dryRun: true,
          as: 'patch',
          preamble: '## Heads up'
        })

        expect(result).toBe(true)
        expect(project.versionUpdates[0].notes).toContain('## Heads up')
        expect(project.versionUpdates[0].notes).not.toContain('Version bump without any changes.')
      })

      it('should get commit message after bump', async () => {
        const { cwd } = await packageJsonProject()
        const project = new PackageJsonProject({
          path: join(cwd, 'package.json')
        })

        await project.bump({
          dryRun: true
        })

        const message = project.getCommitMessage()

        expect(message).toBe('chore(release): 2.1.0')
      })
    })
  })
})
