import type { Project } from '../project/project.js'
import type { ChildLogger } from '../logger.js'

export interface ReleaseData {
  version: string
  title: string
  notes: string
  previousTag: string
  nextTag: string
  isPrerelease: boolean
  isLatest: boolean
}

export interface CreateReleaseOptions {
  project: Project
  dryRun?: boolean
  logger?: ChildLogger
}

export interface CreatePullRequestOptions {
  project: Project
  /**
   * Base branch for the pull request.
   */
  to?: string
  /**
   * Head branch for the pull request.
   */
  from?: string
  dryRun?: boolean
  logger?: ChildLogger
}
