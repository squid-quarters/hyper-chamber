import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';
export default defineConfig({
	test: {include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], environment: 'node'},
	resolve: {
		alias: {
			'@hyper-chamber/reference': fileURLToPath(
				new URL('./packages/reference/src/index.ts', import.meta.url),
			),
		},
	},
});
