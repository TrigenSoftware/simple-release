import { Octokit } from '@octokit/rest'
import {
  type Project,
  type CreateReleaseOptions,
  type CreatePullRequestOptions,
  GitRepositoryHosting
} from '@simple-release/core'
import { CHEATSHEET } from './cheatsheet.js'

export { Octokit }

export interface GithubOptions {
  /**
   * The GitHub personal access token to authenticate with the GitHub API.
   */
  token?: string
  /**
   * The GitHub Octokit instance to use for making API calls.
   */
  octokit?: Octokit
  /**
   * The GitHub owner (username or organization) of the repository.
   * If not provided, it will be inferred from the remote URL.
   */
  owner?: string
  /**
   * The GitHub project (repository name) to create releases in.
   * If not provided, it will be inferred from the remote URL.
   */
  project?: string
}

export interface GithubCreatePullRequestOptions extends CreatePullRequestOptions {
  /**
   * Create a draft pull request.
   */
  draft?: boolean
}

const OK = 200
const noop = () => { /* no-op */ }

/**
 * A class that creates releases on GitHub using the GitHub REST API.
 */
export class GithubHosting extends GitRepositoryHosting {
  readonly octokit: Octokit

  /**
   * Creates a new instance of the GitHub release creator.
   * @param options - The options for the GitHub release creator.
   */
  constructor(
    private readonly options: GithubOptions
  ) {
    super()

    this.octokit = options.octokit || new Octokit({
      auth: options.token
    })
    this.octokit.log = {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop
    }
  }

  async getRepositoryId(project: Project) {
    let {
      owner,
      project: repo
    } = this.options

    if (!owner || !repo) {
      const info = await project.getHostedGitInfo()

      if (info) {
        if (!owner) {
          owner = info.owner
        }

        if (!repo) {
          repo = info.project
        }
      }
    }

    return {
      owner: owner!,
      repo: repo!
    }
  }

  private async hasRelease(
    owner: string,
    repo: string,
    tag: string
  ): Promise<boolean> {
    try {
      const { status } = await this.octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag
      })

      return status === OK
    } catch {
      return false
    }
  }

  async createRelease(options: CreateReleaseOptions): Promise<void> {
    const {
      project,
      dryRun,
      logger
    } = options
    const { octokit } = this
    const data = await project.getReleaseData()

    if (!data.length) {
      logger?.info('No release data found. Skipping release creation.')
      return
    }

    const repositoryId = await this.getRepositoryId(project)

    for (const releaseData of data) {
      if (await this.hasRelease(repositoryId.owner, repositoryId.repo, releaseData.nextTag)) {
        logger?.verbose(`Release ${releaseData.nextTag} already exists.`)
        continue
      }

      const params = {
        ...repositoryId,
        tag_name: releaseData.nextTag,
        name: releaseData.title,
        body: releaseData.notes,
        prerelease: releaseData.isPrerelease
      }

      logger?.verbose('Creating release with params:')
      logger?.verbose(params)

      if (!dryRun) {
        await octokit.rest.repos.createRelease(params)
      }
    }
  }

  private getPullRequestData(project: Project, from: string, to: string) {
    const [title] = project.getCommitMessage().split('\n')
    const body = `${project.versionUpdates.map(({ name, notes }) => `# ${name}\n\n${notes.trim()}`).join('\n\n')}

---
This PR was generated with [simple-release](https://github.com/TrigenSoftware/simple-release).

<details>
<summary>📄 Cheatsheet</summary>
<br>

${CHEATSHEET}

</details>

<!--
  Please do not edit this comment.
  simple-release-pull-request: true
  simple-release-branch-from: ${from}
  simple-release-branch-to: ${to}
-->
`

    return {
      title,
      body
    }
  }

  async createPullRequest(options: GithubCreatePullRequestOptions): Promise<void> {
    const {
      project,
      dryRun,
      logger,
      draft
    } = options
    let { from, to } = options
    const { gitClient } = project

    if (!from) {
      from = await gitClient.getCurrentBranch()
    }

    if (!to) {
      to = await gitClient.getDefaultBranch()
    }

    if (from === to) {
      throw new Error('Cannot create a pull request from the same branch.')
    }

    const { octokit } = this
    const repositoryId = await this.getRepositoryId(project)
    const { data: [pr] } = await octokit.rest.pulls.list({
      ...repositoryId,
      head: `${repositoryId.owner}:${from}`,
      state: 'open'
    })

    if (pr) {
      logger?.info(`Updating existing pull request #${pr.number}`)
    }

    const {
      title,
      body
    } = this.getPullRequestData(project, from, to)

    logger?.verbose('Pull request data:')

    if (!pr && draft) {
      logger?.verbose('Draft: true')
    }

    logger?.verbose(`${from} -> ${to}`)
    logger?.verbose(`Title: ${title}`)
    logger?.verbose(`Body:\n\n${body}`)

    if (!dryRun) {
      if (pr) {
        await octokit.rest.pulls.update({
          ...repositoryId,
          pull_number: pr.number,
          title,
          body
        })
      } else {
        await octokit.rest.pulls.create({
          ...repositoryId,
          title,
          base: to,
          head: from,
          body,
          draft
        })
      }
    }
  }
}
