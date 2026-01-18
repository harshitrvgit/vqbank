import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			prettier: prettierPlugin,
		},
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
			},
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 'latest',
			},
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'warn',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_' },
			],
		},
		ignores: ['dist/', 'node_modules/', 'exp/', 'public/'],
	},
];
