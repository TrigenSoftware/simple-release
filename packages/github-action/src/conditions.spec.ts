import { join } from 'path'
import fs from 'fs/promises'
import {
  describe,
  it,
  expect
} from 'vitest'
import type { getOctokit } from '@actions/github'
import { PackageJsonProject } from '@simple-release/core'
import {
  createDirectory,
  packageJsonProject
} from 'test'
import { ReleaserGithubAction } from './releaser.js'
import { ifReleaseCommit } from './conditions.js'

const octokit = {} as ReturnType<typeof getOctokit>

describe('github-action', () => {
  describe('conditions', () => {
    describe('ifReleaseCommit', () => {
      it('should detect release commit in a shallow clone', async () => {
        const { cwd, run } = await packageJsonProject(
          {
            name: 'unreleased-commit-project'
          },
          {
            postReleaseCommits: false
          }
        )

        await run([
          ({ cwd }) => fs.writeFile(
            join(cwd, 'package.json'),
            JSON.stringify({
              name: 'unreleased-commit-project',
              version: '2.1.0'
            })
          ),
          ({ git }) => git.add('package.json'),
          ({ git }) => git.commit({
            message: 'chore(release): 2.1.0'
          })
        ])

        const cloneCwd = await createDirectory('unreleased-commit-clone')
        const project = new PackageJsonProject({
          path: join(cloneCwd, 'package.json')
        })
        const releaser = new ReleaserGithubAction({
          project,
          octokit,
          silent: true
        })

        // Clone the repository like actions/checkout does by default: depth 1 and no tags.
        await project.gitClient.exec('clone', '--depth', '1', '--no-tags', `file://${cwd}`, '.')

        expect(await ifReleaseCommit(releaser)).toBe(true)
      })

      it('should not treat already released commit as a new release', async () => {
        const { cwd, run } = await packageJsonProject(
          {
            name: 'released-commit-project'
          },
          {
            postReleaseCommits: false
          }
        )

        await run([
          ({ cwd }) => fs.writeFile(
            join(cwd, 'package.json'),
            JSON.stringify({
              name: 'released-commit-project',
              version: '2.1.0'
            })
          ),
          ({ git }) => git.add('package.json'),
          ({ git }) => git.commit({
            message: 'chore(release): 2.1.0'
          }),
          ({ git }) => git.tag({
            name: 'v2.1.0'
          })
        ])

        const cloneCwd = await createDirectory('released-commit-clone')
        const project = new PackageJsonProject({
          path: join(cloneCwd, 'package.json')
        })
        const releaser = new ReleaserGithubAction({
          project,
          octokit,
          silent: true
        })

        await project.gitClient.exec('clone', '--depth', '1', '--no-tags', `file://${cwd}`, '.')

        expect(await ifReleaseCommit(releaser)).toBe(false)
      })

      it('should not fetch tags for a non-release commit', async () => {
        const { cwd } = await packageJsonProject({
          name: 'non-release-commit-project'
        })
        const cloneCwd = await createDirectory('non-release-commit-clone')
        const project = new PackageJsonProject({
          path: join(cloneCwd, 'package.json')
        })
        const releaser = new ReleaserGithubAction({
          project,
          octokit,
          silent: true
        })

        await project.gitClient.exec('clone', '--depth', '1', '--no-tags', `file://${cwd}`, '.')
        // Break the remote to ensure no fetch is attempted before the commit message check.
        await project.gitClient.exec('remote', 'set-url', 'origin', 'file:///nonexistent')

        expect(await ifReleaseCommit(releaser)).toBe(false)
      })
    })
  })
})
