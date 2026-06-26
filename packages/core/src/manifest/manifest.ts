import { dirname } from 'path'
import semver from 'semver'
import type { ProjectManifestVersionUpdate } from './manifest.types.js'

export type * from './manifest.types.js'

/**
 * A base class for project manifests.
 * Represents a manifest file for a project that contains information like the project name, version, and other metadata.
 */
export abstract class ProjectManifest<T = Record<string, unknown>> {
  /**
   * The name of the manifest file.
   */
  static Filename: string

  /**
   * The path to the directory containing the manifest file.
   */
  projectPath: string
  /**
   * The string contents of the manifest file.
   */
  abstract contents: string | undefined
  /**
   * The parsed contents of the manifest file.
   */
  abstract manifest: T | undefined

  /**
   * Creates a new instance of the project manifest.
   * @param manifestPath - The path to the manifest file.
   */
  constructor(public manifestPath: string) {
    this.projectPath = dirname(manifestPath)
  }

  /**
   * Read the manifest file and return its contents.
   */
  abstract readManifest(): Promise<T>

  /**
   * Read project name from the manifest.
   */
  abstract getName(): Promise<string>

  /**
   * Read project version from the manifest.
   */
  abstract getVersion(): Promise<string>

  async getPrereleaseVersion() {
    const version = await this.getVersion()

    return semver.prerelease(version)
  }

  /**
   * Read whether the project is private from the manifest.
   */
  abstract isPrivate(): Promise<boolean>

  /**
   * Write version to the manifest.
   * @param version - The new version to write to the manifest.
   * @param dryRun - If true, the version will not be written to the manifest file but will be updated in memory.
   */
  abstract writeVersion(version: string, dryRun?: boolean): Promise<ProjectManifestVersionUpdate>
}
