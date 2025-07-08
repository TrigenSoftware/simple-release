/* eslint-disable @typescript-eslint/naming-convention */
import { Octokit } from '@octokit/rest'
import newGithubReleaseUrl from 'new-github-release-url'
import type {
  Repository,
  GitHubClientOptions,
  GitHubRelease
} from './types.js'

/**
 * GitHub client for given repository.
 */
export class GitHubClient {
  protected readonly client: Octokit
  protected readonly repo: Repository
  protected readonly host?: string
  protected readonly isGitHub: boolean

  /**
   * @param options - client options.
   */
  constructor(options: GitHubClientOptions) {
    const {
      auth,
      repo,
      host
    } = options
    const isGitHub = host === 'github.com'
    const baseUrl = `https://${isGitHub || !host ? 'api.github.com' : `${host}/api/v3`}`

    this.client = new Octokit({
      baseUrl,
      auth,
      userAgent: 'simple-github-release'
    })
    this.repo = repo
    this.host = host
    this.isGitHub = isGitHub
  }

  /**
   * Get latest release from repository.
   * @returns Latest release info.
   */
  async getLatestRelease() {
    const {
      owner,
      project
    } = this.repo

    try {
      const response = await this.client.repos.listReleases({
        owner,
        repo: project,
        per_page: 1,
        page: 1
      })
      const [release] = response.data

      return {
        id: release.id,
        tag: release.tag_name
      }
    } catch {
      return null
    }
  }

  /**
   * Create release.
   * @param release
   * @returns Created release data.
   */
  async createRelease(release: GitHubRelease) {
    try {
      const options = this.getOctokitReleaseOptions(release)
      const response = await this.client.repos.createRelease(options)
      const { id, html_url } = response.data

      return {
        id,
        releaseUrl: html_url
      }
    } catch (err) {
      throw err instanceof Error && 'status' in err
        ? new Error(`Can't create release, please check validity of access token`)
        : err
    }
  }

  /**
   * Update release.
   * @param releaseId - Release to update.
   * @param release
   * @returns Updated release data.
   */
  async updateRelease(releaseId: number, release: GitHubRelease) {
    try {
      const options = {
        ...this.getOctokitReleaseOptions(release),
        release_id: releaseId
      }
      const response = await this.client.repos.updateRelease(options)
      const {
        id,
        html_url
      } = response.data

      return {
        id,
        releaseUrl: html_url
      }
    } catch (err) {
      throw err instanceof Error && 'status' in err
        ? new Error(`Can't update release, please check validity of access token`)
        : err
    }
  }

  /**
   * Create url to release.
   * @param release
   * @returns Url.
   */
  createReleaseUrl(release: GitHubRelease) {
    const { tag } = release
    const {
      host,
      owner,
      project
    } = this.repo

    return `https://${host}/${owner}/${project}/releases/tag/${tag}`
  }

  /**
   * Create url to create release in browser.
   * @param release
   * @returns Url.
   */
  createBrowserReleaseUrl(release: GitHubRelease) {
    const host = this.host ?? this.repo.host
    const {
      owner,
      project
    } = this.repo
    const {
      name,
      tag,
      notes,
      prerelease = false,
      auto = false
    } = release
    const url = newGithubReleaseUrl({
      user: owner,
      repo: project,
      tag,
      isPrerelease: prerelease,
      title: name,
      body: auto ? undefined : notes
    })

    return this.isGitHub ? url : url.replace('github.com', host)
  }

  protected getOctokitReleaseOptions(release: GitHubRelease) {
    const {
      owner,
      project
    } = this.repo
    const {
      name,
      tag,
      notes,
      draft = false,
      prerelease = false,
      auto = false
    } = release

    return {
      owner,
      repo: project,
      tag_name: tag,
      name,
      body: auto ? undefined : notes,
      draft,
      prerelease,
      generate_release_notes: auto
    }
  }
}
