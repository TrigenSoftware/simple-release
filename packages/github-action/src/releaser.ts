import type { getOctokit } from '@actions/github'
import {
  type PickOverridableOptions,
  type Project,
  type ReleaserOptions,
  type ReleaserSetUserOptions,
  type MonorepoProjectBumpOptions,
  type MonorepoProjectBumpByProjectOptions,
  Releaser
} from '@simple-release/core'
import {
  type Octokit,
  GithubHosting
} from '@simple-release/github'
import {
  parseSetOptionsComment,
  parseSetPreambleComment
} from './comment.js'
import {
  ifReleaseCommit,
  ifCommandComment
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

  override setUser(options?: ReleaserSetUserOptions) {
    return super.setUser({
      username: 'github-actions[bot]',
      email: 'github-actions[bot]@users.noreply.github.com',
      ...options
    })
  }

  override checkout(branch?: string) {
    return super.checkout(branch, {
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
      let optionsApplied = false
      let preamble: string | undefined
      const preambleByName = new Map<string, string>()

      // Scan newest to oldest: the newest set-options comment wins, and for
      // set-preamble the newest global and the newest per package win.
      for (let i = comments.length - 1, comment; i >= 0; i--) {
        comment = comments[i]

        if (!optionsApplied) {
          const json = parseSetOptionsComment(comment)

          if (json) {
            try {
              const options = JSON.parse(json) as Record<string, unknown>

              logger.verbose('fetch-options', 'Found set-options comment:')
              logger.verbose('fetch-options', json)

              super.setOptions(options)
              // Only stop scanning once options were actually applied, so a
              // malformed newest comment falls through to older valid ones.
              optionsApplied = true
            } catch {
              logger.verbose('fetch-options', 'Failed to parse parameters comment:')
              logger.verbose('fetch-options', json)
            }

            continue
          }
        }

        const setPreamble = parseSetPreambleComment(comment)

        if (setPreamble) {
          const {
            name,
            preamble: markdown
          } = setPreamble

          if (name) {
            if (!preambleByName.has(name)) {
              preambleByName.set(name, markdown)
            }
          } else if (preamble === undefined) {
            preamble = markdown
          }
        }
      }

      this.applyPreamble(preamble, preambleByName)
    })
  }

  /**
   * Apply preambles collected from pull request comments as bump options.
   * A global preamble becomes `bump.preamble`; per-package preambles are merged
   * into `bump.byProject[name].preamble` (keyed by full package name),
   * preserving any existing `byProject` entries.
   * @param preamble - The global preamble, if any.
   * @param preambleByName - Preambles keyed by full package name.
   */
  private applyPreamble(preamble: string | undefined, preambleByName: Map<string, string>) {
    if (preamble === undefined && preambleByName.size === 0) {
      return
    }

    const bump: MonorepoProjectBumpOptions = {}

    if (preamble !== undefined) {
      this.logger.verbose('fetch-options', 'Found global set-preamble comment.')
      bump.preamble = preamble
    }

    if (preambleByName.size > 0) {
      const byProject: Record<string, MonorepoProjectBumpByProjectOptions> = {
        ...(this.stepsOptions.bump as MonorepoProjectBumpOptions | undefined)?.byProject
      }

      for (const [name, markdown] of preambleByName) {
        byProject[name] = {
          ...byProject[name],
          preamble: markdown
        }
      }

      bump.byProject = byProject
    }

    super.setOptions({
      bump: bump as PickOverridableOptions<P['bump']>
    })
  }

  /**
   * Fetch all commits and tags from the remote repository.
   * @returns Project releaser instance for chaining.
   */
  fetch() {
    return this.enqueue(async () => {
      const {
        logger,
        gitClient
      } = this
      const { dryRun } = this.options

      logger.info('fetch', 'Fetching all commits and tags from the remote repository...')

      if (!dryRun) {
        await gitClient.fetch({
          prune: true,
          unshallow: await gitClient.exec('rev-parse', '--is-shallow-repository') === 'true',
          tags: true,
          remote: 'origin',
          branch: 'HEAD'
        })
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
      .setUser()
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
      .setUser()
      .maintenanceBranch()
      .tag()
      .push()
      .publish()
      .release()
      .run(check ? ifReleaseCommit : undefined)
  }

  /**
   * Run all steps to publish a snapshot version.
   * @param snapshotTag - NPM tag and snapshot pre-release identifier.
   */
  async runSnapshotAction(snapshotTag: string) {
    if (!snapshotTag) {
      throw new Error('Snapshot tag is required.')
    }

    await this
      .fetch()
      .bump({
        snapshot: snapshotTag,
        skipChangelog: true
      } as PickOverridableOptions<P['bump']>)
      .publish({
        tag: snapshotTag
      } as PickOverridableOptions<P['publish']>)
      .revert()
      .run()
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

    const commandComment = ifCommandComment()
    let isReleaseCommit = false

    if (commandComment === false) {
      logger.info('run', 'Action triggered by a pull request comment.')
      logger.info('run', 'No command comment found in a comment. Stopping action.')
      return
    }

    if (commandComment !== null) {
      logger.info('run', 'Action triggered by a pull request comment.')

      const currentBranch = await gitClient.getCurrentBranch()

      if (currentBranch !== commandComment) {
        super.checkout(commandComment, {
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
