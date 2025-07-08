import { globalIgnores } from 'eslint/config'
import baseConfig from '@trigen/eslint-config'
import moduleConfig from '@trigen/eslint-config/module'
import env from '@trigen/eslint-config/env'

export default [
  globalIgnores(['**/dist/', '**/package/']),
  ...baseConfig,
  ...moduleConfig,
  env.node
]
