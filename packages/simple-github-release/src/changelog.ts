import type { Readable } from 'stream'
import type { Options } from './types.js'

/**
 * Read lines from a text stream.
 * @param stream - Readable stream of text.
 * @yields Lines without line breaks, including lines split between chunks.
 */
async function* readLines(stream: Readable) {
  let incompleteLine = ''

  // Decoding by the stream keeps multibyte characters split between chunks.
  for await (const chunk of stream.setEncoding('utf8')) {
    const lines = `${incompleteLine}${chunk}`.split('\n')

    incompleteLine = lines.pop() ?? ''

    yield* lines
  }

  yield incompleteLine
}

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

  for await (const line of readLines(stream)) {
    if (titleRegExp.test(line)) {
      if (inLastChanges) {
        break
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

  stream.destroy()

  return [lastVersion, `${lastChanges.trim()}\n`] as const
}
