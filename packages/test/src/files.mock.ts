import { fileURLToPath } from 'url'
import {
  dirname,
  join
} from 'path'
import fs from 'fs/promises'
import { afterAll } from 'vitest'
import { tmpfile } from '../../core/src/utils.js'

export { tmpfile }

export const dir = dirname(fileURLToPath(import.meta.url))

export function readMockFile(file: string) {
  return fs.readFile(join(dir, file), 'utf-8')
}

export function getMockFilePath(file: string) {
  return join(dir, file)
}

const gc: string[] = []

export async function copyMockFile(file: string) {
  const src = join(dir, file)
  const dest = tmpfile(file)

  await fs.cp(src, dest)

  gc.push(dest)

  return dest
}

export async function createDirectory(prefix: string) {
  const tmp = tmpfile(prefix)

  await fs.mkdir(tmp, {
    recursive: true
  })

  gc.push(tmp)

  return tmp
}

afterAll(async () => {
  if (gc.length === 0) {
    return
  }

  const filesToDelete = gc.slice()

  gc.length = 0

  for (const file of filesToDelete) {
    await fs.rm(file, {
      recursive: true,
      force: true
    })
  }
})
