import { join } from 'path'
import fs from 'fs/promises'
import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import type { getOctokit } from '@actions/github'
import { PnpmProject } from '@simple-release/pnpm'
import {
  createDirectory,
  packageJsonProject
} from 'test'
import { ReleaserGithubAction } from './releaser.js'

const octokit = {} as ReturnType<typeof getOctokit>

describe('github-action', () => {
  describe('releaser', () => {
    describe('runSnapshotAction', () => {
      it('should publish snapshot version from a shallow clone', async () => {
        const { cwd } = await packageJsonProject({
          name: 'snapshot-action-project'
        })
        const cloneCwd = await createDirectory('snapshot-action-clone')
        const project = new PnpmProject({
          path: join(cloneCwd, 'package.json')
        })
        const writeVersion = vi.spyOn(project.manifest, 'writeVersion')
        const releaser = new ReleaserGithubAction({
          project,
          octokit,
          silent: true
        })
          .setOptions({
            publish: {
              skip: true
            }
          })

        // Clone the repository like actions/checkout does by default: depth 1 and no tags.
        await project.gitClient.exec('clone', '--depth', '1', '--no-tags', `file://${cwd}`, '.')

        await releaser.runSnapshotAction('canary')

        expect(writeVersion.mock.calls[0][0]).toMatch(/^2\.1\.0-canary\.\d{14}$/)

        const packageJson = JSON.parse(
          await fs.readFile(join(cloneCwd, 'package.json'), 'utf-8')
        ) as Record<string, string>

        expect(packageJson.version).toBe('2.0.0')
      })
    })
  })
})
