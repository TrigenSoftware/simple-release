import fs from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { GitClient } from '@conventional-changelog/git-client'

type CommitType = 'feat' | 'fix' | 'perf' | 'chore'

export function commitMessage(type: CommitType, scope?: string) {
  return `${type}${scope ? `(${scope})` : ''}: commit message for ${type}`
}

export interface ActionContext {
  cwd: string
  git: GitClient
}

export type Action = (ctx: ActionContext) => Promise<unknown>

export type RepositoryRunner = (actions: Action[], dir?: string) => Promise<void>

export async function updateDummyFile(dir: string) {
  await fs.rm(join(dir, 'dummy'), {
    force: true
  })
  await fs.writeFile(join(dir, 'dummy'), `${Math.random()}\n`)
}

function sh(cwd: string, cmd: string) {
  return new Promise<void>((resolve, reject) => exec(
    cmd,
    {
      cwd
    },
    (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
  ))
}

export async function createRepository(tmpdir: string) {
  const git = new GitClient(tmpdir)
  const baseCtx = {
    cwd: tmpdir,
    git
  }

  await git.init()
  await sh(tmpdir, 'git remote add origin git@github.com:TrigenSoftware/test-repo.git')
  await sh(tmpdir, 'git config user.email "nobody@unknown.test"')
  await sh(tmpdir, 'git config user.name "Tester Testerson"')

  return async (actions: Action[], dir?: string) => {
    const ctx = dir
      ? {
        cwd: dir,
        git: new GitClient(dir)
      }
      : baseCtx

    for (const action of actions) {
      await action(ctx)
    }
  }
}

export async function dummyCommit(
  ctx: ActionContext,
  type: CommitType,
  scope?: string
) {
  await updateDummyFile(ctx.cwd)
  await ctx.git.add('dummy')
  await ctx.git.commit({
    allowEmpty: true,
    message: commitMessage(type, scope)
  })
}
