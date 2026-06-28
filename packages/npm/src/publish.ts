import { spawn } from 'child_process'
import type {
  ProjectPublishOptions,
  PackageJsonProject
} from '@simple-release/core'
import { throwProcessError } from '@simple-libs/child-process-utils'

export interface PublishOptions extends ProjectPublishOptions {
  access?: string
  otp?: string
  env?: Record<string, string | undefined>
  workspaces?: boolean
}

export async function publish(project: PackageJsonProject, options: PublishOptions = {}): Promise<void> {
  const { manifest } = project
  const {
    access,
    tag,
    otp,
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
    'npm',
    [
      'publish',
      ...access ? ['--access', access] : [],
      ...publishTag ? ['--tag', publishTag] : [],
      ...workspaces ? ['--workspaces'] : [],
      ...dryRun ? ['--dry-run'] : [],
      ...otp ? ['--otp', otp] : []
    ],
    {
      cwd: manifest.projectPath,
      env,
      stdio: silent ? 'ignore' : 'inherit'
    }
  ))
}
