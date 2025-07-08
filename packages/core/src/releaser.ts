import type { ConventionalGitClient } from '@conventional-changelog/git-client'
import type { Project } from './project/index.js'
import type { GitRepositoryHosting } from './hosting/index.js'
import { Logger } from './logger.js'
import type {
  PickOverridableOptions,
  ReleaserCheckoutOptions,
  ReleaserOptions,
  ReleaserCommitOptions,
  ReleaserTagOptions,
  ReleaserPushOptions,
  ReleaserStepsOptions
} from './releaser.types.js'

export * from './releaser.types.js'

/**
 * A releaser class that provides methods to manage the release process of a project.
 */
export class Releaser<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting
> {
  /**
   * Target project to release.
   */
  readonly project: P
  /**
   * Git repository hosting service to use for creating releases and pull requests.
   */
  readonly hosting?: G
  /**
   * The git client used to interact with the repository.
   */
  readonly gitClient: ConventionalGitClient
  /**
   * The logger used to log messages during the release process.
   */
  readonly logger: Logger
  protected readonly state: {
    headBranch?: string
    baseBranch?: string
    bump?: boolean
    tags?: boolean
  } = {}

  protected readonly stepsOptions: ReleaserStepsOptions<P, G> = {}

  private readonly queue: (() => Promise<unknown>)[] = []

  /**
   * Creates a project releaser.
   * @param options
   */
  constructor(
    public options: ReleaserOptions<P, G>
  ) {
    const {
      project,
      hosting
    } = options

    this.project = project
    this.hosting = hosting
    this.gitClient = project.gitClient
    this.logger = options.logger ?? new Logger(options)
  }

  enqueue(fn: () => Promise<void>) {
    this.queue.push(fn)
    return this
  }

  private async getBaseBranch() {
    const { baseBranch } = this.state

    if (baseBranch) {
      return baseBranch
    }

    return await this.project.gitClient.getCurrentBranch()
  }

  /**
   * Set default options for the releaser steps.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  setOptions(options: ReleaserStepsOptions<P, G>) {
    const { logger } = this

    logger.verbose('set-options', 'Setting options for steps:')
    logger.verbose('set-options', options)

    for (const [key, value] of Object.entries(options)) {
      Object.assign(
        this.stepsOptions[key as keyof ReleaserStepsOptions] ??= {},
        value
      )
    }

    logger.verbose('set-options', 'Final options for steps:')
    logger.verbose('set-options', this.stepsOptions)

    return this
  }

  /**
   * Enqueue a task to checkout a branch.
   * @param branch - The branch to checkout, defaults to `'simple-release'`.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  checkout(branch?: string, options: ReleaserCheckoutOptions = {}) {
    return this.enqueue(async () => {
      const {
        logger,
        gitClient
      } = this
      const { dryRun } = this.options
      const {
        branch: headBranch = 'simple-release',
        username,
        email,
        fetch,
        force
      } = {
        ...this.stepsOptions.checkout,
        ...options,
        ...branch
          ? {
            branch
          }
          : {}
      }

      logger.info('checkout', `Checking out branch ${headBranch}...`)

      this.state.headBranch = headBranch
      this.state.baseBranch = await this.getBaseBranch()

      if (username) {
        logger.verbose('checkout', `Setting git user.name to "${username}".`)

        if (!dryRun) {
          await gitClient.setConfig('user.name', username)
        }
      }

      if (email) {
        logger.verbose('checkout', `Setting git user.email to "${email}".`)

        if (!dryRun) {
          await gitClient.setConfig('user.email', email)
        }
      }

      if (fetch) {
        logger.verbose('checkout', `Fetching all commits and tags from the remote repository...`)

        if (!dryRun) {
          await gitClient.fetch({
            prune: true,
            unshallow: true,
            tags: true,
            remote: 'origin',
            branch: 'HEAD'
          })
        }
      }

      if (force) {
        logger.verbose('checkout', `Deleting branch ${headBranch} if it exists...`)

        if (!dryRun) {
          await gitClient.deleteBranch(headBranch).catch(() => null)
        }
      }

      try {
        logger.verbose('checkout', `Creating branch ${headBranch}...`)

        if (!dryRun) {
          await gitClient.createBranch(headBranch)
        }
      } catch {
        logger.verbose('checkout', `Branch ${headBranch} already exists, checking it out...`)

        if (!dryRun) {
          await gitClient.checkout(headBranch)
        }
      }
    })
  }

  /**
   * Enqueue a task to bump the version of the project.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  bump(options?: PickOverridableOptions<P['bump']>) {
    return this.enqueue(async () => {
      const { project } = this
      const { dryRun } = this.options
      const logger = this.logger.createChild('bump')

      logger.info('Bumping version...')

      const done = await project.bump({
        dryRun,
        logger,
        ...this.stepsOptions.bump,
        ...options
      })

      this.state.bump = done

      if (!done) {
        logger.info('No version changes detected.')
      }
    })
  }

  /**
   * Enqueue a task to commit bump changes to the repository.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  commit(options?: ReleaserCommitOptions) {
    return this.enqueue(async () => {
      const {
        project,
        logger,
        gitClient
      } = this
      const { dryRun } = this.options

      logger.info('commit', `Committing changes...`)

      if (!this.state.bump) {
        logger.info('commit', 'No changes to commit.')
        return
      }

      const files = project.changedFiles
      const params = {
        ...this.stepsOptions.commit,
        ...options,
        message: project.getCommitMessage(),
        verify: false
      }

      logger.verbose('commit', `Files to commit:`)

      files.forEach((file) => {
        logger.verbose('commit', `- ${file}`)
      })

      logger.verbose(
        'commit',
        params.message.includes('\n')
          ? `Commit message:\n\n${params.message}\n`
          : `Commit message: ${params.message}`
      )

      if (!dryRun) {
        await gitClient.add(files)
        await gitClient.commit(params)
      }
    })
  }

  /**
   * Enqueue a task to tag the project with the new version.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  tag(options?: ReleaserTagOptions) {
    return this.enqueue(async () => {
      const {
        project,
        logger,
        gitClient
      } = this
      const { dryRun } = this.options
      const {
        fetch,
        ...tagOptions
      } = {
        ...this.stepsOptions.tag,
        ...options
      }

      logger.info('tag', 'Tagging version...')

      if (fetch) {
        logger.verbose('tag', 'Fetching fresh tags from the remote repository...')

        if (!dryRun) {
          await gitClient.fetch({
            tags: true
          })
        }
      }

      const tags = await project.getTags()

      this.state.tags = tags.length > 0

      if (!this.state.tags) {
        logger.info('tag', 'No version changes detected.')
        return
      }

      logger.verbose('tag', `Tags to create:`)

      for (const tag of tags) {
        logger.verbose('tag', `- ${tag}`)

        if (!dryRun) {
          await gitClient.tag({
            ...tagOptions,
            name: tag
          })
        }
      }
    })
  }

  /**
   * Enqueue a task to push changes to the remote repository.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  push(options?: ReleaserPushOptions) {
    return this.enqueue(async () => {
      const {
        logger,
        gitClient,
        state
      } = this
      const { dryRun } = this.options
      const branch = await gitClient.getCurrentBranch()

      logger.info('push', `Pushing changes to ${branch}...`)

      if (!state.bump && !state.tags) {
        logger.info('push', 'Nothing to push.')
        return
      }

      if (!dryRun) {
        if (state.bump) {
          await gitClient.push(branch, {
            verify: false,
            ...this.stepsOptions.push,
            ...options
          })
        }

        if (state.tags) {
          await gitClient.push(branch, {
            tags: true,
            verify: false
          })
        }
      }
    })
  }

  /**
   * Enqueue a task to publish the project.
   * @param options
   * @returns Project releaser instance for chaining.
   */
  publish(options?: PickOverridableOptions<P['publish']>) {
    return this.enqueue(async () => {
      const { project } = this
      const { dryRun } = this.options
      const logger = this.logger.createChild('package')
      const publishOptions = {
        dryRun,
        logger,
        ...this.stepsOptions.publish,
        ...options
      }

      if (publishOptions.skip) {
        logger.verbose('Skipping publish')
        return
      }

      logger.info('Publishing...')

      await project.publish(publishOptions)
    })
  }

  /**
   * Enqueue a task to create a release.
   * @param option
   * @returns Project releaser instance for chaining.
   */
  release(option?: PickOverridableOptions<G['createRelease']>) {
    const { hosting } = this

    if (!hosting) {
      throw new Error('Hosting service is not configured. Please set the hosting option.')
    }

    return this.enqueue(async () => {
      const { project } = this
      const { dryRun } = this.options
      const logger = this.logger.createChild('release')

      logger.info('Creating release...')

      await hosting.createRelease({
        project,
        dryRun,
        logger,
        ...this.stepsOptions.release,
        ...option
      })
    })
  }

  /**
   * Enqueue a task to create a pull request.
   * @param option
   * @returns Project releaser instance for chaining.
   */
  pullRequest(option?: PickOverridableOptions<G['createPullRequest']>) {
    const { hosting } = this

    if (!hosting) {
      throw new Error('Hosting service is not configured. Please set the hosting option.')
    }

    return this.enqueue(async () => {
      const {
        project,
        state
      } = this
      const { dryRun } = this.options
      const logger = this.logger.createChild('pull-request')

      logger.info('Creating pull request...')

      if (!state.bump) {
        logger.info('No version changes detected, skipping pull request creation.')
        return
      }

      if (!state.headBranch) {
        logger.info('Head branch is not set, skipping pull request creation.')
        return
      }

      await hosting.createPullRequest({
        project,
        dryRun,
        logger,
        from: state.headBranch,
        to: await this.getBaseBranch(),
        ...this.stepsOptions.pullRequest,
        ...option
      })
    })
  }

  /**
   * Run all queued tasks in order.
   * @param condition - Optional condition to run the releaser.
   */
  async run(condition?: (releaser: this) => Promise<boolean>) {
    let shouldRun = true

    if (condition) {
      const { logger } = this

      logger.info('run', 'Checking condition...')

      shouldRun = await condition(this)

      if (shouldRun) {
        logger.info('run', 'Condition passed, running releas steps...')
      } else {
        logger.info('run', 'Condition failed, skipping release steps.')
      }
    }

    if (shouldRun) {
      for (const fn of this.queue) {
        await fn()
      }
    }

    this.queue.length = 0
    this.logger.info('done', `Done!`)
  }
}
