import { parseHostedGitUrl } from '@simple-libs/hosted-git-info'
import type { Repository } from './types.js'
import { spawn } from './spawn.js'

/**
 * Get latest git tag name.
 * @returns Tag name.
 */
export async function getLatestTagName() {
  try {
    return await spawn('git', [
      'describe',
      '--tags',
      '--abbrev=0'
    ])
  } catch {
    return null
  }
}

function getBranchName() {
  /* c8 ignore start */
  try {
    return spawn('git', ['branch', '--show-current'])
  } catch {
    return spawn('git', [
      'rev-parse',
      '--abbrev-ref',
      'HEAD'
    ])
  }
  /* c8 ignore stop */
}

/* c8 ignore start */
function getRemoteForBranch(branch: string) {
  return spawn('git', [
    'config',
    '--get',
    `branch.${branch}.remote`
  ])
}
/* c8 ignore end */

async function getRemote() {
  const branchName = await getBranchName()
  let remote = 'origin'

  /* c8 ignore start */
  try {
    if (branchName) {
      remote = await getRemoteForBranch(branchName)
    }
  } catch {}
  /* c8 ignore stop */

  return remote
}

function isRemoteName(remoteUrlOrName: string) {
  return Boolean(remoteUrlOrName && !remoteUrlOrName.includes('/'))
}

/**
 * Get git repository remote url.
 * @returns Remote url.
 */
export async function getRemoteUrl() {
  const remoteNameOrUrl = await getRemote()
  let remoteUrl = remoteNameOrUrl

  if (isRemoteName(remoteNameOrUrl)) {
    try {
      remoteUrl = await spawn('git', [
        'remote',
        'get-url',
        remoteNameOrUrl
      ])
    } catch {
      try {
        remoteUrl = await spawn('git', [
          'config',
          '--get',
          `remote.${remoteNameOrUrl}.url`
        ])
      } catch {}
    }
  }

  return remoteUrl
}

/**
 * Parse git repository info from url.
 * @param remoteUrl - git repository url.
 * @returns Repository info.
 */
export function parseGitUrl(remoteUrl: string): Repository {
  const url = (remoteUrl || '').replace(/\\/g, '/')
  const parsedUrl = parseHostedGitUrl(url)

  return {
    host: parsedUrl?.host?.replace(/^.*:\/\//, '') || '',
    owner: parsedUrl?.owner || '',
    project: parsedUrl?.project || ''
  }
}

