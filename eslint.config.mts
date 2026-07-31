import { fileURLToPath } from 'node:url';
import path from 'node:path';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import pluginSecurity from 'eslint-plugin-security';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mts'],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
  pluginSecurity.configs.recommended,
  {
    files: ['**/*.controller.ts', '**/*.module.ts', '**/plugins/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  eslintConfigPrettier,
]);
