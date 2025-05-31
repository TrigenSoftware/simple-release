import { spawn } from 'child_process'
import { throwProcessError } from '@simple-libs/child-process-utils'
import {
  type GenericProjectPublishOptions,
  type PackageJsonProject
} from '@simple-release/core'

export interface PublishOptions extends GenericProjectPublishOptions {
  access?: string
  tag?: string | ((version: string, prerelease: readonly (string | number)[] | null) => string)
  otp?: string
  gitChecks?: boolean
  env?: Record<string, string | undefined>
  workspaces?: boolean
}

export async function publish(project: PackageJsonProject, options: PublishOptions = {}): Promise<void> {
  const { manifest } = project
  const {
    access,
    tag,
    otp,
    gitChecks = true,
    env = process.env,
    workspaces,
    dryRun,
    logger
  } = options
  const silent = logger?.parent.options.silent
  const publishTag = typeof tag === 'function'
    ? tag(
      await manifest.getVersion(),
      await manifest.getPrereleaseVersion()
    )
    : tag

  await throwProcessError(spawn(
    'pnpm',
    [
      'publish',
      ...access ? ['--access', access] : [],
      ...publishTag ? ['--tag', publishTag] : [],
      ...workspaces ? ['--recursive'] : [],
      ...dryRun ? ['--dry-run'] : [],
      ...otp ? ['--otp', otp] : [],
      ...gitChecks ? [] : ['--no-git-checks']
    ],
    {
      cwd: manifest.projectPath,
      env,
      stdio: silent ? 'ignore' : 'inherit'
    }
  ))
}
