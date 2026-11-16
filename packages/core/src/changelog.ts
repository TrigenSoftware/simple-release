import {
  createReadStream,
  createWriteStream
} from 'fs'
import fs from 'fs/promises'
import {
  dirname,
  basename
} from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import {
  type FinalTemplateContext,
  type TemplateContext,
  segments
} from '@conventional-changelog/template'
import {
  concatStringStream,
  splitStream
} from '@simple-libs/stream-utils'
import {
  tmpfile,
  isFileExists
} from './utils.js'

const versionHeaderRegex = /^#+ \[?([^[\]()\s]*\d+\.\d+\.\d+[^[\]()\s]*)\]?/m
const tagsRegex = /\/([^/)]*)\.\.\.([^/)]*)\)/

export const changelogHeader = `# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

`

/**
 * Changelog template context with extra fields of simple-release.
 */
export interface ChangelogContext extends TemplateContext {
  /**
   * The project is bumped without changes to keep in sync with breaking changes in other projects.
   */
  breakingSync?: boolean
}

export function preamblePartial(
  {
    preamble,
    commitGroups,
    noteGroups,
    breakingSync
  }: FinalTemplateContext & ChangelogContext
) {
  return segments(
    preamble,
    !preamble && !commitGroups?.length && !noteGroups?.length && (
      breakingSync
        ? 'Version bump to keep in sync with breaking changes in other packages.'
        : 'Version bump without any changes.'
    )
  )
}

/**
 * Insert release notes before the first version header of a changelog,
 * or append them to the end when there are no version headers yet.
 * @param changelog - The changelog content chunks.
 * @param notes - The release notes to insert.
 * @yields The changelog content chunks with the release notes.
 */
async function* insertReleaseNotes(
  changelog: AsyncIterable<string>,
  notes: string
) {
  let isHeaderFound = false
  let isContentWritten = false
  // Not yet written tail: the last incomplete line and the trailing whitespace.
  let pending = ''

  for await (const chunk of changelog) {
    if (isHeaderFound) {
      yield chunk
      continue
    }

    pending += chunk

    // Only complete lines are searched, so a version header split between chunks is still found.
    const lastLineStart = pending.lastIndexOf('\n') + 1
    const headerIndex = pending.slice(0, lastLineStart).search(versionHeaderRegex)

    if (headerIndex !== -1) {
      isHeaderFound = true

      yield `${pending.slice(0, headerIndex)}${notes}\n${pending.slice(headerIndex)}`
    } else {
      const writtenEnd = Math.min(lastLineStart, pending.trimEnd().length)

      if (writtenEnd > 0) {
        isContentWritten = true

        yield pending.slice(0, writtenEnd)

        pending = pending.slice(writtenEnd)
      }
    }
  }

  if (isHeaderFound) {
    return
  }

  // At the end of the file the last line is complete too.
  const headerIndex = pending.search(versionHeaderRegex)

  if (headerIndex !== -1) {
    yield `${pending.slice(0, headerIndex)}${notes}\n${pending.slice(headerIndex)}`
  } else if (isContentWritten || pending.trim()) {
    // Changelog without releases yet, e.g. with an intro or an unreleased section only.
    yield `${pending.trimEnd()}\n\n${notes}`
  } else {
    yield `${changelogHeader}${notes}`
  }
}

/**
 * Add release notes to a changelog file.
 * @param changelogPath - The path to the changelog file.
 * @param notes - An async iterable of strings representing the release notes.
 * @returns The release notes that were added to the changelog.
 */
export async function addReleaseNotes(
  changelogPath: string,
  notes: AsyncIterable<string>
) {
  const changes = await concatStringStream(notes)
  const changelog = await isFileExists(changelogPath)
    ? createReadStream(changelogPath, 'utf-8')
    : Readable.from([])
  // Temporary file is placed next to the changelog, because files cannot be renamed across file systems.
  const tmpChangelogPath = tmpfile(`.${basename(changelogPath)}`, dirname(changelogPath))

  try {
    await pipeline(
      changelog,
      chunks => insertReleaseNotes(chunks, changes),
      createWriteStream(tmpChangelogPath)
    )
    await fs.rename(tmpChangelogPath, changelogPath)
  } finally {
    await fs.rm(tmpChangelogPath, {
      force: true
    })
  }

  return changes
}

function decodeTag(tag: string) {
  try {
    return decodeURIComponent(tag)
  } catch {
    return tag
  }
}

/**
 * Extract the last release notes from a changelog.
 * @param input - Changelog contents or its decoded text chunks.
 * @returns An object containing the release notes, previous tag, and next tag.
 */
export async function extractLastRelease(input: string | AsyncIterable<string>) {
  // Lines split between chunks are joined back.
  const lines = typeof input === 'string'
    ? input.split('\n')
    : splitStream(input, '\n')
  let inLastChanges = false
  let notes = ''
  let previousTag = ''
  let nextTag = ''
  let version = ''

  for await (const line of lines) {
    const versionMatch = line.match(versionHeaderRegex)

    if (versionMatch) {
      if (inLastChanges) {
        break
      }

      [, version] = versionMatch
      inLastChanges = true

      const tagsMatch = line.match(tagsRegex)

      if (tagsMatch) {
        // Tags are extracted from the compare link and can be URL-encoded.
        previousTag = decodeTag(tagsMatch[1])
        nextTag = decodeTag(tagsMatch[2])
      }

      continue
    }

    if (inLastChanges) {
      notes += `${line}\n`
    }
  }

  return {
    version,
    notes: notes.trim(),
    previousTag,
    nextTag
  }
}

/**
 * Extract the last release notes from a changelog file.
 * @param changelogPath - The path to the changelog file.
 * @returns An object containing the release notes, previous tag, and next tag.
 */
export async function extractLastReleaseFromFile(changelogPath: string) {
  if (!await isFileExists(changelogPath)) {
    return null
  }

  // Decoding by the stream keeps multibyte characters split between chunks.
  const input = createReadStream(changelogPath, 'utf-8')

  return await extractLastRelease(input)
}
