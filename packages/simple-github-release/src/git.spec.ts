import { describe, it, expect } from 'vitest'
import { getRemoteUrl, parseGitUrl } from './git.js'

describe('simple-github-release', () => {
  describe('git', () => {
    describe('getRemoteUrl', () => {
      it('should get remote url', async () => {
        expect(['git@github.com:TrigenSoftware/simple-release-tools.git', 'https://github.com/TrigenSoftware/simple-release-tools']).toContain(await getRemoteUrl())
      })
    })

    describe('parseGitUrl', () => {
      it('should parse git url', () => {
        expect(parseGitUrl('git@github.com:TrigenSoftware/simple-release-tools.git')).toEqual({
          host: 'github.com',
          owner: 'TrigenSoftware',
          project: 'simple-release-tools'
        })
      })
    })
  })
})
