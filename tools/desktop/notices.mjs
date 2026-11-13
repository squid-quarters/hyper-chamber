import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../../', import.meta.url));
const licenseName = /^(?:LICEN[CS]E|COPYING|NOTICE|OFL)(?:[._-].*)?$/i;

async function licenseFiles(directory) {
	const names = await readdir(directory, {withFileTypes: true});
	const files = [];
	for (const entry of names.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
		if (entry.isFile() && licenseName.test(entry.name)) {
			files.push(`${entry.name}\n${await readFile(join(directory, entry.name), 'utf8')}`);
		}
	}
	return files.join('\n\n');
}

async function nodeNotices() {
	const store = join(root, 'node_modules/.pnpm');
	const packages = new Set();
	for (const entry of await readdir(store, {withFileTypes: true})) {
		if (!entry.isDirectory() || entry.name === 'node_modules') continue;
		const modules = join(store, entry.name, 'node_modules');
		for (const item of await readdir(modules, {withFileTypes: true})) {
			if (item.name.startsWith('.')) continue;
			if (item.name.startsWith('@')) {
				for (const scoped of await readdir(join(modules, item.name)))
					packages.add(await realpath(join(modules, item.name, scoped)));
			} else packages.add(await realpath(join(modules, item.name)));
		}
	}
	const notices = [];
	for (const directory of [...packages].sort()) {
		const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
		if (pkg.name?.startsWith('@hyper-chamber/') || pkg.name === 'hyper-chamber') continue;
		const license = typeof pkg.license === 'string' ? pkg.license : 'See upstream license';
		const text = await licenseFiles(directory);
		notices.push(`${pkg.name} ${pkg.version}\nDeclared license: ${license}\n${text}`);
	}
	return notices;
}

async function rustNotices() {
	const {stdout} = await execute(
		'cargo',
		[
			'metadata',
			'--locked',
			'--format-version',
			'1',
			'--manifest-path',
			join(root, 'apps/desktop/src-tauri/Cargo.toml'),
		],
		{maxBuffer: 64 * 1024 * 1024, timeout: 180000},
	);
	const metadata = JSON.parse(stdout);
	const notices = [];
	for (const pkg of metadata.packages.sort((a, b) =>
		`${a.name}/${a.version}`.localeCompare(`${b.name}/${b.version}`, 'en'),
	)) {
		if (pkg.source === null) continue;
		const directory = dirname(pkg.manifest_path);
		let text = await licenseFiles(directory);
		if (pkg.license_file) {
			const path = resolve(directory, pkg.license_file);
			if (dirname(path) === directory && !licenseName.test(pkg.license_file))
				text += `\n${pkg.license_file}\n${await readFile(path, 'utf8')}`;
		}
		notices.push(
			`${pkg.name} ${pkg.version}\nDeclared license: ${pkg.license ?? 'See upstream license'}\n${pkg.repository ?? ''}\n${text}`,
		);
	}
	return notices;
}

export async function writeThirdPartyNotices(outputResourceDir) {
	const notices = [...(await nodeNotices()), ...(await rustNotices())];
	for (const required of [
		'@fontsource/dm-sans',
		'@fontsource/barlow-condensed',
		'@lucide/svelte',
		'svelte ',
		'tauri ',
	]) {
		if (!notices.some(notice => notice.startsWith(required)))
			throw new Error(`Required third-party notice missing: ${required}`);
	}
	const header =
		'Hyper Chamber — third-party notices\n\nThis inventory includes third-party application components and build dependencies. Node.js and its bundled dependencies are covered separately by NODE-LICENSE.txt. These notices do not assign a license to Hyper Chamber’s authored content or third-party gameplay footage.\n';
	await writeFile(
		join(outputResourceDir, 'THIRD-PARTY-NOTICES.txt'),
		`${header}\n${notices.join('\n\n' + '='.repeat(72) + '\n\n')}\n`,
	);
	return notices.length;
}
