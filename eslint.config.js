import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import playwright from 'eslint-plugin-playwright';

export default [
    {
        files: ['**/*.ts'],
        ignores: ['node_modules/**', 'playwright-report/**'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            playwright
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
];
