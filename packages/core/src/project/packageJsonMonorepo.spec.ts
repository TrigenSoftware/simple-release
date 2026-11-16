import fs from 'fs/promises'
import { join } from 'path'
import {
  vi,
  describe,
  it,
  expect
} from 'vitest'
import fg from 'fast-glob'
import {
  packageJsonIndependentMonorepoProject,
  packageJsonFixedMonorepoProject,
  forkProject,
  dummyCommit,
  updateDummyFile
} from 'test'
import type { GetProjectsOptions } from './monorepo.js'
import { Project } from './project.js'
import { PackageJsonMonorepoProject } from './packageJsonMonorepo.js'

async function* getProjects(options: GetProjectsOptions) {
  yield* (await fg(join(options.manifest.projectPath, 'packages', '**', 'package.json'))).sort()
}

async function breakingFixedMonorepoProject(id: string) {
  const ctx = await forkProject(id, packageJsonFixedMonorepoProject())

  await ctx.run([
    ({ cwd }) => updateDummyFile(cwd),
    ({ git }) => git.add('dummy'),
    ({ git }) => git.commit({
      message: 'feat(subproject-2)!: drop deprecated api'
    })
  ], join(ctx.cwd, 'packages', 'subproject-2'))

  return ctx
}

describe('core', () => {
  describe('manifest', () => {
    describe('PackageJsonMonorepoProject', () => {
      describe('independent mode', () => {
        it('should get no tags', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          expect(await project.getTags()).toEqual([])
        })

        it('should get one tag', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject({
            2: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          expect(await project.getTags()).toEqual(['subproject-2@3.0.0'])
        })

        it('should get few tags', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject({
            2: {
              version: '3.0.0'
            },
            3: {
              version: '4.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          expect(await project.getTags()).toEqual(['subproject-2@3.0.0', 'subproject-3@4.0.0'])
        })

        it('should cache projects even when iteration stops early', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          // Stop iterating after the first project: the cache must still resolve
          // so a later call does not hang.
          // oxlint-disable-next-line no-unused-vars
          for await (const _ of project.getProjects()) {
            break
          }

          const names: string[] = []

          for await (const subProject of project.getProjects()) {
            names.push(await subProject.manifest.getName())
          }

          expect(names).toEqual(['subproject-1', 'subproject-2', 'subproject-3'])
        })

        it('should get release data', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })
          const release = await project.getReleaseData()

          expect(release).toEqual([
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'subproject-1: v2.0.0',
              isPrerelease: false,
              isLatest: true
            },
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'subproject-2: v2.0.0',
              isPrerelease: false,
              isLatest: true
            },
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'subproject-3: v2.0.0',
              isPrerelease: false,
              isLatest: true
            }
          ])
        })

        it('should not get some release data', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject({
            2: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })
          const release = await project.getReleaseData()

          expect(release).toEqual([
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'subproject-1: v2.0.0',
              isPrerelease: false,
              isLatest: true
            },
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'subproject-3: v2.0.0',
              isPrerelease: false,
              isLatest: true
            }
          ])
        })

        it('should get maintenance branch refs', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject({
            1: {
              version: '3.0.0'
            },
            2: {
              version: '3.0.0'
            },
            3: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          expect(await project.getMaintenanceBranches()).toEqual([
            {
              from: 'subproject-1@2.0.0',
              to: 'subproject-1@2'
            },
            {
              from: 'subproject-2@2.0.0',
              to: 'subproject-2@2'
            },
            {
              from: 'subproject-3@2.0.0',
              to: 'subproject-3@2'
            }
          ])
        })

        it('should bump version', async () => {
          const { cwd } = await forkProject('bump', packageJsonIndependentMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })
          const projects: Project[] = []

          for await (const subProject of project.getProjects()) {
            projects.push(subProject)
          }

          projects[1].manifest.writeVersion('2.1.0')
          projects[2].manifest.writeVersion('3.0.0')

          const result = await project.bump()

          expect(result).toBe(true)
          expect(project.changedFiles).toMatchObject([
            expect.stringMatching(/subproject-1\/package\.json$/),
            expect.stringMatching(/subproject-1\/CHANGELOG\.md$/),
            expect.stringMatching(/subproject-2\/package\.json$/),
            expect.stringMatching(/subproject-2\/CHANGELOG\.md$/),
            expect.stringMatching(/subproject-3\/package\.json$/),
            expect.stringMatching(/subproject-3\/CHANGELOG\.md$/)
          ])
          expect(project.versionUpdates).toMatchObject([
            {
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[2/)
            },
            {
              from: '2.1.0',
              to: '2.2.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[2/)
            },
            {
              from: '3.0.0',
              to: '3.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[3/)
            }
          ])
        })

        it('should include global and per-project preambles in changelogs', async () => {
          const { cwd } = await forkProject('bump-preamble', packageJsonIndependentMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })
          const result = await project.bump({
            preamble: '## Global heads up',
            byProject: {
              'subproject-2': {
                preamble: '## Subproject two only'
              }
            }
          })

          expect(result).toBe(true)

          const [one, two, three] = project.versionUpdates

          expect(one.notes).toContain('## Global heads up')
          expect(one.notes).not.toContain('## Subproject two only')

          expect(two.notes).toContain('## Subproject two only')
          expect(two.notes).not.toContain('## Global heads up')

          expect(three.notes).toContain('## Global heads up')
        })

        it('should get commit message after bump', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          await project.bump({
            dryRun: true
          })

          const message = project.getCommitMessage()

          expect(message).toBe(`chore(release): monorepo release

- subproject-1@2.1.0
- subproject-2@2.1.0
- subproject-3@2.1.0`)
        })

        it('should get no default publish tag for latest releases', async () => {
          const { cwd } = await packageJsonIndependentMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          expect(await project.getDefaultPublishTag()).toBe(undefined)
        })

        it('should get default publish tag for maintenance release', async () => {
          const { cwd, run } = await forkProject('independent-maintenance-publish-tag', packageJsonIndependentMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'independent',
            root: cwd,
            getProjects
          })

          await run([
            ({ git }) => git.exec('checkout', '-b', 'next-major'),
            ctx => dummyCommit(ctx, 'feat'),
            ({ git }) => git.exec('tag', 'subproject-1@3.0.0'),
            ({ git }) => git.exec('checkout', 'master'),
            ({ git }) => git.exec('branch', '-D', 'next-major')
          ])

          expect(await project.getDefaultPublishTag()).toBe('release-2.x')
        })
      })

      describe('fixed mode', () => {
        it('should get no tags', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          expect(await project.getTags()).toEqual([])
        })

        it('should get one tag', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject({
            0: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          expect(await project.getTags()).toEqual(['v3.0.0'])
        })

        it('should get release data', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const release = await project.getReleaseData()

          expect(release).toEqual([
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: 'v1.0.0',
              nextTag: 'v2.0.0',
              title: 'v2.0.0',
              isPrerelease: false,
              isLatest: true
            }
          ])
        })

        it('should not get release data', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject({
            0: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const release = await project.getReleaseData()

          expect(release).toEqual([])
        })

        it('should get release data with existing tag from changelog without compare links', async () => {
          const { cwd } = await forkProject('fixed-release-data-no-links', packageJsonFixedMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await fs.writeFile(
            join(cwd, 'CHANGELOG.md'),
            '# Changelog\n\n## 2.0.0 (2017-06-20)\n\nRELEASE NOTES\n'
          )

          const release = await project.getReleaseData()

          expect(release).toEqual([
            {
              version: '2.0.0',
              notes: 'RELEASE NOTES',
              previousTag: '',
              nextTag: 'v2.0.0',
              title: 'v2.0.0',
              isPrerelease: false,
              isLatest: true
            }
          ])
        })

        it('should get default publish tag for maintenance release', async () => {
          const { cwd, run } = await forkProject('fixed-maintenance-publish-tag', packageJsonFixedMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await run([
            ({ git }) => git.exec('checkout', '-b', 'next-major'),
            ctx => dummyCommit(ctx, 'feat'),
            ({ git }) => git.exec('tag', 'v3.0.0'),
            ({ git }) => git.exec('checkout', 'master'),
            ({ git }) => git.exec('branch', '-D', 'next-major')
          ])

          expect(await project.getDefaultPublishTag()).toBe('release-2.x')
        })

        it('should get maintenance branch refs', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject({
            0: {
              version: '3.0.0'
            }
          })
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          expect(await project.getMaintenanceBranches()).toEqual([
            {
              from: 'v2.0.0',
              to: 'v2'
            }
          ])
        })

        it('should bump version', async () => {
          const { cwd } = await forkProject('bump', packageJsonFixedMonorepoProject())
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const result = await project.bump()

          expect(result).toBe(true)
          expect(project.changedFiles).toMatchObject([
            expect.stringMatching(/\/package\.json$/),
            expect.stringMatching(/\/CHANGELOG\.md$/),
            expect.stringMatching(/subproject-2\/package\.json$/),
            expect.stringMatching(/subproject-2\/CHANGELOG\.md$/),
            expect.stringMatching(/subproject-3\/package\.json$/),
            expect.stringMatching(/subproject-3\/CHANGELOG\.md$/)
          ])
          expect(project.versionUpdates).toMatchObject([
            {
              name: 'package-json-monorepo-project',
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[2/)
            },
            {
              name: 'subproject-2',
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[2/)
            },
            {
              name: 'subproject-3',
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringMatching(/^## \[2/)
            }
          ])
        })

        it('should get commit message after bump', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await project.bump({
            dryRun: true
          })

          const message = project.getCommitMessage()

          expect(message).toBe('chore(release): 2.1.0')
        })

        it('should bump using base version', async () => {
          const { cwd } = await forkProject('bump', packageJsonFixedMonorepoProject({
            0: {
              version: '4.0.0'
            }
          }))
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          // Projects jump from 2.0.0 to 4.1.0, which is breaking, so projects without changes are kept out explicitly.
          const result = await project.bump({
            force: false
          })

          expect(result).toBe(true)
          expect(project.versionUpdates).toMatchObject([
            {
              name: 'package-json-monorepo-project',
              to: '4.1.0'
            },
            {
              name: 'subproject-2',
              to: '4.1.0'
            },
            {
              name: 'subproject-3',
              to: '4.1.0'
            }
          ])
        })

        it('should bump projects without changes when the release is breaking', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-bump')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const result = await project.bump()

          expect(result).toBe(true)
          expect(project.versionUpdates).toMatchObject([
            {
              name: 'package-json-monorepo-project',
              from: '2.0.0',
              to: '3.0.0'
            },
            {
              name: 'subproject-1',
              from: '2.0.0',
              to: '3.0.0'
            },
            {
              name: 'subproject-2',
              from: '2.0.0',
              to: '3.0.0'
            },
            {
              name: 'subproject-3',
              from: '2.0.0',
              to: '3.0.0'
            }
          ])
        })

        it('should add a note about breaking changes in other packages to projects without changes', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-sync-note')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await project.bump({
            dryRun: true
          })

          expect(project.versionUpdates.find(({ name }) => name === 'subproject-1')?.notes).toContain('Version bump to keep in sync with breaking changes in other packages.')
        })

        it('should keep the preamble of projects without changes when the release is breaking', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-sync-preamble')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await project.bump({
            dryRun: true,
            preamble: 'Release highlights.'
          })

          const notes = project.versionUpdates.find(({ name }) => name === 'subproject-1')?.notes

          expect(notes).toContain('Release highlights.')
          expect(notes).not.toContain('keep in sync')
        })

        it('should add the no-change note to projects without changes when force is enabled', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-sync-force')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })

          await project.bump({
            dryRun: true,
            force: true
          })

          expect(project.versionUpdates.find(({ name }) => name === 'subproject-1')?.notes).toContain('Version bump without any changes.')
        })

        it('should not bump projects without changes when the release is breaking and force is disabled', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-bump-without-force')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const result = await project.bump({
            force: false
          })

          expect(result).toBe(true)
          expect(project.versionUpdates).toMatchObject([
            {
              name: 'package-json-monorepo-project',
              to: '3.0.0'
            },
            {
              name: 'subproject-2',
              to: '3.0.0'
            },
            {
              name: 'subproject-3',
              to: '3.0.0'
            }
          ])
        })

        it('should bump projects without changes when the prerelease is breaking', async () => {
          const { cwd } = await breakingFixedMonorepoProject('fixed-breaking-prerelease')
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const result = await project.bump({
            prerelease: 'alpha'
          })

          expect(result).toBe(true)
          expect(project.versionUpdates).toMatchObject([
            {
              name: 'package-json-monorepo-project',
              to: '3.0.0-alpha.0'
            },
            {
              name: 'subproject-1',
              to: '3.0.0-alpha.0'
            },
            {
              name: 'subproject-2',
              to: '3.0.0-alpha.0'
            },
            {
              name: 'subproject-3',
              to: '3.0.0-alpha.0'
            }
          ])
        })

        it('should bump all projects to the same snapshot version', async () => {
          const { cwd } = await packageJsonFixedMonorepoProject()
          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const { getNextVersion } = Project.prototype

          vi.useFakeTimers({
            toFake: ['Date']
          })
          // The clock moves on after every version computation, as during a slow bump.
          vi.spyOn(Project.prototype, 'getNextVersion').mockImplementation(async function slowGetNextVersion(this: Project, ...args) {
            const version = await getNextVersion.apply(this, args)

            vi.setSystemTime(Date.now() + 1000)

            return version
          })

          try {
            await project.bump({
              snapshot: 'next',
              dryRun: true
            })
          } finally {
            vi.restoreAllMocks()
            vi.useRealTimers()
          }

          expect(new Set(project.versionUpdates.map(({ to }) => to)).size).toBe(1)
        })

        it('should generate release notes for a new project after a fixed release tag', async () => {
          const {
            cwd,
            run
          } = await forkProject(
            'fixed-monorepo-new-project',
            packageJsonFixedMonorepoProject({}, {
              postReleaseCommits: false
            })
          )
          const projectPath = join(cwd, 'packages', 'subproject-4')

          await run([
            () => fs.mkdir(projectPath, {
              recursive: true
            }),
            () => fs.writeFile(
              join(projectPath, 'package.json'),
              JSON.stringify({
                name: 'subproject-4',
                version: '2.0.0',
                description: 'A new subproject of package json monorepo project'
              })
            ),
            ({ git }) => git.add('package.json'),
            ({ git }) => git.commit({
              message: 'feat(subproject-4): add subproject 4'
            })
          ], projectPath)

          const project = new PackageJsonMonorepoProject({
            mode: 'fixed',
            root: cwd,
            getProjects
          })
          const result = await project.bump({
            dryRun: true
          })

          expect(result).toBe(true)
          expect(project.versionUpdates).toEqual(expect.arrayContaining([
            {
              name: 'package-json-monorepo-project',
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringContaining('**subproject-4:** add subproject 4')
            },
            {
              name: 'subproject-4',
              from: '2.0.0',
              to: '2.1.0',
              files: [expect.stringMatching(/package\.json$/)],
              notes: expect.stringContaining('add subproject 4')
            }
          ]))
        })
      })
    })
  })
})
