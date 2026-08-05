import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        ignores: ['dist/', 'temp/', 'ecosystem.config.cjs', 'eslint.config.js', 'index.ts', 'test/', 'src/generated/', 'openapi-ts.config.ts'],
    },
);
