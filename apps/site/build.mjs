import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {checkSite} from './check.mjs';

const site = dirname(fileURLToPath(import.meta.url));
const repo = resolve(site, '../..');
const output = join(site, 'build');
const require = createRequire(import.meta.url);
await rm(output, {recursive: true, force: true});
await mkdir(join(output, 'assets'), {recursive: true});
for (const name of ['index.html', 'style.css']) await cp(join(site, name), join(output, name));
await cp(join(site, 'assets/brand-mark.svg'), join(output, 'assets/brand-mark.svg'));
for (const name of ['practice.webp', 'library.webp', 'phone.webp']) {
	await cp(join(repo, 'docs/screenshots', name), join(output, 'assets', name));
}
const fontFiles = [
	['@fontsource/dm-sans', 'dm-sans-latin-400-normal.woff2'],
	['@fontsource/dm-sans', 'dm-sans-latin-600-normal.woff2'],
	['@fontsource/barlow-condensed', 'barlow-condensed-latin-600-normal.woff2'],
];
const licenses = [];
for (const [name, file] of fontFiles) {
	const fontRoot = dirname(require.resolve(`${name}/package.json`));
	await cp(join(fontRoot, 'files', file), join(output, 'assets', file));
	if (!licenses.some(entry => entry.startsWith(`${name}\n`))) {
		licenses.push(`${name}\n${await readFile(join(fontRoot, 'LICENSE'), 'utf8')}`);
	}
}
await writeFile(join(output, 'assets/font-licenses.txt'), licenses.join('\n\n'));
await cp(join(repo, 'docs/screenshots/README.md'), join(output, 'assets/screenshot-sources.md'));
await writeFile(join(output, '.nojekyll'), '');
await checkSite(output);
console.log('Built the static project site in apps/site/build. No publication was performed.');
