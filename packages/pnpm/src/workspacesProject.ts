/* eslint-disable @typescript-eslint/no-use-before-define */
import { join } from 'path'
import fg from 'fast-glob'
import ryf from 'read-yaml-file'
import {
  type PackageJsonMonorepoProjectOptions,
  type ProjectBumpOptions,
  type GetProjectsOptions,
  PackageJsonManifest,
  PackageJsonMonorepoProject
} from '@simple-release/core'
import {
  type PublishOptions,
  publish
} from './publish.js'

const readYamlFile = ryf as unknown as <T = Record<string, unknown>>(filePath: string) => Promise<T>

export type PnpmWorkspacesProjectOptions = Omit<PackageJsonMonorepoProjectOptions, 'getProjects'>

export type PnpmWorkspacesProjectBumpOptions = ProjectBumpOptions

export type PnpmWorkspacesProjectPublishOptions = Omit<PublishOptions, 'workspaces'>

async function* getProjects(options: GetProjectsOptions) {
  const { projectPath } = options.manifest
  const workspaceFile = join(projectPath, PnpmWorkspacesProject.WorkspaceFile)
  const packagesGlobPatterns = (await readYamlFile(workspaceFile)).packages as string[] | undefined

  if (packagesGlobPatterns) {
    for (const globPattern of packagesGlobPatterns) {
      const packages = fg.stream(globPattern.replace(/\/?$/, `/${PackageJsonManifest.Filename}`), {
        cwd: projectPath,
        ignore: PnpmWorkspacesProject.GlobIgnore
      })

      for await (const packagePath of packages) {
        yield packagePath.toString()
      }
    }
  }
}

/**
 * A pnpm workspaces based monorepo project that uses package.json and pnpm-workspace.yaml for configuration.
 */
export class PnpmWorkspacesProject extends PackageJsonMonorepoProject {
  static WorkspaceFile = 'pnpm-workspace.yaml'
  static GlobIgnore = ['**/node_modules/**']

  /**
   * Creates a pnpm workspaces based monorepo project.
   * @param options
   */
  constructor(options: PnpmWorkspacesProjectOptions) {
    super({
      ...options,
      getProjects
    })
  }

  override async publish(options: PnpmWorkspacesProjectPublishOptions = {}): Promise<void> {
    if (options.skip) {
      options.logger?.info('Skipping publish')
      return
    }

    await publish(this, {
      ...options,
      workspaces: true
    })
  }
}
