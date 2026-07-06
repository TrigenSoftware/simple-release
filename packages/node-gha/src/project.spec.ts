import { join } from 'path'
import fs from 'fs/promises'
import {
  describe,
  expect,
  it
} from 'vitest'
import {
  createDirectory,
  dummyCommit,
  forkProject,
  packageJsonProject
} from 'test'
import { NodeGhaProject } from './project.js'

describe('node-gha', () => {
  describe('project', () => {
    describe('getLastReleaseTag', () => {
      it('should find last release tag despite bundled release commits', async () => {
        const { cwd, run } = await forkProject('node-gha-last-release-tag', packageJsonProject({
          name: 'node-gha-last-release-tag-project',
          version: '2.0.0',
          files: [
            'dist'
          ]
        }))
        const remote = await createDirectory('node-gha-last-release-tag-remote')
        const project = new NodeGhaProject({
          path: join(cwd, 'package.json')
        })

        await run([
          ({ git }) => git.exec('-C', remote, 'init', '--bare'),
          ({ git }) => git.exec('remote', 'set-url', 'origin', remote),
          ({ cwd }) => fs.writeFile(
            join(cwd, 'package.json'),
            JSON.stringify({
              name: 'node-gha-last-release-tag-project',
              version: '3.0.0',
              files: [
                'dist'
              ]
            })
          ),
          ({ git }) => git.add('package.json'),
          ({ git }) => git.commit({
            message: 'chore(release): 3.0.0'
          }),
          ({ cwd }) => fs.mkdir(join(cwd, 'dist'), {
            recursive: true
          }),
          ({ cwd }) => fs.writeFile(join(cwd, 'dist/index.js'), 'built\n')
        ])

        await project.publish()

        await run([ctx => dummyCommit(ctx, 'fix')])

        expect(await project.getLastReleaseTag()).toBe('v3.0.0')

        await project.bump()

        const [versionUpdate] = project.versionUpdates

        expect(versionUpdate.to).toBe('3.0.1')
        expect(versionUpdate.notes).toContain('commit message for fix')
        expect(versionUpdate.notes).not.toContain('commit message for feat')
      })

      it('should find last release tag for a maintenance branch', async () => {
        const { cwd, run } = await forkProject('node-gha-maintenance-tag', packageJsonProject({
          name: 'node-gha-maintenance-tag-project',
          version: '2.0.0',
          files: [
            'dist'
          ]
        }))
        const remote = await createDirectory('node-gha-maintenance-tag-remote')
        const project = new NodeGhaProject({
          path: join(cwd, 'package.json')
        })

        await run([
          ({ git }) => git.exec('-C', remote, 'init', '--bare'),
          ({ git }) => git.exec('remote', 'set-url', 'origin', remote),
          ({ cwd }) => fs.writeFile(
            join(cwd, 'package.json'),
            JSON.stringify({
              name: 'node-gha-maintenance-tag-project',
              version: '3.0.0',
              files: [
                'dist'
              ]
            })
          ),
          ({ git }) => git.add('package.json'),
          ({ git }) => git.commit({
            message: 'chore(release): 3.0.0'
          }),
          ({ cwd }) => fs.mkdir(join(cwd, 'dist'), {
            recursive: true
          }),
          ({ cwd }) => fs.writeFile(join(cwd, 'dist/index.js'), 'built\n')
        ])

        await project.publish()

        await run([({ git }) => git.exec('checkout', '-b', 'v2-maintenance', 'v2.0.0')])

        expect(await project.getLastReleaseTag()).toBe('v2.0.0')
      })
    })
  })
})
