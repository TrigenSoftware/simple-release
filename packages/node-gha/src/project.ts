import {
  type PackageJsonProjectOptions,
  type ProjectBumpOptions,
  PackageJsonProject
} from '@simple-release/core'
import {
  type PublishOptions,
  publish
} from './publish.js'

export type NodeGhaProjectOptions = PackageJsonProjectOptions

export type NodeGhaProjectBumpOptions = ProjectBumpOptions

export type NodeGhaProjectPublishOptions = PublishOptions

/**
 * A Node.js GitHub Actions project that publishes version refs to git branches and tags.
 */
export class NodeGhaProject extends PackageJsonProject {
  override async publish(options: NodeGhaProjectPublishOptions = {}): Promise<void> {
    if (options.skip) {
      options.logger?.info('Skipping publish')
      return
    }

    await publish(this, options)
  }
}
