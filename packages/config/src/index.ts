import fs from 'fs/promises'
import type {
  ReleaserStepsOptions,
  Project,
  GitRepositoryHosting,
  ReleaserOptions
} from '@simple-release/core'
import { findUp } from 'find-up-simple'

const VARIANTS = [
  '.simple-release.js',
  '.simple-release.mjs',
  '.simple-release.cjs',
  '.simple-release.json'
]

export interface SimpleReleaseConfig<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting
> extends ReleaserStepsOptions<P, G> {
  project?: P
  hosting?: G
  releaser?: Omit<ReleaserOptions, 'project' | 'hosting'>
}

export type SimpleReleaseConfigRequirements = {
  config?: boolean
} & {
  [K in keyof SimpleReleaseConfig]?: boolean
}

type ApplyRequirements<T extends Record<string, any>, R extends Record<string, any>> = {
  [K in keyof T as K extends keyof R ? R[K] extends true ? K : never : never]-?: Exclude<T[K], undefined>
} & {
  [K in keyof T as K extends keyof R ? R[K] extends true ? never : K : K]: T[K]
}

type ApplyConfigRequirement<R extends { config?: boolean }, T> = R extends { config: true }
  ? T
  : T | null

type Result<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting,
  R extends SimpleReleaseConfigRequirements = SimpleReleaseConfigRequirements
> = ApplyRequirements<SimpleReleaseConfig<P, G>, R> extends infer C
  ? ApplyConfigRequirement<R, C>
  : never

interface ParsedImportQuery {
  path: string
  version?: string
  symbol?: string
}

type Loader<T = Record<string, any>> = (
  path: string,
  version: string | undefined,
  rawConfig: Record<string, any>
) => Promise<T>

function validate(target: Record<string, any>, rules: Record<string, any>) {
  for (const [rule, required] of Object.entries(rules)) {
    if (required && target[rule] === undefined) {
      throw new Error(`Faild to load config: '${rule}' is required`)
    }
  }
}

const IMPORT_QUERY_REGEX = /^(@?[^@#]*)(@[^#]+)?(#.*)?$/

export function parseImportQuery(
  importPath: string
): ParsedImportQuery {
  const match = importPath.match(IMPORT_QUERY_REGEX)

  if (!match) {
    return {
      path: importPath
    }
  }

  const [
    ,
    path,
    version,
    symbol
  ] = match

  return {
    path,
    version: version?.slice(1),
    symbol: symbol?.slice(1)
  }
}

export async function loadClass<T, C extends SimpleReleaseConfig>(
  queryWithOptions: string | [string, Record<string, any>],
  config: C,
  loader: Loader = _ => import(_)
) {
  const [query, options] = Array.isArray(queryWithOptions)
    ? queryWithOptions
    : [queryWithOptions]
  const {
    path,
    version,
    symbol
  } = parseImportQuery(query)
  const module = await loader(path, version, config)
  const inst = new module[symbol || 'default'](options) as T

  return inst
}

export function isQuery(value: unknown): value is string | [string, Record<string, any>] {
  return typeof value === 'string' || (
    Array.isArray(value)
    && value.length === 2
    && typeof value[0] === 'string'
    && value[1] && typeof value[1] === 'object'
  )
}

export function getQuery(queryWithOptions: unknown): string | null {
  return isQuery(queryWithOptions)
    ? typeof queryWithOptions === 'string'
      ? queryWithOptions
      : queryWithOptions[0]
    : null
}

async function loadAndSetIfQuery(
  config: SimpleReleaseConfig,
  key: keyof SimpleReleaseConfig,
  loader?: Loader
) {
  const value = config[key]

  if (value && isQuery(value)) {
    // oxlint-disable-next-line eslint/require-atomic-updates
    config[key] = await loadClass(value, config, loader)
  }
}

async function importConfig(path: string) {
  if (path.endsWith('.json')) {
    const json = await fs.readFile(path, 'utf-8')
    const config = JSON.parse(json) as SimpleReleaseConfig

    return config
  }

  const module = await import(path) as SimpleReleaseConfig | { default: SimpleReleaseConfig }
  const config = 'default' in module ? module.default : module

  return {
    ...config
  }
}

/**
 * Load simple-release config.
 * @param requirements
 * @param loader
 * @returns simple-release config
 */
export async function load<
  P extends Project = Project,
  G extends GitRepositoryHosting = GitRepositoryHosting,
  R extends SimpleReleaseConfigRequirements = SimpleReleaseConfigRequirements
>(
  requirements?: R,
  loader?: Loader
): Promise<Result<P, G, R>>

export async function load(
  requirements: Record<string, any> = {},
  loader?: Loader
) {
  const {
    config: configRequired,
    ...reqs
  } = requirements

  for (const variant of VARIANTS) {
    const foundPath = await findUp(variant)

    if (foundPath) {
      try {
        const config = await importConfig(foundPath)

        validate(config, reqs)

        await loadAndSetIfQuery(config, 'project', loader)
        await loadAndSetIfQuery(config, 'hosting', loader)

        return config
      } catch (err) {
        if (configRequired) {
          throw err
        }

        return null
      }
    }
  }

  if (configRequired) {
    throw new Error('Config not found')
  }

  return null
}
