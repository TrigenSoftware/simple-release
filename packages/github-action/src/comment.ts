interface Comment {
  body?: string
  author_association: string
}

const ALLOWED_AUTHOR_ASSOCIATIONS = [
  'OWNER',
  'COLLABORATOR',
  'MEMBER'
]
const JSON_START = '```json'
const JSON_START_OFFSET = JSON_START.length
const JSON_END = '```'

export const SET_OPTION_COMMAND = '!simple-release/set-options'
export const SET_PREAMBLE_COMMAND = '!simple-release/set-preamble'

/**
 * All supported pull request comment commands.
 */
export const COMMANDS = [
  SET_OPTION_COMMAND,
  SET_PREAMBLE_COMMAND
]

/**
 * Whether the body starts with the command followed by whitespace or the end of
 * the body, so a longer token like `!simple-release/set-options-foo` is not treated as a match.
 * @param body - The comment body.
 * @param command - The command to look for.
 * @returns Whether the body is a comment for the command.
 */
function startsWithCommand(body: string, command: string) {
  if (!body.startsWith(command)) {
    return false
  }

  const nextChar = body[command.length]

  return nextChar === undefined || /\s/.test(nextChar)
}

/**
 * Whether the comment body is one of the supported command comments.
 * @param body - The comment body.
 * @returns Whether the body starts with a supported command.
 */
export function isCommandComment(body: string | undefined) {
  return typeof body === 'string' && COMMANDS.some(command => startsWithCommand(body, command))
}

export function parseSetOptionsComment(comment: Comment): string | null {
  if (ALLOWED_AUTHOR_ASSOCIATIONS.includes(comment.author_association)) {
    const { body } = comment

    if (body && startsWithCommand(body, SET_OPTION_COMMAND)) {
      const start = body.indexOf(JSON_START)
      // Close on the first fence after the opening one, so extra fenced blocks
      // later in the comment do not extend the extracted JSON.
      const end = start === -1
        ? -1
        : body.indexOf(JSON_END, start + JSON_START_OFFSET)

      // Require a proper ```json ... ``` block, otherwise there is nothing to parse.
      if (start === -1 || end === -1) {
        return null
      }

      return body.substring(start + JSON_START_OFFSET, end).trim()
    }
  }

  return null
}

export interface SetPreamble {
  /**
   * The full package name the preamble targets, or undefined for the whole release.
   */
  name?: string
  /**
   * The markdown to insert into the changelog preamble.
   */
  preamble: string
}

export function parseSetPreambleComment(comment: Comment): SetPreamble | null {
  if (ALLOWED_AUTHOR_ASSOCIATIONS.includes(comment.author_association)) {
    const { body } = comment

    if (body && startsWithCommand(body, SET_PREAMBLE_COMMAND)) {
      const newlineIndex = body.indexOf('\n')
      const firstLine = newlineIndex === -1
        ? body
        : body.slice(0, newlineIndex)
      // The argument is the full package name, optionally wrapped in backticks.
      const name = firstLine.slice(SET_PREAMBLE_COMMAND.length).replace(/`/g, '').trim().split(/\s+/)[0] || undefined
      const preamble = newlineIndex === -1
        ? ''
        : body.slice(newlineIndex + 1).trim()

      if (preamble) {
        return {
          name,
          preamble
        }
      }
    }
  }

  return null
}
