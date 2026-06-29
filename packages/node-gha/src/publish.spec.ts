import { join } from 'path'
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
