import fs from 'fs/promises'
import { join } from 'path'
import {
  describe,
  it,
  expect
} from 'vitest'
import { firstFromStream } from '@simple-libs/stream-utils'
import { packageJsonProject } from 'test'
import { PackageJsonProject } from './project/packageJson.js'
import { Releaser } from './releaser.js'

describe('core', () => {
  describe('releaser', () => {
    it('should run smoke test', async () => {
      const path = await packageJsonProject()
      const project = new PackageJsonProject({
        path: join(path, 'package.json')
      })
      const releaser = new Releaser(project, {
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
        await fs.readFile(join(path, 'package.json'), 'utf-8')
      )

      expect(commit).toMatchObject({
        header: 'chore(release): 2.1.0'
      })
      expect(tag).toBe('v2.1.0')
      expect(packageJson.version).toBe('2.1.0')
    })
  })
})
