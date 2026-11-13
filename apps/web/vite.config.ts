import adapter from '@sveltejs/adapter-static';
import {sveltekit} from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig, type Plugin} from 'vite';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Media is served from installed packs (or the source-run media directory), never the UI bundle.
function uiAssets(): Plugin {
	return {
		name: 'hyper-chamber-ui-assets',
		apply: 'build',
		async generateBundle() {
			if (this.environment.name !== 'client') return;
			const emit = async (directory: string, prefix = '') => {
				for (const entry of await readdir(directory, {withFileTypes: true})) {
					if (!prefix && entry.name === 'media') continue;
					const filename = prefix + entry.name;
					if (entry.isDirectory()) await emit(join(directory, entry.name), filename + '/');
					else if (entry.isFile())
						this.emitFile({
							type: 'asset',
							fileName: filename,
							source: await readFile(join(directory, entry.name)),
						});
				}
			};
			await emit(fileURLToPath(new URL('./static', import.meta.url)));
		},
	};
}

export default defineConfig({
	build: {copyPublicDir: false},
	server: {
		proxy: process.env.HYPER_CHAMBER_API_URL
			? Object.fromEntries(
					['/api', '/media', '/portraits'].map(path => [
						path,
						{
							target: process.env.HYPER_CHAMBER_API_URL,
							changeOrigin: true,
							configure(proxy) {
								proxy.on('proxyReq', (outgoing, incoming) => {
									// Vite is a same-origin development gateway. Preserve hostile Origins.
									if (incoming.headers.origin === `http://${incoming.headers.host}`)
										outgoing.setHeader('Origin', process.env.HYPER_CHAMBER_API_URL!);
								});
							},
						},
					]),
				)
			: undefined,
	},
	plugins: [
		uiAssets(),
		tailwindcss(),
		sveltekit({
			adapter: adapter({fallback: 'index.html'}),
			compilerOptions: {
				runes: ({filename}) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
			},
		}),
	],
});
