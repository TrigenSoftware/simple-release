import fs from 'fs'
import type {
  Options,
  LocalContext
} from '../index.js'
import {
  getRemoteUrl,
  getLatestTagName,
  parseGitUrl,
  readLastChangesFromStream
} from '../index.js'

async function getRepo() {
  const remoteUrl = await getRemoteUrl()
  const repo = parseGitUrl(remoteUrl)

  return repo
}

async function getVersionFromPackageJson() {
  const contents = await fs.promises.readFile('package.json', 'utf8')
  const pkg = JSON.parse(contents) as { version: string }

  return pkg.version
}

async function getVersionAndNotes(options: Options) {
  let version = ''
  let notes = ''

  if (options.changelogLocation) {
    try {
      const [maybeVersion, maybeNotes] = await readLastChangesFromStream(
        fs.createReadStream(options.changelogLocation),
        options
      )

      if (maybeVersion) {
        version = maybeVersion
      }

      notes = maybeNotes
    } catch {}
  }

  if (!version) {
    version = await getVersionFromPackageJson()
  }

  return [version, notes] as const
}

export async function getContext(options: Options): Promise<LocalContext> {
  const [
    repo,
    latestTagName,
    [version, notes]
  ] = await Promise.all([
    getRepo(),
    getLatestTagName(),
    getVersionAndNotes(options)
  ])
  const tag = latestTagName ?? `v${version.replace(/^v/, '')}`

  return {
    repo,
    tag,
    version,
    notes
  }
}
