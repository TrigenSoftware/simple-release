/* oxlint-disable eslint/no-labels */
import type { Readable } from 'stream'
import type { Options } from './types.js'

/**
 * Read last changes from changelog.
 * @param stream - Readable stream of file.
 * @param options
 * @returns Last version and notes from changelog.
 */
export async function readLastChangesFromStream(stream: Readable, options: Pick<Options, 'titleRegExp' | 'includeTitle'> = {}) {
  const {
    titleRegExp = /^#+ \[?([^[\]()\s]*\d+\.\d+\.\d+[^[\]()\s]*)\]?/,
    includeTitle = false
  } = options
  let inLastChanges = false
  let lastVersion: string | null = null
  let lastChanges = ''
  let chunk: Buffer
  let lines: string[]
  let line: string

  top: for await (chunk of stream) {
    lines = chunk.toString('utf8').split(/\n/)

    for (line of lines) {
      if (titleRegExp.test(line)) {
        if (inLastChanges) {
          break top
        }

        inLastChanges = true
        lastVersion = titleRegExp.exec(line)?.[1] ?? null

        if (!includeTitle) {
          continue
        }
      }

      if (inLastChanges) {
        lastChanges += `${line}\n`
      }
    }
  }

  stream.destroy()

  return [lastVersion, `${lastChanges.trim()}\n`] as const
}
