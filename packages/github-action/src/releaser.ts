import type { getOctokit } from '@actions/github'
import {
  type Project,
  type ReleaserOptions,
  Releaser
} from '@simple-release/core'
import {
  type Octokit,
  GithubHosting
} from '@simple-release/github'
import { parseSetOptionsComment } from './comment.js'
import {
  ifReleaseCommit,
  ifSetOptionsComment
} from './conditions.js'

export interface ReleaserGithubActionOptions<P extends Project = Project> extends Omit<ReleaserOptions<P, GithubHosting>, 'hosting'> {
  /**
   * The Octokit instance to use for making GitHub API calls.
   */
  octokit: ReturnType<typeof getOctokit>
}

export class ReleaserGithubAction<P extends Project = Project> extends Releaser<P, GithubHosting> {
  declare hosting: GithubHosting

  constructor(
    options: ReleaserGithubActionOptions<P>
  ) {
    super({
      hosting: new GithubHosting({
        octokit: options.octokit as unknown as Octokit
      }),
      ...options
    })
  }

  override checkout(branch?: string) {
    return super.checkout(branch, {
      username: 'github-actions[bot]',
      email: 'github-actions[bot]@users.noreply.github.com',
      fetch: true,
      force: true
    })
  }

  /**
   * Fetches options from the pull request comments.
   * @returns Project releaser instance for chaining.
   */
  fetchOptions() {
    return this.enqueue(async () => {
      const { headBranch } = this.state

      if (!headBranch) {
        throw new Error('Head branch is not set. Please call `checkout` before `fetchParams`.')
      }

      const {
        project,
        hosting,
        logger
      } = this

      logger.info('fetch-options', 'Fetching options from pull request comments...')

      const { octokit } = hosting
      const repositoryId = await hosting.getRepositoryId(project)
      const { data: [pr] } = await octokit.rest.pulls.list({
        ...repositoryId,
        head: `${repositoryId.owner}:${headBranch}`,
        state: 'open'
      })

      if (!pr) {
        logger.info('fetch-options', 'No open pull request found.')
        return
      }

      const { data: comments } = await octokit.rest.issues.listComments({
        ...repositoryId,
        issue_number: pr.number
      })

      for (let i = comments.length - 1; i >= 0; i--) {
        const json = parseSetOptionsComment(comments[i])

        if (json) {
          try {
            const options = JSON.parse(json) as Record<string, unknown>

            logger.verbose('fetch-options', 'Found set-options comment:')
            logger.verbose('fetch-options', json)

            super.setOptions(options)
          } catch {
            logger.verbose('fetch-options', 'Failed to parse parameters comment:')
            logger.verbose('fetch-options', json)
          }

          break
        }
      }
    })
  }

  override tag() {
    return super.tag({
      fetch: true
    })
  }

  override push() {
    return super.push({
      force: true
    })
  }

  /**
   * Run all steps to create a pull request.
   */
  async runPullRequestAction() {
    await this
      .checkout()
      .fetchOptions()
      .bump()
      .commit()
      .push()
      .pullRequest()
      .run()
  }

  /**
   * Run all steps to release a new version.
   * @param check - Whether to check if the commit is a release commit.
   */
  async runReleaseAction(check = true) {
    await this
      .tag()
      .push()
      .release()
      .publish()
      .run(check ? ifReleaseCommit : undefined)
  }

  /**
   * Run action based on the context.
   */
  async runAction() {
    const {
      logger,
      gitClient
    } = this

    logger.info('run', 'Detecting action...')

    const isSetOptionsComment = ifSetOptionsComment()
    let isReleaseCommit = false

    if (isSetOptionsComment === false) {
      logger.info('run', 'Action triggered by a pull request comment.')
      logger.info('run', 'No set-options comment found in a comment. Stopping action.')
      await this.run()
      return
    }

    if (isSetOptionsComment !== null) {
      logger.info('run', 'Action triggered by a pull request comment.')

      const currentBranch = await gitClient.getCurrentBranch()

      if (currentBranch !== isSetOptionsComment) {
        super.checkout(isSetOptionsComment, {
          fetch: true,
          force: false
        })
      }
    } else {
      isReleaseCommit = await ifReleaseCommit(this)
    }

    if (isReleaseCommit) {
      logger.info('run', 'Running release action...')
      await this.runReleaseAction(false)
    } else {
      logger.info('run', 'Running pull request action...')
      await this.runPullRequestAction()
    }
  }
}
