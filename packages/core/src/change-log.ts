/* oxlint-disable eslint/no-labels */
import {
  createReadStream,
  createWriteStream
} from 'fs'
import fs from 'fs/promises'
import {
  type FinalTemplateContext,
  segments
} from '@conventional-changelog/template'
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

export function preamblePartial(
  {
    preamble,
    commitGroups,
    noteGroups
  }: FinalTemplateContext
) {
  return segments(
    preamble,
    !commitGroups?.length && !noteGroups?.length && 'Version bump without any changes.'
  )
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
  const tmpChangelogPath = tmpfile('changelog')
  const isNewFile = !await isFileExists(changelogPath)
  const output = createWriteStream(tmpChangelogPath)
  let changes = ''

  if (isNewFile) {
    output.write(changelogHeader)

    for await (const chunk of notes) {
      output.write(chunk)
      changes += chunk
    }
  } else {
    const input = createReadStream(changelogPath)
    let isHeader = true
    let chunk: string

    for await (chunk of input) {
      chunk = chunk.toString()

      if (isHeader) {
        const headerIndex = chunk.search(versionHeaderRegex)

        if (headerIndex !== -1) {
          isHeader = false

          output.write(chunk.slice(0, headerIndex))

          chunk = chunk.slice(headerIndex)

          for await (const chunk of notes) {
            output.write(chunk)
            changes += chunk
          }

          output.write('\n')
        }
      }

      output.write(chunk)
    }

    await fs.rm(changelogPath)
  }

  await new Promise(output.end.bind(output))
  await fs.rename(tmpChangelogPath, changelogPath)

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
 * Extract the last release notes from a stream.
 * @param input
 * @returns An object containing the release notes, previous tag, and next tag.
 */
export async function extractLastRelease(input: string | string[] | Iterable<string> | AsyncIterable<string | Buffer>) {
  let stream = input
  let inLastChanges = false
  let notes = ''
  let chunk: Buffer | string
  let lines: string[]
  let line: string
  let previousTag = ''
  let nextTag = ''
  let version = ''

  if (typeof stream === 'string') {
    stream = [stream]
  }

  top: for await (chunk of stream) {
    lines = chunk.toString('utf8').split(/\n/)

    for (line of lines) {
      const versionMatch = line.match(versionHeaderRegex)

      if (versionMatch) {
        if (inLastChanges) {
          break top
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

  const input = createReadStream(changelogPath)

  return await extractLastRelease(input)
}
