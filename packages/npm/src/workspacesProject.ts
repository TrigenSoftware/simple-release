/* oxlint-disable typescript/no-use-before-define */
import fg from 'fast-glob'
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

interface NpmWorkspacesConfig {
  packages?: string[]
}

async function getPackagesGlobPatterns(manifest: Promise<Record<string, unknown>>) {
  const workspaces = (await manifest).workspaces as string[] | NpmWorkspacesConfig | undefined

  return Array.isArray(workspaces)
    ? workspaces
    : workspaces?.packages
}

async function* getProjects(options: GetProjectsOptions) {
  const { projectPath } = options.manifest
  const packagesGlobPatterns = await getPackagesGlobPatterns(
    options.manifest.readManifest()
  )

  if (packagesGlobPatterns) {
    for (const globPattern of packagesGlobPatterns) {
      const packages = fg.stream(globPattern.replace(/\/?$/, `/${PackageJsonManifest.Filename}`), {
        cwd: projectPath,
        ignore: NpmWorkspacesProject.GlobIgnore
      })

      for await (const packagePath of packages) {
        yield packagePath.toString()
      }
    }
  }
}

/**
 * A npm workspaces based monorepo project that uses package.json for configuration.
 */
export class NpmWorkspacesProject extends PackageJsonMonorepoProject {
  static GlobIgnore = ['**/node_modules/**']

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
