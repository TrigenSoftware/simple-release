import { spawn } from 'child_process'
import type {
  PackageJsonProject,
  ProjectPublishOptions
} from '@simple-release/core'
import { throwProcessError } from '@simple-libs/child-process-utils'
import semverMajor from 'semver/functions/major.js'
import semverValid from 'semver/functions/valid.js'

export interface PublishOptions extends ProjectPublishOptions {
  /**
   * Branch that points to the latest built GitHub Action state.
   * @default 'latest'
   */
  latestBranch?: string
  /**
   * Prefix for the major branch.
   * @default 'v'
   */
  majorBranchPrefix?: string
  /**
   * Prefix for version tags.
   * @default 'v'
   */
  tagPrefix?: string
  /**
   * Build or install command to run before publishing refs.
   */
  build?: string | string[]
  /**
   * Files to stage after build. Defaults to package.json `files`.
   */
  files?: string[]
  /**
   * Environment variables to set before running build commands.
   * @default process.env
   */
  env?: Record<string, string | undefined>
}

async function runBuildCommands(
  commands: string[],
  options: Pick<PublishOptions, 'dryRun' | 'env' | 'logger'>,
  cwd: string
) {
  const {
    dryRun,
    env = process.env,
    logger
  } = options
  const silent = logger?.parent.options.silent

  for (const command of commands) {
    logger?.info(`Running build command: ${command}`)

    if (!dryRun) {
      await throwProcessError(spawn(command, {
        cwd,
        env,
        shell: true,
        stdio: silent ? 'ignore' : 'inherit'
      }))
    }
  }
}

export async function publish(project: PackageJsonProject, options: PublishOptions = {}): Promise<void> {
  const {
    gitClient,
    manifest
  } = project
  const {
    latestBranch = 'latest',
    majorBranchPrefix = 'v',
    tagPrefix = 'v',
    dryRun,
    logger
  } = options
  const { projectPath } = manifest
  const pkg = await manifest.readManifest()
  const version = await manifest.getVersion()
  const validVersion = semverValid(version)

  if (!validVersion) {
    throw new Error(`Invalid GitHub Action version: ${version}`)
  }

  const majorBranch = `${majorBranchPrefix}${semverMajor(validVersion)}`
  const versionTag = `${tagPrefix}${validVersion}`
  const buildCommands = options.build
    ? Array.isArray(options.build)
      ? options.build
      : [options.build]
    : []
  const files = options.files || pkg.files as string[] || []
  const originalBranch = await gitClient.getCurrentBranch()
  const releaseCommit = await gitClient.verify('HEAD')

  logger?.info(`Publishing GitHub Action ${versionTag}...`)
  logger?.verbose(`Latest branch: ${latestBranch}`)
  logger?.verbose(`Major branch: ${majorBranch}`)

  let shouldRestoreBranch = false

  try {
    if (!dryRun) {
      await gitClient.exec('checkout', '-B', latestBranch, releaseCommit)

      shouldRestoreBranch = originalBranch !== latestBranch
    }

    await runBuildCommands(buildCommands, options, projectPath)

    if (!dryRun && files.length) {
      logger?.info('Staging GitHub Action files...')

      await gitClient.exec('add', '--force', '--', ...files)

      const stagedFiles = await gitClient.exec('diff', '--cached', '--name-only')

      if (stagedFiles) {
        await gitClient.exec('commit', '--amend', '--no-edit', '--no-verify')
      }
    }

    if (!dryRun) {
      logger?.info('Creating GitHub Action release refs...')

      await gitClient.exec('branch', '-f', '--', majorBranch, 'HEAD')
      await gitClient.exec('tag', '-f', '--', versionTag, 'HEAD')

      logger?.info('Pushing GitHub Action release refs...')

      await gitClient.push(latestBranch, {
        force: true,
        verify: false
      })
      await gitClient.push(majorBranch, {
        force: true,
        verify: false
      })
      await gitClient.exec('push', '--force', 'origin', versionTag)
    }
  } finally {
    if (shouldRestoreBranch) {
      await gitClient.checkout(originalBranch)
    }
  }
}
