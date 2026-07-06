import { context } from '@actions/github'
import type { ReleaserGithubAction } from './releaser.js'
import { SET_OPTION_COMMAND } from './comment.js'

export async function ifReleaseCommit(releaser: ReleaserGithubAction) {
  const {
    gitClient,
    project
  } = releaser
  const message = await gitClient.exec('log', '-1', '--pretty=%B')

  if (!message.startsWith('chore(release):')) {
    return false
  }

  if (!releaser.options.dryRun) {
    await gitClient.fetch({
      tags: true
    })
  }

  const tags = await project.getTags()

  return tags.length > 0
}

export function ifSetOptionsComment() {
  const {
    eventName,
    payload: {
      issue,
      comment
    }
  } = context
  const isPullRequest = issue?.pull_request as unknown
  const issueAuthor = (issue?.user as { login: string } | undefined)?.login
  const issueBody = issue?.body
  const issueState = issue?.state as string
  const commentBody = (comment as { body?: string } | undefined)?.body

  if (eventName === 'issue_comment') {
    if (isPullRequest
      && issueAuthor === 'github-actions[bot]'
      && issueState === 'open'
      && issueBody?.includes('simple-release-pull-request: true')
      && commentBody?.includes(SET_OPTION_COMMAND)
    ) {
      const matches = issueBody.match(/simple-release-branch-to:\s*([^\s]+)/)

      if (matches) {
        return matches[1]
      }
    }

    return false // not a pull request comment, stop action
  }

  return null // continue
}
