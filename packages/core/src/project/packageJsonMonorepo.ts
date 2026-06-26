import {
  isAbsolute,
  join
} from 'path'
import { PackageJsonManifest } from '../manifest/index.js'
import type { ProjectPublishOptions } from './project.js'
import { PackageJsonProject } from './packageJson.js'
import {
  type MonorepoProjectOptions,
  type MonorepoMode,
  type GetProjectsOptions,
  MonorepoProject
} from './monorepo.js'

export interface PackageJsonMonorepoProjectOptions extends Omit<MonorepoProjectOptions, 'getProjects' | 'manifest'> {
  mode: MonorepoMode
  /**
   * Root path of the monorepo
   */
  root?: string
  /**
   * Get project manifests in the monorepo.
   */
  getProjects(options: GetProjectsOptions): AsyncIterable<string>
}

/**
 * A package.json based monorepo project.
 */
export class PackageJsonMonorepoProject extends MonorepoProject {
  /**
   * Creates a package.json based monorepo project.
   * @param options
   */
  constructor(options: PackageJsonMonorepoProjectOptions) {
    const {
      root = process.cwd(),
      getProjects
    } = options

    super({
      ...options,
      manifest: new PackageJsonManifest(join(root, PackageJsonManifest.Filename)),
      async* getProjects(options) {
        for await (const path of getProjects(options)) {
          yield new PackageJsonProject({
            path: isAbsolute(path) ? path : join(root, path),
            ...options
          })
        }
      }
    })
  }

  override publish(_options?: ProjectPublishOptions): Promise<void> {
    throw new Error('Publishing a package.json monorepo project is not supported')
  }
}
