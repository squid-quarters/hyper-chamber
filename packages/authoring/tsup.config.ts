import {defineConfig} from 'tsup';
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
export default defineConfig({
	entry: ['src/index.ts', 'src/cli.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'node24',
	removeNodeProtocol: false,
	outExtension: () => ({js: '.mjs'}),
	noExternal: ['@hyper-chamber/reference', 'fflate', 'zod'],
	splitting: false,
	clean: true,
	dts: true,
	onSuccess: async () => {
		const root = fileURLToPath(new URL('../../content/games/', import.meta.url));
		const profiles = [];
		for (const entry of await readdir(root, {withFileTypes: true}))
			if (entry.isDirectory())
				profiles.push(JSON.parse(await readFile(join(root, entry.name, 'game.json'), 'utf8')));
		await writeFile(
			fileURLToPath(new URL('./dist/profiles.json', import.meta.url)),
			JSON.stringify(profiles),
		);
	},
});
