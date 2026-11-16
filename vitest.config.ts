import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';
export default defineConfig({
	test: {include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], environment: 'node'},
	resolve: {
		alias: {
			'@hyper-chamber/authoring/archive': fileURLToPath(
				new URL('./packages/authoring/src/archive.ts', import.meta.url),
			),
			'@hyper-chamber/authoring': fileURLToPath(
				new URL('./packages/authoring/src/index.ts', import.meta.url),
			),
			'@hyper-chamber/reference': fileURLToPath(
				new URL('./packages/reference/src/index.ts', import.meta.url),
			),
		},
	},
});
