import withNuxt from './.nuxt/eslint.config.mjs';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

export default withNuxt(
  { ignores: ['components/ui/**', 'pages/template.vue', 'iconfont/**', '.backups/**'] },
  ...compat.extends('airbnb-base').map(config => ({
    ...config,
    plugins: {},
  })),
  ...compat.extends('prettier'),
  {
    files: [
      'server/utils/imageProcessing/**/*.ts',
      'server/utils/pngToSvg.ts',
      'tests/unit/imageProcessing/**/*.ts',
      'tests/unit/pngToSvg.test.ts',
    ],
    rules: {
      // Low-level pixel/loop processing — airbnb-base's hot-loop hostility
      // (no-plusplus, no-continue, no-restricted-syntax, prefer-destructuring,
      // no-cond-assign) hurts readability and perf here.
      'no-plusplus': 'off',
      'no-continue': 'off',
      'no-restricted-syntax': 'off',
      'no-cond-assign': 'off',
      'prefer-destructuring': 'off',
    },
  },
  {
    rules: {
      // ──── TypeScript가 처리 (ESLint 중복 방지) ────
      'no-undef': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'consistent-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // ──── import (Nuxt auto-import 충돌) ────
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-named-as-default': 'off',
      'import/named': 'off',
      'import/order': 'off',

      // ──── Airbnb 완화 ────
      'no-param-reassign': ['error', { props: false }],
      'no-console': 'warn',
      'no-unused-expressions': 'off',
      'no-underscore-dangle': 'off',
      'no-throw-literal': 'off',
      'no-return-await': 'off',
      'no-restricted-globals': 'off',
      'no-return-assign': 'off',
      'no-new': 'off',
      'no-lonely-if': 'off',
      'global-require': 'off',

      // ──── Vue ────
      'vue/html-self-closing': 'off',
      'vue/html-end-tags': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/attributes-order': [
        'error',
        {
          order: [
            'UNIQUE',
            'DEFINITION',
            'LIST_RENDERING',
            'CONDITIONALS',
            'RENDER_MODIFIERS',
            'GLOBAL',
            'SLOT',
            'OTHER_DIRECTIVES',
            'OTHER_ATTR',
            'EVENTS',
            'CONTENT',
            'TWO_WAY_BINDING',
          ],
          alphabetical: false,
        },
      ],
    },
  }
);
