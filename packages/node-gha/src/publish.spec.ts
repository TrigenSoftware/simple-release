import { join } from 'path'
import fs from 'fs/promises'
import {
  describe,
  expect,
  it
} from 'vitest'
import {
  createDirectory,
  forkProject,
  packageJsonProject
} from 'test'
import { NodeGhaProject } from './project.js'

function refHash(output: string) {
  return output.split(/\s+/)[0]
}

describe('node-gha', () => {
  describe('publish', () => {
    it('should publish GitHub Action refs from the built latest branch', async () => {
      const { cwd } = await forkProject('node-gha-publish', packageJsonProject({
        version: '2.5.0',
        files: [
          'dist'
        ]
      }))
      const remote = await createDirectory('node-gha-publish-remote')
      const project = new NodeGhaProject({
        path: join(cwd, 'package.json')
      })

      await project.gitClient.exec('-C', remote, 'init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)

      await project.publish({
        build: 'node -e "const fs=require(\'fs\');fs.mkdirSync(\'dist\',{recursive:true});fs.writeFileSync(\'dist/index.js\',\'built\\n\')"'
      })

      const latestRef = await project.gitClient.exec('ls-remote', '--heads', 'origin', 'latest')
      const majorRef = await project.gitClient.exec('ls-remote', '--heads', 'origin', 'v2')
      const tagRef = await project.gitClient.exec('ls-remote', '--tags', 'origin', 'v2.5.0')

      expect(latestRef).toContain('refs/heads/latest')
      expect(majorRef).toContain('refs/heads/v2')
      expect(tagRef).toContain('refs/tags/v2.5.0')
      expect(refHash(latestRef)).toBe(refHash(majorRef))
      expect(refHash(latestRef)).toBe(refHash(tagRef))
      expect(await project.gitClient.exec('show', 'v2.5.0:dist/index.js')).toBe('built')
      expect(await project.gitClient.getCurrentBranch()).toBe('master')
    })

    it('should stage GitHub Action files without build commands', async () => {
      const { cwd } = await forkProject('node-gha-publish-existing-files', packageJsonProject({
        version: '2.5.0',
        files: [
          'dist'
        ]
      }))
      const remote = await createDirectory('node-gha-publish-existing-files-remote')
      const project = new NodeGhaProject({
        path: join(cwd, 'package.json')
      })

      await fs.mkdir(join(cwd, 'dist'), {
        recursive: true
      })
      await fs.writeFile(join(cwd, 'dist/index.js'), 'existing\n')
      await project.gitClient.exec('-C', remote, 'init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)

      await project.publish()

      expect(await project.gitClient.exec('show', 'v2.5.0:dist/index.js')).toBe('existing')
    })

    it('should preserve commit parents when publishing from a shallow clone', async () => {
      const { cwd } = await forkProject('node-gha-publish-shallow-source', packageJsonProject({
        version: '2.5.0',
        files: [
          'dist'
        ]
      }))
      const remote = await createDirectory('node-gha-publish-shallow-remote')
      const cloneRoot = await createDirectory('node-gha-publish-shallow-clone')
      const clonePath = join(cloneRoot, 'repo')
      const sourceProject = new NodeGhaProject({
        path: join(cwd, 'package.json')
      })

      await sourceProject.gitClient.exec('-C', remote, 'init', '--bare')
      await sourceProject.gitClient.exec('remote', 'set-url', 'origin', remote)
      await sourceProject.gitClient.push('master', {
        verify: false
      })
      await sourceProject.gitClient.exec('clone', '--depth', '1', `file://${remote}`, clonePath)

      const project = new NodeGhaProject({
        path: join(clonePath, 'package.json')
      })

      await project.gitClient.setConfig('user.name', 'Tester Testerson')
      await project.gitClient.setConfig('user.email', 'nobody@unknown.test')
      await fs.mkdir(join(clonePath, 'dist'), {
        recursive: true
      })
      await fs.writeFile(join(clonePath, 'dist/index.js'), 'shallow\n')

      await project.publish()

      const latestCommit = await project.gitClient.exec('rev-list', '--parents', '-n', '1', 'latest')

      expect(latestCommit.split(/\s+/).length).toBeGreaterThan(1)
      expect(await project.gitClient.exec('show', 'v2.5.0:dist/index.js')).toBe('shallow')
    })

    it('should use custom ref names and explicit files', async () => {
      const { cwd } = await forkProject('node-gha-publish-custom-refs', packageJsonProject({
        version: '3.0.0'
      }))
      const remote = await createDirectory('node-gha-publish-custom-refs-remote')
      const project = new NodeGhaProject({
        path: join(cwd, 'package.json')
      })

      await project.gitClient.exec('-C', remote, 'init', '--bare')
      await project.gitClient.exec('remote', 'set-url', 'origin', remote)

      await project.publish({
        latestBranch: 'stable',
        majorBranchPrefix: 'release-',
        tagPrefix: 'action-v',
        build: 'node -e "const fs=require(\'fs\');fs.mkdirSync(\'lib\',{recursive:true});fs.writeFileSync(\'lib/action.js\',\'custom\\n\')"',
        files: [
          'lib/action.js'
        ]
      })

      const latestRef = await project.gitClient.exec('ls-remote', '--heads', 'origin', 'stable')
      const majorRef = await project.gitClient.exec('ls-remote', '--heads', 'origin', 'release-3')
      const tagRef = await project.gitClient.exec('ls-remote', '--tags', 'origin', 'action-v3.0.0')

      expect(latestRef).toContain('refs/heads/stable')
      expect(majorRef).toContain('refs/heads/release-3')
      expect(tagRef).toContain('refs/tags/action-v3.0.0')
      expect(refHash(latestRef)).toBe(refHash(majorRef))
      expect(refHash(latestRef)).toBe(refHash(tagRef))
      expect(await project.gitClient.exec('show', 'action-v3.0.0:lib/action.js')).toBe('custom')
    })
  })
})
