import {
  type PackageJsonProjectOptions,
  type ProjectBumpOptions,
  PackageJsonProject
} from '@simple-release/core'
import {
  type PublishOptions,
  publish
} from './publish.js'

export type NpmProjectOptions = PackageJsonProjectOptions

export type NpmProjectBumpOptions = ProjectBumpOptions

export type NpmProjectPublishOptions = Omit<PublishOptions, 'workspaces'>

/**
 * A npm based project that uses package.json for configuration.
 */
export class NpmProject extends PackageJsonProject {
  override async publish(options: NpmProjectPublishOptions = {}): Promise<void> {
    if (options.skip) {
      options.logger?.info('Skipping publish')
      return
    }

    await publish(this, options)
  }
}
