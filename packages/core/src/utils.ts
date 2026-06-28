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

export function tmpfile(prefix: string) {
  return join(os.tmpdir(), `${prefix}-${Math.random().toString(HASH_BASE).slice(2)}`)
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
