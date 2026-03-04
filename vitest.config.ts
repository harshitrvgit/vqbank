import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			'@': __dirname,
		},
	},
	test: {
		globals: true,
		environment: 'node',
		include: ['**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		coverage: {
			provider: 'v8',
			include: [
				'utils/**/*.ts',
				'middlewares/**/*.ts',
				'controllers/**/*.ts',
				'models/**/*.ts',
				'services/**/*.ts',
			],
			exclude: ['node_modules', 'dist', 'views', 'public', '**/*.test.ts'],
		},
		testTimeout: 10_000,
	},
});
