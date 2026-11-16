import {access, readFile, readdir, stat} from 'node:fs/promises';
import {dirname, isAbsolute, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

async function checkGuideLinks(directory) {
	const root = resolve(directory);
	const files = [];
	async function visit(path) {
		for (const entry of await readdir(path, {withFileTypes: true})) {
			if (entry.isDirectory()) await visit(resolve(path, entry.name));
			else if (entry.name.endsWith('.html')) files.push(resolve(path, entry.name));
		}
	}
	await visit(root);
	for (const file of files) {
		const html = await readFile(file, 'utf8');
		if ((html.match(/<h1\b/g) ?? []).length !== 1)
			throw new Error(`Expected one main heading in ${file}`);
		if (/<script\b|\son[a-z]+\s*=/i.test(html)) throw new Error(`Executable HTML in ${file}`);
		const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
		if (ids.length !== new Set(ids).size) throw new Error(`Repeated heading or anchor in ${file}`);
		for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
			const reference = match[1].replace(/&amp;/g, '&');
			if (reference.startsWith('https://')) continue;
			if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(reference))
				throw new Error(`Unsafe project link: ${reference}`);
			const [relative, hash] = reference.split('#');
			let target = resolve(dirname(file), decodeURIComponent(relative.split('?')[0]));
			if (!target.startsWith(`${root}/`) && target !== root)
				throw new Error(`Link leaves site output: ${reference}`);
			if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
			await access(target);
			if (hash && target.endsWith('.html')) {
				const linked = target === file ? html : await readFile(target, 'utf8');
				if (!linked.includes(`id="${decodeURIComponent(hash)}"`))
					throw new Error(`Missing anchor: ${reference} in ${file}`);
			}
		}
	}
	for (const name of ['hyper-chamber-packs.zip', 'sample-workspace.zip', 'sample.hcpack']) {
		if ((await stat(resolve(root, 'create-packs/downloads', name))).size === 0)
			throw new Error(`Empty creator download: ${name}`);
	}
}

export async function checkSite(directory) {
	const html = await readFile(resolve(directory, 'index.html'), 'utf8');
	const css = await readFile(resolve(directory, 'style.css'), 'utf8');
	if ((html.match(/<h1\b/g) ?? []).length !== 1) throw new Error('The project site needs one h1.');
	// The site advertises a published release, which can lag behind application source.
	const version = /<meta name="application-version" content="([^"]+)"/.exec(html)?.[1];
	if (
		!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-beta\.[1-9][0-9]*)?$/.test(version ?? '')
	)
		throw new Error('The project site must identify an explicit stable or beta version.');
	const status = version.includes('-beta.') ? `Public beta · ${version}` : `Version ${version}`;
	if (!html.includes(status))
		throw new Error('The visible release version and page metadata must agree.');
	const release = `https://github.com/squid-quarters/hyper-chamber/releases/download/v${version}/`;
	for (const suffix of ['aarch64.dmg', 'x64.dmg', 'x64-setup.exe']) {
		if (!html.includes(`href="${release}Hyper-Chamber_${version}_${suffix}"`))
			throw new Error(`Missing the versioned installer: ${suffix}`);
	}
	if (html.includes('Beta in development'))
		throw new Error('Remove the obsolete development-only state.');
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
	await checkGuideLinks(directory);
	console.log(
		'Checked all site pages, local links and anchors, creator downloads, release version and installer URLs.',
	);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
	await checkSite(resolve(dirname(fileURLToPath(import.meta.url)), 'build'));
}
