import type { PresetParams } from 'conventional-changelog-preset-loader'
import type { ConventionalGitClient } from '@conventional-changelog/git-client'
import type { ReleaseType } from 'semver'
import type {
  ProjectManifestVersionUpdate,
  ProjectManifest
} from '../manifest/index.js'
import type { ChildLogger } from '../logger.js'

export interface ProjectVersionUpdate extends ProjectManifestVersionUpdate {
  notes: string
}

export interface ProjectOptions {
  /**
   * The manifest of the project.
   */
  manifest: ProjectManifest
  /**
   * Hook function to compose the manifest.
   * @param manifest - The manifest to compose.
   */
  compose?(manifest: ProjectManifest): ProjectManifest
  /**
   * The path to the changelog file.
   * @default 'CHANGELOG.md'
   */
  changelogFile?: string
  /**
   * The git client used to interact with the repository.
   */
  gitClient?: ConventionalGitClient
}

export interface ProjectBumpOptions {
  /**
   * Force a specific version to bump to.
   * If not provided, the version will be determined based on the commits.
   */
  version?: string
  /**
   * The base version to use for bumping.
   * If not provided, the version will be getted from the manifest.
   */
  baseVersion?: string
  /**
   * The type of release to bump to.
   * If not provided, the version will be determined based on the commits.
   */
  as?: ReleaseType
  /**
   * The pre-release identifier to use.
   */
  prerelease?: string
  /**
   * Whether this is the first release.
   * By default will be auto detected based on tag existence.
   */
  firstRelease?: boolean
  /**
   * Skip bumping.
   */
  skip?: boolean
  /**
   * Ignore that project is private.
   */
  force?: boolean
  preset?: PresetParams
  /**
   * The prefix to use for the tag.
   * @default 'v'
   */
  tagPrefix?: string
  /**
   * Whether to use a dry run.
   * If true, the version will not be written to the manifest file but will be updated in memory.
   */
  dryRun?: boolean
  logger?: ChildLogger
}

export interface ProjectTagsOptions {
  /**
   * The prefix to use for the tag.
   * @default 'v'
   */
  tagPrefix?: string
  /**
   * Whether to verify the tag existence.
   * If true, it will check if the tag already exists in the repository.
   * @default true
   */
  verify?: boolean
}

export interface ProjectReleaseOptions {
  /**
   * The prefix to use for the tag.
   * @default 'v'
   */
  tagPrefix?: string
}

export interface ProjectPublishOptions {
  dryRun?: boolean
  logger?: ChildLogger
  /**
   * Skip publishing.
   */
  skip?: boolean
}
