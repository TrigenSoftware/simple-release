import { PackageJsonManifest } from '../manifest/index.js'
import {
  type ProjectOptions,
  type ProjectPublishOptions,
  Project
} from './project.js'

export interface PackageJsonProjectOptions extends Omit<ProjectOptions, 'manifest'> {
  /**
   * Path to the package.json file
   */
  path?: string
}

/**
 * A package.json based project.
 */
export class PackageJsonProject extends Project {
  /**
   * Creates a package.json based project.
   * @param options
   */
  constructor(options: PackageJsonProjectOptions = {}) {
    const { path = PackageJsonManifest.Filename } = options

    super({
      ...options,
      manifest: new PackageJsonManifest(path)
    })
  }

  override publish(_options?: ProjectPublishOptions): Promise<void> {
    throw new Error('Publishing a package.json project is not supported')
  }
}
