import fs from 'fs/promises'
import type { PackageJsonProps } from './packageJson.types.js'
import {
  type ProjectManifestVersionUpdate,
  ProjectManifest
} from './manifest.js'

export type * from './packageJson.types.js'

/**
 * A class that represents a package.json manifest.
 */
export class PackageJsonManifest extends ProjectManifest<PackageJsonProps> {
  static override Filename = 'package.json'

  contents: string | undefined
  manifest: PackageJsonProps | undefined
  private contentsMutex: Promise<string> | undefined

  async readManifest() {
    if (!this.contentsMutex) {
      this.contentsMutex = fs.readFile(this.manifestPath, 'utf-8')
      this.contents = await this.contentsMutex
      this.manifest = JSON.parse(this.contents) as PackageJsonProps

      return this.manifest
    }

    await this.contentsMutex

    return this.manifest!
  }

  async getName() {
    const manifest = await this.readManifest()

    return manifest.name
  }

  async getVersion() {
    const manifest = await this.readManifest()

    return manifest.version
  }

  async isPrivate() {
    const manifest = await this.readManifest()

    return Boolean(manifest.private)
  }

  async writeVersion(version: string, dryRun?: boolean): Promise<ProjectManifestVersionUpdate> {
    await this.readManifest()

    const {
      name,
      version: from
    } = this.manifest!

    this.manifest!.version = version
    this.contents = this.contents!.replace(
      /"version":(\s*)"[^"]+"/,
      `"version":$1"${version}"`
    )

    if (!dryRun) {
      await fs.writeFile(this.manifestPath, this.contents, 'utf-8')
    }

    return {
      name,
      from,
      to: version,
      files: [this.manifestPath]
    }
  }
}
