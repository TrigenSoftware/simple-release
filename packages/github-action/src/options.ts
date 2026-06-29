import {
  getBooleanInput,
  getInput
} from '@actions/core'

function omitEmpty<T extends object>(object: T) {
  const result = {} as Partial<T>

  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'boolean' || Boolean(value)) {
      result[key as keyof T] = value as T[keyof T]
    }
  }

  return result
}

function getOptionalBooleanInput(name: string) {
  return getInput(name) ? getBooleanInput(name) : undefined
}

function getOptionalJsonInput(name: string) {
  const value = getInput(name)

  // oxlint-disable-next-line typescript/no-empty-object-type
  return value ? JSON.parse(value) as {} : undefined
}

export function getInputOptions() {
  return {
    GITHUB_TOKEN: getInput('github-token', {
      required: true
    }),
    NODE_AUTH_TOKEN: getInput('npm-token'),
    PUBLISH_TOKEN: getInput('publish-token'),
    checkout: omitEmpty({
      branch: getInput('branch')
    }),
    bump: omitEmpty({
      version: getInput('bump-version'),
      as: getInput('bump-as'),
      prerelease: getInput('bump-prerelease'),
      snapshot: getInput('bump-snapshot'),
      firstRelease: getOptionalBooleanInput('bump-first-release'),
      skip: getOptionalBooleanInput('bump-skip'),
      byProject: getOptionalJsonInput('bump-by-project')
    }),
    maintenanceBranch: omitEmpty({
      enabled: getOptionalBooleanInput('maintenance-branch')
    }),
    publish: omitEmpty({
      skip: getOptionalBooleanInput('publish-skip'),
      access: getInput('publish-access'),
      tag: getInput('publish-tag')
    })
  }
}
