import type {
  CreateReleaseOptions,
  CreatePullRequestOptions
} from './hosting.types.js'

export type * from './hosting.types.js'

/**
 * A base class that represents a git repository hosting service.
 */
export abstract class GitRepositoryHosting {
  /**
   * Creates a new release for the given project.
   * @param options
   */
  abstract createRelease(options: CreateReleaseOptions): Promise<void>

  /**
   * Creates a pull request for the given project.
   * @param options
   */
  abstract createPullRequest(options: CreatePullRequestOptions): Promise<void>
}
