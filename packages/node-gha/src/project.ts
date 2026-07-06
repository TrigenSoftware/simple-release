import {
  type PackageJsonProjectOptions,
  type ProjectBumpOptions,
  type ProjectReleaseOptions,
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
  private async isReachableFromHead(ref: string) {
    try {
      await this.gitClient.exec('merge-base', '--is-ancestor', ref, 'HEAD')
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the last release tag for the project.
   * GitHub Action release tags point to bundled commits in the release branches
   * and are not reachable from the source branch, so all refs are walked
   * and tags are matched to the current branch by their parent commits.
   * @param options - The options to use for getting the tag.
   * @returns The last release tag, `null` if not found.
   */
  override async getLastReleaseTag(options: ProjectReleaseOptions = {}) {
    const { tagPrefix = 'v' } = options
    const tags = this.gitClient.getSemverTags({
      prefix: tagPrefix,
      all: true
    })

    for await (const tag of tags) {
      // A bundled release commit is amended from the release commit in the source branch,
      // so the tag itself or its parent should be reachable from the current branch.
      if (
        await this.isReachableFromHead(tag)
        || await this.isReachableFromHead(`${tag}^`)
      ) {
        return tag
      }
    }

    return null
  }

  override async publish(options: NodeGhaProjectPublishOptions = {}): Promise<void> {
    if (options.skip) {
      options.logger?.info('Skipping publish')
      return
    }

    await publish(this, options)
  }
}
