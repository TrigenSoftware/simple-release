import {
  join,
  basename
} from 'path'
import fs from 'fs/promises'
import { afterAll } from 'vitest'
import {
  createDirectory,
  getMockFilePath
} from './files.mock.js'
import {
  type RepositoryRunner,
  dummyCommit,
  createRepository
} from './git.mock.js'

export interface ProjectContext {
  cwd: string
  run: RepositoryRunner
}

function base64(text: string) {
  return Buffer.from(text).toString('base64')
}

const cache = new Map<string, ProjectContext>()

async function createCachedProject(
  type: string,
  manifest: string,
  runner: (ctx: ProjectContext) => Promise<void>
) {
  const snapshot = base64(manifest)

  if (cache.has(snapshot)) {
    return cache.get(snapshot)!
  }

  const cwd = await createDirectory(type)
  const run = await createRepository(cwd)
  const ctx = {
    cwd,
    run
  }

  cache.set(snapshot, ctx)

  await runner(ctx)

  return ctx
}

export async function forkProject(id: string, srcCtxPromise: ProjectContext | Promise<ProjectContext>) {
  const type = `fork-${id}`
  const { cwd: srcPath } = await srcCtxPromise
  const snapshot = `${type}-${basename(srcPath)}`

  if (cache.has(snapshot)) {
    return cache.get(snapshot)!
  }

  const cwd = await createDirectory(type)
  const run = await createRepository(cwd)
  const ctx = {
    cwd,
    run
  }

  cache.set(snapshot, ctx)

  await fs.cp(
    srcPath,
    cwd,
    {
      recursive: true
    }
  )

  return ctx
}

export interface PackageJsonProjectOptions {
  postReleaseCommits?: boolean
}

export async function packageJsonProject(
  pkg: Record<string, unknown> = {},
  options: PackageJsonProjectOptions = {}
) {
  const { postReleaseCommits = true } = options
  const json = JSON.stringify({
    name: 'package-json-project',
    version: '2.0.0',
    description: 'A package json project',
    ...pkg
  })

  return createCachedProject(
    'package-json-project',
    JSON.stringify({
      json,
      postReleaseCommits
    }),
    async ({
      cwd,
      run
    }) => {
      await fs.writeFile(
        join(cwd, 'package.json'),
        json
      )

      await fs.cp(
        getMockFilePath('CHANGELOG_3.md'),
        join(cwd, 'CHANGELOG.md')
      )

      await run([
        ({ git }) => git.add(['package.json', 'CHANGELOG.md']),
        ctx => dummyCommit(ctx, 'feat'),
        ({ git }) => git.tag({
          name: 'v2.0.0'
        })
      ])

      if (postReleaseCommits) {
        await run([
          ctx => dummyCommit(ctx, 'feat'),
          ctx => dummyCommit(ctx, 'fix')
        ])
      }
    }
  )
}

export async function packageJsonIndependentMonorepoProject(pkgs: Record<string | number, Record<string, unknown>> = {}) {
  const pkgJsons = {
    ...pkgs,
    0: {
      name: 'package-json-monorepo-project',
      version: '0.0.0',
      description: 'A package json monorepo project',
      private: true,
      ...pkgs[0]
    },
    1: {
      name: 'subproject-1',
      version: '2.0.0',
      description: 'A subproject of package json monorepo project',
      ...pkgs[1]
    },
    2: {
      name: 'subproject-2',
      version: '2.0.0',
      description: 'Another subproject of package json monorepo project',
      ...pkgs[2]
    },
    3: {
      name: 'subproject-3',
      version: '2.0.0',
      description: 'Yet another subproject of package json monorepo project',
      ...pkgs[3]
    }
  }
  const json = JSON.stringify(pkgJsons)

  return createCachedProject(
    'package-json-independent-monorepo-project',
    json,
    async ({
      cwd,
      run
    }) => {
      await fs.writeFile(
        join(cwd, 'package.json'),
        JSON.stringify(pkgJsons[0])
      )

      await fs.mkdir(join(cwd, 'packages'), {
        recursive: true
      })

      await run([({ git }) => git.add('package.json'), ctx => dummyCommit(ctx, 'chore')])

      const projects = Object.values(pkgJsons).slice(1)

      for (const pkg of projects) {
        const projectDir = join(cwd, 'packages', pkg.name)

        await fs.mkdir(projectDir, {
          recursive: true
        })

        await fs.writeFile(
          join(projectDir, 'package.json'),
          JSON.stringify(pkg)
        )

        await fs.cp(
          getMockFilePath('CHANGELOG_3.md'),
          join(projectDir, 'CHANGELOG.md')
        )

        await run([
          ({ git }) => git.add(['package.json', 'CHANGELOG.md']),
          ctx => dummyCommit(ctx, 'feat', pkg.name),
          ({ git }) => git.tag({
            name: `${pkg.name}@2.0.0`
          }),
          ctx => dummyCommit(ctx, 'feat', pkg.name),
          ctx => dummyCommit(ctx, 'fix', pkg.name)
        ], projectDir)
      }
    }
  )
}

export interface PackageJsonFixedMonorepoProjectOptions {
  postReleaseCommits?: boolean
}

export async function packageJsonFixedMonorepoProject(
  pkgs: Record<string | number, Record<string, unknown>> = {},
  options: PackageJsonFixedMonorepoProjectOptions = {}
) {
  const { postReleaseCommits = true } = options
  const pkgJsons = {
    ...pkgs,
    0: {
      name: 'package-json-monorepo-project',
      version: '2.0.0',
      description: 'A package json monorepo project',
      private: true,
      ...pkgs[0]
    },
    1: {
      name: 'subproject-1',
      version: '2.0.0',
      description: 'A subproject of package json monorepo project',
      ...pkgs[1]
    },
    2: {
      name: 'subproject-2',
      version: '2.0.0',
      description: 'Another subproject of package json monorepo project',
      ...pkgs[2]
    },
    3: {
      name: 'subproject-3',
      version: '2.0.0',
      description: 'Yet another subproject of package json monorepo project',
      ...pkgs[3]
    }
  }
  const json = JSON.stringify({
    pkgJsons,
    postReleaseCommits
  })

  return createCachedProject(
    'package-json-fixed-monorepo-project',
    json,
    async ({
      cwd,
      run
    }) => {
      await fs.writeFile(
        join(cwd, 'package.json'),
        JSON.stringify(pkgJsons[0])
      )

      await fs.cp(
        getMockFilePath('CHANGELOG_3.md'),
        join(cwd, 'CHANGELOG.md')
      )

      await fs.mkdir(join(cwd, 'packages'), {
        recursive: true
      })

      await run([({ git }) => git.add(['package.json', 'CHANGELOG.md']), ctx => dummyCommit(ctx, 'chore')])

      const projects = Object.values(pkgJsons).slice(1)

      for (const pkg of projects) {
        const projectDir = join(cwd, 'packages', pkg.name)

        await fs.mkdir(projectDir, {
          recursive: true
        })
      }

      for (const pkg of projects) {
        const projectDir = join(cwd, 'packages', pkg.name)

        await fs.writeFile(
          join(projectDir, 'package.json'),
          JSON.stringify(pkg)
        )

        await fs.cp(
          getMockFilePath('CHANGELOG_3.md'),
          join(projectDir, 'CHANGELOG.md')
        )

        await run([({ git }) => git.add(['package.json', 'CHANGELOG.md'])], projectDir)
      }

      await run([
        ({ git }) => git.commit({
          message: 'chore: init'
        }),
        ({ git }) => git.tag({
          name: 'v2.0.0'
        })
      ])

      const prj2Dir = join(cwd, 'packages', 'subproject-2')
      const prj3Dir = join(cwd, 'packages', 'subproject-3')

      if (postReleaseCommits) {
        await run([ctx => dummyCommit(ctx, 'fix', 'subproject-2')], prj2Dir)
        await run([ctx => dummyCommit(ctx, 'feat', 'subproject-3')], prj3Dir)
      }
    }
  )
}

afterAll(() => {
  cache.clear()
})
