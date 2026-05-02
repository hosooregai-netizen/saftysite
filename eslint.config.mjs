import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['packages/contracts/**/*.{ts,tsx}', 'packages/prompt-packs/**/*.{ts,tsx}', 'packages/report-engine/**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    '**/.next/**',
    'out/**',
    '**/out/**',
    'build/**',
    '**/build/**',
    'packages/contracts/generated/**',
    '**/next-env.d.ts',
  ]),
]);

export default eslintConfig;
