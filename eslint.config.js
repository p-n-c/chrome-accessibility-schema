import js from '@eslint/js'
import globals from 'globals'
import eslint from '@eslint/js'
import pluginJs from '@eslint/js'

export default [
  js.configs.recommended,
  eslint.configs.recommended,
  pluginJs.configs.recommended,
  {
    files: ['publish/**/*.js'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...jestPlugin.environments.globals,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
  },
]
