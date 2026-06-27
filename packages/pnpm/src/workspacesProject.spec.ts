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
import { PnpmWorkspacesProject } from './workspacesProject.js'

describe('pnpm', () => {
  describe('PnpmWorkspacesProject', () => {
    it('should parse workspaces from pnpm-workspace.yaml', async () => {
      const { cwd } = await forkProject('pnpm-workspaces', packageJsonIndependentMonorepoProject())

      await fs.writeFile(join(cwd, 'pnpm-workspace.yaml'), `packages:
  - packages/subproject-1
  - packages/subproject-2
  - packages/subproject-3
`)

      const project = new PnpmWorkspacesProject({
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
