import fs from 'fs/promises'
import { join } from 'path'
import os from 'os'
import semver, { type ReleaseType } from 'semver'

export async function isFileExists(filePath: string) {
  try {
    await fs.stat(filePath)
    return true
  } catch (err) {
    if ((err as { code: string }).code === 'ENOENT') {
      return false
    }

    throw err
  }
}

const HASH_BASE = 36

export function tmpfile(prefix: string, dir = os.tmpdir()) {
  return join(dir, `${prefix}-${Math.random().toString(HASH_BASE).slice(2)}`)
}

const nonPreReleaseTypes = [
  'patch',
  'minor',
  'major'
] as const

function getTypePriority(type: ReleaseType | undefined) {
  return nonPreReleaseTypes.indexOf(type as typeof nonPreReleaseTypes[number])
}

function getCurrentActiveType(version: string) {
  for (const type of nonPreReleaseTypes) {
    if (semver[type](version)) {
      return type
    }
  }

  return undefined
}

function getSnapshotTimestamp(date = new Date()) {
  return date.toISOString().replace(/\D/g, '').slice(0, 14)
}

export function getPrereleaseIdentifier(
  prerelease?: string,
  snapshot?: string
) {
  if (snapshot) {
    return `${snapshot}.${getSnapshotTimestamp()}`
  }

  return prerelease
}

export function getPrereleaseIdentifierBase(snapshot?: string) {
  return snapshot
    ? false
    : undefined
}

export function setSnapshotIdentifier(version: string, snapshot?: string) {
  if (!snapshot) {
    return version
  }

  const semverVersion = new semver.SemVer(version)

  semverVersion.prerelease = [snapshot, getSnapshotTimestamp()]

  return semverVersion.format()
}

export function getReleaseType(
  releaseType: ReleaseType,
  version: string,
  prerelease?: string
): ReleaseType {
  if (typeof prerelease === 'string') {
    if (Array.isArray(semver.prerelease(version))) {
      const currentActiveType = getCurrentActiveType(version)

      if (currentActiveType === releaseType
        || getTypePriority(currentActiveType) > getTypePriority(releaseType)
      ) {
        return 'prerelease'
      }
    }

    return `pre${releaseType}` as ReleaseType
  }

  return releaseType
}

/**
 * Check whether the version bump is breaking for dependents:
 * the next version is out of the caret range of the current one.
 * Entering a major prerelease and graduating from it are breaking,
 * bumps within the same prerelease are not.
 * @param currentVersion - The current version.
 * @param nextVersion - The next version.
 * @returns Whether the bump is breaking.
 */
export function isBreakingBump(currentVersion: string, nextVersion: string) {
  switch (semver.diff(currentVersion, nextVersion)) {
    case 'major':
    case 'premajor':
      return true
    case 'minor':
    case 'preminor':
      return semver.major(currentVersion) === 0
    case 'patch':
    case 'prepatch':
      return semver.major(currentVersion) === 0 && semver.minor(currentVersion) === 0
    case 'prerelease':
    case 'release':
    case null:
      return false
  }
}
