import {
  describe,
  it,
  expect
} from 'vitest'
import { octokit } from '../test/mocks/octokit.mock.js'
import { GitHubClient } from './github.js'
import { parseGitUrl } from './git.js'

describe('simple-github-release', () => {
  describe('github', () => {
    describe('GitHubClient', () => {
      let client: GitHubClient

      it('should create instance', () => {
        client = new GitHubClient({
          repo: parseGitUrl('git@github.com:TrigenSoftware/simple-github-release.git')
        })

        // @ts-expect-error Inject mock client for tests.
        client.client = octokit
      })

      describe('getLatestRelease', () => {
        it('should return latest release if exist', async () => {
          expect(await client.getLatestRelease()).toEqual({
            id: 1,
            tag: 'v1.0.0'
          })
        })

        it('should return null if no any releases', async () => {
          octokit.shouldThrowError = true

          expect(await client.getLatestRelease()).toBe(null)
        })
      })

      describe('createRelease', () => {
        it('should create release', async () => {
          expect(await client.createRelease({
            name: 'v1.0.0',
            tag: 'v1.0.0'
          })).toEqual({
            id: 1,
            releaseUrl: 'https://github.com/release'
          })
        })
      })

      describe('updateRelease', () => {
        it('should update release', async () => {
          expect(await client.updateRelease(1, {
            name: 'v1.0.0',
            tag: 'v1.0.0'
          })).toEqual({
            id: 1,
            releaseUrl: 'https://github.com/release'
          })
        })
      })

      describe('createReleaseUrl', () => {
        it('should create url', () => {
          expect(client.createReleaseUrl({
            name: 'v1.0.0',
            tag: 'v1.0.0'
          })).toBe('https://github.com/TrigenSoftware/simple-github-release/releases/tag/v1.0.0')
        })
      })

      describe('createBrowserReleaseUrl', () => {
        it('should create url', () => {
          expect(client.createBrowserReleaseUrl({
            name: 'v1.0.0',
            tag: 'v1.0.0'
          })).toBe('https://github.com/TrigenSoftware/simple-github-release/releases/new?tag=v1.0.0&title=v1.0.0&prerelease=false')
        })
      })
    })
  })
})
