import fs from 'fs/promises'
import { join } from 'path'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  toArray,
  packageJsonIndependentMonorepoProject,
  forkProject
} from 'test'
import { NpmWorkspacesProject } from './workspacesProject.js'

describe('npm', () => {
  describe('NpmWorkspacesProject', () => {
    it('should parse workspaces from package.json', async () => {
      const { cwd } = await forkProject('npm-workspaces', packageJsonIndependentMonorepoProject())
      const pkgJsonContent = await fs.readFile(join(cwd, 'package.json'), 'utf-8')
      const pkgJson = JSON.parse(pkgJsonContent)

      pkgJson.workspaces = [
        'packages/subproject-1',
        'packages/subproject-2',
        'packages/subproject-3'
      ]

      await fs.writeFile(join(cwd, 'package.json'), JSON.stringify(pkgJson))

      const project = new NpmWorkspacesProject({
        mode: 'independent',
        root: cwd
      })
      const workspaces = await toArray(project.getProjects())

      expect(workspaces).toMatchObject([
        expect.objectContaining({
          manifest: expect.objectContaining({
            manifestPath: expect.stringContaining('packages/subproject-1/package.json')
          })
        }),
        expect.objectContaining({
          manifest: expect.objectContaining({
            manifestPath: expect.stringContaining('packages/subproject-2/package.json')
          })
        }),
        expect.objectContaining({
          manifest: expect.objectContaining({
            manifestPath: expect.stringContaining('packages/subproject-3/package.json')
          })
        })
      ])
    })
  })
})
