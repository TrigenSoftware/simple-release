import { defineConfig } from '@trigen/oxlint'
import baseConfig from '@trigen/oxlint-config'
import moduleConfig from '@trigen/oxlint-config/module'

export default defineConfig({
  ignorePatterns: [
    '**/dist/',
    '**/package/'
  ],
  options: {
    typeAware: true,
    typeCheck: true
  },
  env: {
    node: true
  },
  extends: [
    baseConfig,
    moduleConfig
  ]
})
