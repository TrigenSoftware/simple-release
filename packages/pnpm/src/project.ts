import {
  type PackageJsonProjectOptions,
  type ProjectBumpOptions,
  PackageJsonProject
} from '@simple-release/core'
import {
  type PublishOptions,
  publish
} from './publish.js'

export type PnpmProjectOptions = PackageJsonProjectOptions

export type PnpmProjectBumpOptions = ProjectBumpOptions

export type PnpmProjectPublishOptions = Omit<PublishOptions, 'workspaces'>

/**
 * A pnpm based project that uses package.json for configuration.
 */
export class PnpmProject extends PackageJsonProject {
  override async publish(options: PnpmProjectPublishOptions = {}): Promise<void> {
    if (options.skip) {
      options.logger?.info('Skipping publish')
      return
    }

    await publish(this, options)
  }
}
