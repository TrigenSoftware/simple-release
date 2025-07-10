import type { ConventionalGitClient } from '@conventional-changelog/git-client'
import type { ProjectManifest } from '../manifest/index.js'
import type {
  ProjectOptions,
  ProjectBumpOptions,
  Project
} from './project.js'

export type MonorepoMode = 'fixed' | 'independent'

export type GetProjectsOptions = Required<Pick<ProjectOptions, 'compose' | 'gitClient' | 'manifest'>>

export interface MonorepoProjectOptions extends ProjectOptions {
  /**
   * The mode of the monorepo.
   * If mode is 'fixed', all projects will be bumped to the same version.
   * If mode is 'independent', each project will be bumped to its own version.
   */
  mode: MonorepoMode
  /**
   * Hook function to compose the manifest.
   * @param manifest - The manifest to compose.
   */
  compose?(manifest: ProjectManifest, isRoot?: boolean): ProjectManifest
  /**
   * Get projects in the monorepo.
   */
  getProjects(options: GetProjectsOptions): AsyncIterable<Project>
  /**
   * Get the scope for the project of monorepo.
   * @param projectName - Project name to get the scope for.
   * @param rootName - The name of the root project.
   * @returns The scope for the project.
   */
  scope?(projectName: string, rootName: string): string | Promise<string>
  /**
   * Get the tag prefix for the project of monorepo.
   * @param scope - The scope name of the project.
   * @returns The tag prefix for the project.
   */
  tagPrefix?(scope: string): string | Promise<string>
  /**
   * The git client used to interact with the repository.
   */
  gitClient?: ConventionalGitClient
}

export type MonorepoProjectBumpByProjectOptions = Pick<ProjectBumpOptions, 'version' | 'as' | 'prerelease' | 'firstRelease' | 'skip'>

export interface MonorepoProjectBumpOptions extends Omit<ProjectBumpOptions, 'tagPrefix'> {
  /**
   * Force bump projects without changes in the monorepo with fixed mode.
   */
  force?: boolean
  /**
   * Extra scopes to include in the project's changelog.
   * For example, to include commits like "fix(deps): voulnerability in dependency fix" you can add "deps" to the extraScopes.
   */
  extraScopes?: string[]
  /**
   * Bump options for specific projects.
   */
  byProject?: Record<string, MonorepoProjectBumpByProjectOptions>
}
