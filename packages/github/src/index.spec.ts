import { join } from 'path'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  dummyCommit,
  forkProject,
  packageJsonProject
} from 'test'
import {
  type LoggerMessage,
  PackageJsonProject,
  Logger
} from '@simple-release/core'
import { GithubHosting } from './index.js'

describe('github', () => {
  describe('GithubHosting', () => {
    it('should run smoke test', async () => {
      const { cwd } = await packageJsonProject()
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const log: LoggerMessage[] = []
      const logger = new Logger({
        verbose: true,
        printer(message) {
          log.push(message)
        }
      })
      const publusher = new GithubHosting({
        token: ''
      })

      await publusher.createRelease({
        project,
        dryRun: true,
        logger: logger.createChild('release')
      })

      const release = log[1].message

      expect(release).toEqual({
        owner: 'TrigenSoftware',
        repo: 'test-repo',
        tag_name: 'v2.0.0',
        name: 'v2.0.0',
        body: 'RELEASE NOTES',
        prerelease: false
      })
    })

    it('should not mark maintenance release as latest', async () => {
      const { cwd, run } = await forkProject('github-maintenance-release', packageJsonProject())
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const log: LoggerMessage[] = []
      const logger = new Logger({
        verbose: true,
        printer(message) {
          log.push(message)
        }
      })
      const publusher = new GithubHosting({
        token: ''
      })

      await run([
        ({ git }) => git.exec('checkout', '-b', 'next-major'),
        ctx => dummyCommit(ctx, 'feat'),
        ({ git }) => git.exec('tag', 'v3.0.0'),
        ({ git }) => git.exec('checkout', 'master'),
        ({ git }) => git.exec('branch', '-D', 'next-major')
      ])

      await publusher.createRelease({
        project,
        dryRun: true,
        logger: logger.createChild('release')
      })

      const release = log[1].message

      expect(release).toEqual({
        owner: 'TrigenSoftware',
        repo: 'test-repo',
        tag_name: 'v2.0.0',
        name: 'v2.0.0',
        body: 'RELEASE NOTES',
        prerelease: false,
        make_latest: 'false'
      })
    })
  })
})
