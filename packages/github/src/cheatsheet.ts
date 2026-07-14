export const CHEATSHEET = `

You can configure the bot's behavior through a pull request comment using the \`!simple-release/set-options\` command.

### Command Format

\`\`\`\`md
!simple-release/set-options

\`\`\`json
{
  "bump": {},
  "publish": {}
}
\`\`\`
\`\`\`\`

### Useful Parameters

#### Bump

| Parameter | Type | Description |
|-----------|------|-------------|
| \`version\` | \`string\` | Force set specific version |
| \`as\` | \`'major' \\| 'minor' \\| 'patch' \\| 'prerelease'\` | Release type |
| \`prerelease\` | \`string\` | Pre-release identifier (e.g., "alpha", "beta") |
| \`firstRelease\` | \`boolean\` | Whether this is the first release |
| \`skip\` | \`boolean\` | Skip version bump |
| \`byProject\` | \`Record<string, object>\` | Per-project bump options for monorepos |

#### Publish

| Parameter | Type | Description |
|-----------|------|-------------|
| \`skip\` | \`boolean\` | Skip publishing |
| \`access\` | \`'public' \\| 'restricted'\` | Package access level |
| \`tag\` | \`string\` | Tag for npm publication |

### Usage Examples

#### Force specific version

\`\`\`\`md
!simple-release/set-options

\`\`\`json
{
  "bump": {
    "version": "2.0.0"
  }
}
\`\`\`
\`\`\`\`

#### Force major bump

\`\`\`\`md
!simple-release/set-options

\`\`\`json
{
  "bump": {
    "as": "major"
  }
}
\`\`\`
\`\`\`\`

#### Create alpha pre-release

\`\`\`\`md
!simple-release/set-options

\`\`\`json
{
  "bump": {
    "prerelease": "alpha"
  }
}
\`\`\`
\`\`\`\`

#### Publish with specific access and tag

\`\`\`\`md
!simple-release/set-options

\`\`\`json
{
  "bump": {
    "prerelease": "beta"
  },
  "publish": {
    "access": "public",
    "tag": "beta"
  }
}
\`\`\`
\`\`\`\`

### Custom Changelog Preamble

You can add custom markdown to the top of the changelog (right after the version header) using the \`!simple-release/set-preamble\` command. The markdown after the command line becomes the preamble.

\`\`\`md
!simple-release/set-preamble

## What's new?

- The website was completely redesigned
- The new API gives you awesome possibilities
\`\`\`

In a monorepo, pass the full package name after the command to target a single package's changelog. Wrap the name in backticks so GitHub keeps it as text instead of a mention:

\`\`\`md
!simple-release/set-preamble \`@your-org/core\`

## Core changes

- New plugin system
\`\`\`

Use one comment per package, plus one without a name for the whole release.

### Access Restrictions

The commands can only be used by users with permissions:
- repository owner
- organization member
- collaborator

### Notes

- The last comment with \`!simple-release/set-options\` command takes priority
- The last \`!simple-release/set-preamble\` comment per package takes priority
- JSON must be valid, otherwise the \`set-options\` command will be ignored
- Parameters apply only to the current release execution
- The commands can be updated by editing the comment or adding a new one
`
