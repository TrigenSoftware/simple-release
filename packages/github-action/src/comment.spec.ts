import {
  describe,
  it,
  expect
} from 'vitest'
import {
  SET_OPTION_COMMAND,
  SET_PREAMBLE_COMMAND,
  isCommandComment,
  parseSetPreambleComment,
  parseSetOptionsComment
} from './comment.js'

const owner = 'OWNER'

describe('github-action', () => {
  describe('comment', () => {
    describe('parseSetPreambleComment', () => {
      it('should parse a global preamble', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND}\n\n## What's new?\n\n- x`
        })).toEqual({
          name: undefined,
          preamble: '## What\'s new?\n\n- x'
        })
      })

      it('should parse a package-scoped preamble by full name', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND} @org/core\n\n## Core\n\n- y`
        })).toEqual({
          name: '@org/core',
          preamble: '## Core\n\n- y'
        })
      })

      it('should strip backticks around the package name', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND} \`@org/core\`\n\n## Core`
        })).toEqual({
          name: '@org/core',
          preamble: '## Core'
        })
      })

      it('should ignore an empty preamble body', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND} @org/core\n\n   `
        })).toBeNull()
      })

      it('should ignore a command with a longer suffix', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND}-foo\n\n## Nope`
        })).toBeNull()
      })

      it('should ignore comments from untrusted authors', () => {
        expect(parseSetPreambleComment({
          author_association: 'NONE',
          body: `${SET_PREAMBLE_COMMAND}\n\n## Nope`
        })).toBeNull()
      })

      it('should ignore unrelated comments', () => {
        expect(parseSetPreambleComment({
          author_association: owner,
          body: 'just a normal comment'
        })).toBeNull()
      })
    })

    describe('parseSetOptionsComment', () => {
      it('should extract the json block', () => {
        expect(parseSetOptionsComment({
          author_association: owner,
          body: `${SET_OPTION_COMMAND}\n\n\`\`\`json\n{ "bump": { "as": "major" } }\n\`\`\``
        })).toBe('{ "bump": { "as": "major" } }')
      })

      it('should extract only the json block when more code blocks follow', () => {
        expect(parseSetOptionsComment({
          author_association: owner,
          body: `${SET_OPTION_COMMAND}\n\n\`\`\`json\n{ "bump": {} }\n\`\`\`\n\nExample:\n\n\`\`\`bash\nnpm i\n\`\`\``
        })).toBe('{ "bump": {} }')
      })

      it('should ignore a set-options comment without a json block', () => {
        expect(parseSetOptionsComment({
          author_association: owner,
          body: `${SET_OPTION_COMMAND}\n\nno code block here`
        })).toBeNull()
      })

      it('should ignore a command with a longer suffix', () => {
        expect(parseSetOptionsComment({
          author_association: owner,
          body: `${SET_OPTION_COMMAND}-foo\n\n\`\`\`json\n{}\n\`\`\``
        })).toBeNull()
      })

      it('should not treat a set-preamble comment as set-options', () => {
        expect(parseSetOptionsComment({
          author_association: owner,
          body: `${SET_PREAMBLE_COMMAND}\n\n## What's new?`
        })).toBeNull()
      })
    })

    describe('isCommandComment', () => {
      it('should detect command comments', () => {
        expect(isCommandComment(`${SET_OPTION_COMMAND}\n\n\`\`\`json\n{}\n\`\`\``)).toBe(true)
        expect(isCommandComment(`${SET_PREAMBLE_COMMAND} @org/core\n\n## x`)).toBe(true)
      })

      it('should ignore mentions, suffixes and empty bodies', () => {
        expect(isCommandComment(`please run ${SET_OPTION_COMMAND}`)).toBe(false)
        expect(isCommandComment(`${SET_PREAMBLE_COMMAND}-foo`)).toBe(false)
        expect(isCommandComment(undefined)).toBe(false)
      })
    })
  })
})
