import { defineConfig } from '@trigen/oxlint'
import testConfig from '@trigen/oxlint-config/test'
import tsTypeCheckedConfig from '@trigen/oxlint-config/typescript-type-checked'
import rootConfig from '../../oxlint.config.ts'

export default defineConfig({
  extends: [
    rootConfig,
    tsTypeCheckedConfig,
    testConfig
  ],
  rules: {
    'trigen/naming-convention': 'off',
    'typescript/no-explicit-any': 'off',
    'typescript/no-unsafe-call': 'off',
    'typescript/no-unsafe-return': 'off'
  }
})
