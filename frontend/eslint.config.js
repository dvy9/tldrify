// @ts-check

import eslintReact from '@eslint-react/eslint-plugin'
import eslintJs from '@eslint/js'
import perfectionist from 'eslint-plugin-perfectionist'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import TSCONFIG_APP from './tsconfig.app.json' with { type: 'json' }
import TSCONFIG_NODE from './tsconfig.node.json' with { type: 'json' }

const GLOB_TS = ['**/*.ts', '**/*.tsx']

export default defineConfig([
  globalIgnores(['dist/*']),
  {
    files: GLOB_TS,
    extends: [eslintJs.configs.recommended, tseslint.configs.recommended]
  },
  {
    files: TSCONFIG_APP.include,
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-import-type-side-effects': 'error'
    }
  },
  {
    files: TSCONFIG_NODE.include,
    ignores: TSCONFIG_NODE.exclude,
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',
        projectService: false
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: TSCONFIG_APP.include,
    extends: [
      eslintReact.configs['recommended-type-checked'],
      eslintPluginReactRefresh.configs.recommended
    ],
    plugins: {
      'react-hooks': eslintPluginReactHooks
    },
    rules: {
      // @ts-ignore
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off' // too many violations
    }
  },
  {
    plugins: {
      perfectionist
    },
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'type',
            ['parent-type', 'sibling-type', 'index-type', 'internal-type'],
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'side-effect',
            'object',
            'unknown'
          ],
          newlinesBetween: 0,
          order: 'asc',
          type: 'natural'
        }
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          order: 'asc',
          type: 'natural'
        }
      ]
    }
  }
])
