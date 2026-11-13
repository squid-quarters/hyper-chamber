import {access, readFile, stat} from 'node:fs/promises';
import {dirname, isAbsolute, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export async function checkSite(directory) {
	const html = await readFile(resolve(directory, 'index.html'), 'utf8');
	const css = await readFile(resolve(directory, 'style.css'), 'utf8');
	if ((html.match(/<h1\b/g) ?? []).length !== 1) throw new Error('The project site needs one h1.');
	if (!html.includes('Beta in development')) throw new Error('The release state must be explicit.');
	if (html.includes('<script'))
		throw new Error('This static page does not need runtime JavaScript.');
	const references = [
		...[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]),
		...[...css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)].map(match => match[1]),
	];
	for (const reference of references) {
		if (reference.startsWith('https://')) continue;
		if (isAbsolute(reference) || reference.startsWith('//')) {
			throw new Error(`Project Pages assets must use relative paths: ${reference}`);
		}
		const file = resolve(directory, reference);
		if (!file.startsWith(`${resolve(directory)}/`) && file !== resolve(directory)) {
			throw new Error(`Asset leaves the site output: ${reference}`);
		}
		await access(file);
	}
	for (const name of ['practice.webp', 'library.webp', 'phone.webp']) {
		if ((await stat(resolve(directory, 'assets', name))).size === 0) {
			throw new Error(`Screenshot is empty: ${name}`);
		}
	}
	console.log('Checked site assets, relative project paths, page heading and development state.');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
	await checkSite(resolve(dirname(fileURLToPath(import.meta.url)), 'build'));
}
