import fs from 'fs/promises'
import { join } from 'path'
import {
  describe,
  it,
  expect
} from 'vitest'
import fg from 'fast-glob'
import {
  packageJsonIndependentMonorepoProject,
  packageJsonFixedMonorepoProject,
  forkProject
} from 'test'
import type { GetProjectsOptions } from './monorepo.js'
import type { Project } from './project.js'
import { PackageJsonMonorepoProject } from './packageJsonMonorepo.js'

async function* getProjects(options: GetProjectsOptions) {
  yield* (await fg(join(options.manifest.projectPath, 'packages', '**', 'package.json'))).sort()
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
          const result = await project.bump()

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
