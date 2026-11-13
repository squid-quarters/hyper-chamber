import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

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
		if (
			[
				'@fontsource/dm-sans',
				'@fontsource/barlow-condensed',
				'@lucide/svelte',
				'svelte',
				'zod',
				'fflate',
				'clsx',
				'tailwind-merge',
				'qrcode',
			].includes(pkg.name) &&
			!text.trim()
		)
			throw new Error(`Required shipped package license missing: ${pkg.name} ${pkg.version}`);
		notices.push(`${pkg.name} ${pkg.version}\nDeclared license: ${license}\n${text}`);
	}
	return notices;
}

const upstreamCache = new Map();
const licenseCandidates = [
	'LICENSE',
	'LICENSE.md',
	'LICENSE.txt',
	'LICENSE-MIT',
	'LICENSE-APACHE',
	'LICENSE_MIT',
	'LICENSE_APACHE-2.0',
	'COPYING',
	'COPYING.txt',
	'NOTICE',
];
const licenseText = text =>
	/Permission is hereby granted|Apache License|Redistribution and use|Mozilla Public License|THE SOFTWARE IS PROVIDED|Permission to use, copy|Permission is granted|This software is provided|Creative Commons|Boost Software License|free and unencumbered software/i.test(
		text,
	);

const standardTerms = new Map();
async function referencedTerms(id) {
	const hashes = {
		MIT: 'b05785f9f18e6716bab63424b11454513b9943a222595b70411009202fc592b5',
		'MPL-2.0': '66a3107d5ad6a058aab753eaac2047ccb2ed0e39465dd0fe5844da3e300d5172',
	};
	if (!hashes[id]) throw new Error(`Unsupported referenced license terms: ${id}`);
	if (!standardTerms.has(id))
		standardTerms.set(
			id,
			(async () => {
				const url = `https://raw.githubusercontent.com/spdx/license-list-data/v3.27.0/text/${id}.txt`;
				const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
				if (!response.ok) throw new Error(`Referenced ${id} terms unavailable: ${response.status}`);
				const text = await response.text();
				if (createHash('sha256').update(text).digest('hex') !== hashes[id])
					throw new Error(`Referenced ${id} terms hash mismatch.`);
				return `Standard ${id} terms referenced by the upstream declaration (template; not an added copyright notice):\n${url}\nSHA-256: ${hashes[id]}\n${text}`;
			})(),
		);
	return standardTerms.get(id);
}

function declarationOnlyRepository(repository, records) {
	return (
		repository === 'https://github.com/madsmtm/objc2' &&
		records.some(record => record.url.endsWith('/LICENSE.md') && record.text.includes('MIT'))
	);
}

async function upstreamLicenses(pkg) {
	const repository = pkg.repository?.replace(/\.git$/, '').replace(/\/$/, '');
	if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? ''))
		throw new Error(`No known GitHub license source for ${pkg.name} ${pkg.version}`);
	const vcs = JSON.parse(
		await readFile(join(dirname(pkg.manifest_path), '.cargo_vcs_info.json'), 'utf8'),
	);
	const commit = vcs.git?.sha1;
	if (!/^[a-f0-9]{40}$/.test(commit ?? ''))
		throw new Error(`Missing pinned source commit for ${pkg.name} ${pkg.version}`);
	const key = `${repository}/${commit}`;
	if (
		repository === 'https://github.com/servo/stylo' &&
		pkg.name === 'selectors' &&
		pkg.license === 'MPL-2.0'
	) {
		const source = await readFile(join(dirname(pkg.manifest_path), 'lib.rs'), 'utf8');
		const header = source.slice(0, source.indexOf('*/') + 2);
		if (!header.includes('Mozilla Public'))
			throw new Error(`Missing published MPL notice for ${pkg.name} ${pkg.version}`);
		return `Authors reported by the published Cargo manifest: ${(pkg.authors ?? []).join('; ')}\nPublished source notice: ${repository}/blob/${commit}/${vcs.path_in_vcs}/lib.rs\n${header}\n\n${await referencedTerms('MPL-2.0')}`;
	}
	if (!upstreamCache.has(key))
		upstreamCache.set(
			key,
			(async () => {
				const cacheDirectory = join(root, '.local', 'notice-license-cache');
				const cacheFile = join(
					cacheDirectory,
					`${createHash('sha256').update(key).digest('hex')}.json`,
				);
				let records;
				try {
					records = JSON.parse(await readFile(cacheFile, 'utf8'));
				} catch (error) {
					if (error.code !== 'ENOENT') throw error;
				}
				if (!records) {
					records = (
						await Promise.all(
							licenseCandidates.map(async name => {
								const url = `${repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${commit}/${name}`;
								const response = await fetch(url, {signal: AbortSignal.timeout(15000)});
								if (response.status === 404) return null;
								if (!response.ok)
									throw new Error(`Pinned license retrieval failed (${response.status}): ${url}`);
								const text = await response.text();
								return {url, text, sha256: createHash('sha256').update(text).digest('hex')};
							}),
						)
					).filter(Boolean);
					if (
						!records.some(record => licenseText(record.text)) &&
						!declarationOnlyRepository(repository, records)
					)
						throw new Error(
							`No complete upstream license text for ${pkg.name} ${pkg.version} at ${key}`,
						);
					await mkdir(cacheDirectory, {recursive: true});
					await writeFile(cacheFile, JSON.stringify(records));
				}
				for (const record of records) {
					if (
						!record.url.startsWith(
							repository.replace('https://github.com/', 'https://raw.githubusercontent.com/') +
								'/' +
								commit +
								'/',
						) ||
						createHash('sha256').update(record.text).digest('hex') !== record.sha256
					)
						throw new Error(`Invalid cached license source for ${key}`);
				}
				if (
					!records.some(record => licenseText(record.text)) &&
					!declarationOnlyRepository(repository, records)
				)
					throw new Error(`Missing complete cached license text for ${key}`);
				return records
					.map(
						record => `Pinned upstream: ${record.url}\nSHA-256: ${record.sha256}\n${record.text}`,
					)
					.join('\n\n');
			})(),
		);
	const upstream = await upstreamCache.get(key);
	if (repository === 'https://github.com/madsmtm/objc2' && pkg.license?.includes('MIT')) {
		return `Authors reported by the published Cargo manifest: ${(pkg.authors ?? []).join('; ')}\n${upstream}\n\n${await referencedTerms('MIT')}`;
	}
	return upstream;
}

async function rustNotices(targetOverride) {
	const {stdout: version} = await execute('rustc', ['-vV'], {timeout: 30000});
	const host =
		targetOverride ??
		version
			.split('\n')
			.find(line => line.startsWith('host: '))
			?.slice(6)
			.trim();
	if (!host) throw new Error('The native Rust target could not be identified.');
	const {stdout} = await execute(
		'cargo',
		[
			'metadata',
			'--locked',
			'--format-version',
			'1',
			'--filter-platform',
			host,
			'--manifest-path',
			join(root, 'apps/desktop/src-tauri/Cargo.toml'),
		],
		{maxBuffer: 64 * 1024 * 1024, timeout: 180000},
	);
	const metadata = JSON.parse(stdout);
	const nodes = new Map(metadata.resolve.nodes.map(node => [node.id, node]));
	const reachable = new Set();
	const visit = id => {
		if (reachable.has(id)) return;
		reachable.add(id);
		for (const dependency of nodes.get(id)?.deps ?? []) visit(dependency.pkg);
	};
	visit(metadata.resolve.root);
	const notices = [];
	for (const pkg of metadata.packages
		.filter(pkg => reachable.has(pkg.id))
		.sort((a, b) => `${a.name}/${a.version}`.localeCompare(`${b.name}/${b.version}`, 'en'))) {
		if (pkg.source === null) continue;
		const directory = dirname(pkg.manifest_path);
		let text = await licenseFiles(directory);
		if (pkg.license_file) {
			const path = resolve(directory, pkg.license_file);
			if (dirname(path) === directory && !licenseName.test(pkg.license_file))
				text += `\n${pkg.license_file}\n${await readFile(path, 'utf8')}`;
		}
		if (!text.trim()) text = await upstreamLicenses(pkg);
		if (!text.trim())
			throw new Error(`Missing license text for native dependency ${pkg.name} ${pkg.version}`);
		notices.push(
			`${pkg.name} ${pkg.version}\nDeclared license: ${pkg.license ?? 'See upstream license'}\n${pkg.repository ?? ''}\n${text}`,
		);
	}
	return notices;
}

export async function writeThirdPartyNotices(outputResourceDir, {targetTriple} = {}) {
	const notices = [...(await nodeNotices()), ...(await rustNotices(targetTriple))];
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
