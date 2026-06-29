import type {
  GitCommitParams,
  GitTagParams,
  GitPushParams
} from '@conventional-changelog/git-client'
import type { Project } from './project/index.js'
import type { GitRepositoryHosting } from './hosting/index.js'
import type { Logger } from './logger.js'

// oxlint-disable-next-line typescript/no-explicit-any
type AnyFn = (...args: any[]) => any

export type PickOverridableOptions<T extends AnyFn> = Partial<Omit<
  Exclude<Parameters<T>[0], undefined>,
  'dryRun' | 'logger' | 'project'
>>

export interface ReleaserOptions<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting
> {
  /**
   * Target project to release.
   */
  project: P
  /**
   * Git repository hosting service to use for creating releases and pull requests.
   */
  hosting?: G
  dryRun?: boolean
  silent?: boolean
  verbose?: boolean
  logger?: Logger
}

export interface ReleaserCheckoutOptions {
  /**
   * Delete and recreate the branch if it already exists.
   */
  force?: boolean
  /**
   * Force fetch all commits and tags from the remote repository.
   */
  fetch?: boolean
  /**
   * Set git user name configuration.
   */
  username?: string
  /**
   * Set git user email configuration.
   */
  email?: string
}

export type ReleaserCommitOptions = Omit<GitCommitParams, 'verify' | 'files' | 'message'>

export interface ReleaserTagOptions extends Omit<GitTagParams, 'name' | 'message'> {
  /**
   * Fetch fresh tags from the remote repository before tagging.
   */
  fetch?: boolean
}

export interface ReleaserMaintenanceBranchOptions extends Pick<GitPushParams, 'force'> {
  /**
   * Enable maintenance branch creation.
   */
  enabled?: boolean
}

export type ReleaserPushOptions = Omit<GitPushParams, 'verify' | 'tags' | 'followTags'>

export interface ReleaserStepsOptions<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting
> {
  checkout?: {
    branch?: string
  } & ReleaserCheckoutOptions
  bump?: PickOverridableOptions<P['bump']>
  commit?: ReleaserCommitOptions
  maintenanceBranch?: ReleaserMaintenanceBranchOptions
  tag?: ReleaserTagOptions
  push?: ReleaserPushOptions
  publish?: PickOverridableOptions<P['publish']>
  release?: PickOverridableOptions<G['createRelease']>
  pullRequest?: PickOverridableOptions<G['createPullRequest']>
}
