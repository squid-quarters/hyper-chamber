import {defineConfig} from 'tsup';

export default defineConfig({
	entry: ['src/cli.ts', 'src/index.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'node24',
	removeNodeProtocol: false,
	outDir: 'dist',
	outExtension: () => ({js: '.mjs'}),
	noExternal: ['@hyper-chamber/reference', 'fflate', 'zod'],
	splitting: false,
	clean: true,
});
