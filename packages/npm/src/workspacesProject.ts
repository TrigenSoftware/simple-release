import { join } from 'path'
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

export type NpmWorkspacesProjectOptions = Omit<PackageJsonMonorepoProjectOptions, 'getProjects'>

export type NpmWorkspacesProjectBumpOptions = ProjectBumpOptions

export type NpmWorkspacesProjectPublishOptions = Omit<PublishOptions, 'workspaces'>

async function* getProjects(options: GetProjectsOptions) {
  const workspaces = (await options.manifest.readManifest()).workspaces as string[] | undefined

  if (workspaces) {
    for (const workspacesPath of workspaces) {
      yield join(workspacesPath, PackageJsonManifest.Filename)
    }
  }
}

/**
 * A npm workspaces based monorepo project that uses package.json for configuration.
 */
export class NpmWorkspacesProject extends PackageJsonMonorepoProject {
  /**
   * Creates a npm workspaces based monorepo project.
   * @param options
   */
  constructor(options: NpmWorkspacesProjectOptions) {
    super({
      ...options,
      getProjects
    })
  }

  override async publish(options: NpmWorkspacesProjectPublishOptions = {}): Promise<void> {
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
