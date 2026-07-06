import fs from 'fs/promises'
import { join } from 'path'
import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import { GitClient } from '@conventional-changelog/git-client'
import { firstFromStream } from '@simple-libs/stream-utils'
import {
  createDirectory,
  dummyCommit,
  forkProject,
  packageJsonProject
} from 'test'
import { PackageJsonProject } from './project/packageJson.js'
import { Releaser } from './releaser.js'

describe('core', () => {
  describe('releaser', () => {
    it('should run smoke test', async () => {
      const { cwd } = await packageJsonProject()
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .bump()
        .commit()
        .tag()

      await releaser.run()

      const commit = await firstFromStream(
        project.gitClient.getCommits()
      )
      const tag = await project.gitClient.getLastTag()
      const packageJson = JSON.parse(
        await fs.readFile(join(cwd, 'package.json'), 'utf-8')
      )

      expect(commit).toMatchObject({
        header: 'chore(release): 2.1.0'
      })
      expect(tag).toBe('v2.1.0')
      expect(packageJson.version).toBe('2.1.0')
    })

    it('should revert version updates', async () => {
      const { cwd } = await forkProject('revert', packageJsonProject({
        name: 'revert-package-json-project'
      }))
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .bump({
          as: 'patch',
          skipChangelog: true
        })
        .revert()

      await releaser.run()

      const packageJson = JSON.parse(
        await fs.readFile(join(cwd, 'package.json'), 'utf-8')
      )

      expect(packageJson.version).toBe('2.0.0')
      expect(project.changedFiles).toEqual([])
      expect(project.versionUpdates).toEqual([])
    })

    it('should set git user configuration', async () => {
      const { cwd } = await forkProject('set-user', packageJsonProject())
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .setUser({
          username: 'Release Bot',
          email: 'release-bot@example.com'
        })

      await releaser.run()

      expect(await project.gitClient.getConfig('user.name')).toBe('Release Bot')
      expect(await project.gitClient.getConfig('user.email')).toBe('release-bot@example.com')
    })

    it('should create maintenance branches', async () => {
      const { cwd } = await forkProject('maintenance-branch', packageJsonProject({
        version: '3.0.0'
      }))
      const remote = await createDirectory('maintenance-branch-remote')
      const remoteGit = new GitClient(remote)
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .maintenanceBranch({
          enabled: true
        })

      await remoteGit.exec('init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)
      await releaser.run()

      expect(await project.gitClient.verify('refs/heads/v2', true)).not.toBe('')
      expect(await project.gitClient.exec('ls-remote', '--heads', 'origin', 'v2')).toContain('refs/heads/v2')
    })

    it('should skip existing remote maintenance branches', async () => {
      const { cwd } = await forkProject('maintenance-branch-remote', packageJsonProject({
        version: '3.0.0'
      }))
      const remote = await createDirectory('maintenance-branch-existing-remote')
      const remoteGit = new GitClient(remote)
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .maintenanceBranch({
          enabled: true
        })

      await remoteGit.exec('init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)
      await project.gitClient.exec('branch', '--', 'v2', 'v2.0.0')
      await project.gitClient.push('v2', {
        verify: false
      })
      await project.gitClient.deleteBranch('v2')

      await releaser.run()

      expect(await project.gitClient.verify('refs/heads/v2', true)).toBe('')
      expect(await project.gitClient.exec('ls-remote', '--heads', 'origin', 'v2')).toContain('refs/heads/v2')
    })

    it('should create maintenance branches with custom branch prefix', async () => {
      const { cwd } = await forkProject('maintenance-branch-prefix', packageJsonProject({
        version: '3.0.0'
      }))
      const remote = await createDirectory('maintenance-branch-prefix-remote')
      const remoteGit = new GitClient(remote)
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .maintenanceBranch({
          enabled: true,
          branchPrefix: 'maintenance-v'
        })

      await remoteGit.exec('init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)
      await releaser.run()

      expect(await project.gitClient.verify('refs/heads/maintenance-v2', true)).not.toBe('')
      expect(await project.gitClient.exec('ls-remote', '--heads', 'origin', 'maintenance-v2')).toContain('refs/heads/maintenance-v2')
    })

    it('should not create maintenance branches by default', async () => {
      const { cwd } = await forkProject('maintenance-branch-disabled', packageJsonProject({
        version: '3.0.0'
      }))
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const releaser = new Releaser({
        project,
        silent: true
      })
        .maintenanceBranch()

      await releaser.run()

      expect(await project.gitClient.verify('refs/heads/v2', true)).toBe('')
    })

    it('should publish latest release without npm tag', async () => {
      const { cwd } = await packageJsonProject()
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const publish = vi.spyOn(project, 'publish').mockResolvedValue()
      const releaser = new Releaser({
        project,
        silent: true
      })
        .publish()

      await releaser.run()

      expect(publish.mock.calls[0][0]).toMatchObject({
        tag: undefined
      })
    })

    it('should publish maintenance release with major npm tag', async () => {
      const { cwd, run } = await forkProject('publish-maintenance-tag', packageJsonProject())
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const publish = vi.spyOn(project, 'publish').mockResolvedValue()

      await run([
        ({ git }) => git.exec('checkout', '-b', 'next-major'),
        ctx => dummyCommit(ctx, 'feat'),
        ({ git }) => git.exec('tag', 'v3.0.0'),
        ({ git }) => git.exec('checkout', 'master'),
        ({ git }) => git.exec('branch', '-D', 'next-major')
      ])

      const releaser = new Releaser({
        project,
        silent: true
      })
        .publish()

      await releaser.run()

      expect(publish.mock.calls[0][0]).toMatchObject({
        tag: 'release-2.x'
      })
    })

    it('should publish prerelease with prerelease npm tag', async () => {
      const { cwd } = await packageJsonProject({
        name: 'publish-prerelease-tag-project',
        version: '2.1.0-alpha.0'
      })
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const publish = vi.spyOn(project, 'publish').mockResolvedValue()
      const releaser = new Releaser({
        project,
        silent: true
      })
        .publish()

      await releaser.run()

      expect(publish.mock.calls[0][0]).toMatchObject({
        tag: 'alpha'
      })
    })

    it('should publish with explicit npm tag', async () => {
      const { cwd, run } = await forkProject('publish-explicit-tag', packageJsonProject())
      const project = new PackageJsonProject({
        path: join(cwd, 'package.json')
      })
      const publish = vi.spyOn(project, 'publish').mockResolvedValue()

      await run([
        ({ git }) => git.exec('tag', 'v3.0.0')
      ])

      const releaser = new Releaser({
        project,
        silent: true
      })
        .publish({
          tag: 'custom'
        })

      await releaser.run()

      expect(publish.mock.calls[0][0]).toMatchObject({
        tag: 'custom'
      })
    })
  })
})
