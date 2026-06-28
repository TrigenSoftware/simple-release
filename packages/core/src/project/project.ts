import { join } from 'path'
import { ConventionalGitClient } from '@conventional-changelog/git-client'
import { Bumper } from 'conventional-recommended-bump'
import { ConventionalChangelog } from 'conventional-changelog'
import { concatStringStream } from '@simple-libs/stream-utils'
import { parseHostedGitUrl } from '@simple-libs/hosted-git-info'
import semver, { type ReleaseType } from 'semver'
import type { ProjectManifest } from '../manifest/index.js'
import type { ReleaseData } from '../hosting/index.js'
import {
  addReleaseNotes,
  extractLastRelease,
  extractLastReleaseFromFile,
  preamblePartial
} from '../change-log.js'
import {
  getPrereleaseIdentifier,
  getPrereleaseIdentifierBase,
  getReleaseType
} from '../utils.js'
import type {
  ProjectOptions,
  ProjectBumpOptions,
  ProjectVersionUpdate,
  ProjectTagsOptions,
  ProjectReleaseOptions,
  ProjectPublishOptions,
  ProjectRevertOptions
} from './project.types.js'

export type * from './project.types.js'

export const bumpDefaultOptions = {
  preset: {
    name: 'conventionalcommits'
  }
}

/**
 * A base class that represents a project.
 */
export abstract class Project {
  /**
   * The manifest of the project.
   */
  manifest: ProjectManifest
  /**
   * The git client used to interact with the repository.
   */
  gitClient: ConventionalGitClient
  options: ProjectOptions
  /**
   * Changed files after interacting with the project.
   */
  changedFiles: string[] = []
  /**
   * Version updates after interacting with the project.
   */
  versionUpdates: ProjectVersionUpdate[] = []

  /**
   * Creates a new instance of the project.
   * @param options - The options to use for the project.
   */
  constructor(options: ProjectOptions) {
    const {
      manifest,
      compose,
      gitClient = new ConventionalGitClient(manifest.projectPath)
    } = options

    this.options = {
      changelogFile: 'CHANGELOG.md',
      ...options
    }
    this.manifest = compose ? compose(manifest) : manifest
    this.gitClient = gitClient
  }

  /**
   * Get the hosted git information for the project.
   * @returns The hosted git information.
   */
  async getHostedGitInfo() {
    const remote = await this.gitClient.getConfig('remote.origin.url')
    const info = parseHostedGitUrl(remote)

    return info
  }

  /**
   * Get the commit message for the version updates.
   * @returns The commit message.
   */
  getCommitMessage() {
    const { versionUpdates } = this

    if (versionUpdates.length === 0) {
      throw new Error('Nothing to commit')
    }

    return `chore(release): ${versionUpdates[0].to}`
  }

  /**
   * Get new git tags for the version updates.
   * @param options - The options to use for getting the tags.
   * @returns The new git tags.
   */
  async getTags(options: ProjectTagsOptions = {}) {
    const {
      manifest,
      gitClient
    } = this
    const {
      tagPrefix = 'v',
      verify = true
    } = options
    const version = await manifest.getVersion()
    const tag = `${tagPrefix}${version}`

    if (verify) {
      const isTagExists = await gitClient.verify(tag, true)

      if (isTagExists) {
        return []
      }
    }

    return [tag]
  }

  /**
   * Get the release data for the project.
   * @param options - The options to use for getting the release data.
   * @returns The release data.
   */
  async getReleaseData(options: ProjectReleaseOptions = {}): Promise<ReleaseData[]> {
    const {
      manifest,
      versionUpdates
    } = this
    const { changelogFile } = this.options
    const { projectPath } = manifest
    const changelogPath = join(projectPath, changelogFile!)
    const version = await manifest.getVersion()
    const isPrerelease = Boolean(await manifest.getPrereleaseVersion())
    const lastRelease = versionUpdates.length
      ? await extractLastRelease(versionUpdates[0].notes)
      : await extractLastReleaseFromFile(changelogPath)

    if (!lastRelease || lastRelease.version && lastRelease.version !== version) {
      return []
    }

    if (!lastRelease.nextTag) {
      const tags = await this.getTags({
        ...options,
        verify: false
      })

      if (tags.length) {
        [lastRelease.nextTag] = tags
      }
    }

    return [
      {
        ...lastRelease,
        title: `v${version}`,
        version,
        isPrerelease
      }
    ]
  }

  /**
   * Get the next version for the project.
   * @param options - The options to use for getting the next version.
   * @returns The next version.
   */
  async getNextVersion(options: ProjectBumpOptions = {}): Promise<string | null> {
    const {
      gitClient,
      manifest
    } = this

    if (options.skip || !options.forcePrivate && await manifest.isPrivate()) {
      return null
    }

    const { projectPath } = manifest
    const {
      version: forcedVersion,
      baseVersion,
      as,
      prerelease,
      snapshot,
      firstRelease: firstReleaseOption,
      tagPrefix,
      preset = bumpDefaultOptions.preset
    } = options
    let firstRelease = firstReleaseOption

    if (forcedVersion && semver.valid(forcedVersion)) {
      return forcedVersion
    }

    if (typeof firstRelease === 'undefined') {
      firstRelease = !await gitClient.getLastSemverTag({
        path: projectPath,
        prefix: tagPrefix
      })
    }

    const version = baseVersion || await manifest.getVersion()

    if (firstRelease) {
      return version
    }

    let releaseType: ReleaseType | null = null

    if (as) {
      releaseType = as
    } else {
      const bump = await new Bumper(gitClient)
        .loadPreset(preset, _ => import(_))
        .commits({
          path: projectPath
        })
        .tag({
          prefix: tagPrefix
        })
        .bump()

      if ('releaseType' in bump) {
        releaseType = bump.releaseType
      }
    }

    if (!releaseType) {
      return null
    }

    const prereleaseIdentifier = getPrereleaseIdentifier(
      prerelease,
      snapshot
    )
    const nextVersion = semver.inc(
      version,
      getReleaseType(releaseType, version, prereleaseIdentifier),
      prereleaseIdentifier,
      getPrereleaseIdentifierBase(snapshot)
    )

    return nextVersion
  }

  /**
   * Bump the version of the project.
   * @param options - The options to use for bumping the version.
   * @returns Whether the version was bumped.
   */
  async bump(options: ProjectBumpOptions = {}) {
    const nextVersion = await this.getNextVersion(options)

    if (!nextVersion) {
      return false
    }

    const {
      gitClient,
      manifest
    } = this
    const { changelogFile } = this.options
    const {
      tagPrefix,
      preset = bumpDefaultOptions.preset,
      dryRun,
      skipChangelog,
      logger
    } = options
    const { projectPath } = manifest
    const version = await manifest.getVersion()
    const versionUpdate = {
      ...await manifest.writeVersion(nextVersion, dryRun),
      notes: ''
    }

    this.versionUpdates.push(versionUpdate)
    this.changedFiles.push(...versionUpdate.files)

    const changelogPath = join(projectPath, changelogFile!)
    const name = await manifest.getName()

    if (version === nextVersion) {
      logger?.verbose(`${name}: ${nextVersion}`)
    } else {
      logger?.verbose(`${name}: ${version} -> ${nextVersion}`)
    }

    if (!skipChangelog) {
      const notes = new ConventionalChangelog(gitClient)
        .loadPreset(preset, _ => import(_))
        .commits({
          path: projectPath
        })
        .tags({
          prefix: tagPrefix
        })
        .readRepository()
        .context({
          version: nextVersion
        })
        .writer({
          preamblePartial
        })
        .write()

      versionUpdate.notes = dryRun
        ? await concatStringStream(notes)
        : await addReleaseNotes(changelogPath, notes)

      logger?.verbose(`Release notes:\n\n${versionUpdate.notes}`)

      this.changedFiles.push(changelogPath)
    }

    return true
  }

  /**
   * Revert version updates.
   * @param options - The options to use for reverting.
   * @returns Whether version updates were reverted.
   */
  async revert(
    options: ProjectRevertOptions = {},
    filesSet: Set<string> = new Set()
  ) {
    const {
      manifest,
      versionUpdates
    } = this
    const {
      dryRun,
      logger
    } = options

    if (!versionUpdates.length) {
      return false
    }

    for (const update of versionUpdates) {
      logger?.verbose(`Reverting ${update.name}: ${update.to} -> ${update.from}`)
      update.files.forEach(file => filesSet.add(file))

      await manifest.writeVersion(update.from, dryRun)
    }

    this.changedFiles = this.changedFiles.filter(file => !filesSet.has(file))
    this.versionUpdates.length = 0

    return true
  }

  /**
   * Publish the project.
   * @param options
   */
  abstract publish(options?: ProjectPublishOptions): Promise<void>
}
