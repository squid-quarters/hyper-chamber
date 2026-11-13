import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {readFile, lstat} from 'node:fs/promises';
import {join, basename} from 'node:path';

export function betaVersion(value) {
	if (typeof value !== 'string' || !/^[0-9]+\.[0-9]+\.[0-9]+-beta\.[1-9][0-9]*$/.test(value))
		throw new Error('This release path accepts explicit beta versions only.');
	return value;
}

export function installerName(version, platform, arch) {
	betaVersion(version);
	if (platform === 'darwin' && ['arm64', 'x64'].includes(arch))
		return `Hyper-Chamber_${version}_${arch === 'arm64' ? 'aarch64' : 'x64'}.dmg`;
	if (platform === 'win32' && arch === 'x64') return `Hyper-Chamber_${version}_x64-setup.exe`;
	throw new Error(`Unsupported release target: ${platform}/${arch}`);
}

export async function releaseVersion(root) {
	const paths = [
		'package.json',
		'apps/web/package.json',
		'apps/server/package.json',
		'apps/desktop/package.json',
	];
	const versions = await Promise.all(
		paths.map(async path => JSON.parse(await readFile(join(root, path), 'utf8')).version),
	);
	const version = betaVersion(versions[0]);
	if (versions.some(value => value !== version))
		throw new Error('Application package versions must agree before a release.');
	const tauri = JSON.parse(
		await readFile(join(root, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8'),
	);
	const cargo = await readFile(join(root, 'apps/desktop/src-tauri/Cargo.toml'), 'utf8');
	const packageSection = cargo.split(/^\[package\]\s*$/m)[1]?.split(/^\[/m)[0] ?? '';
	const nativeVersion = /^version\s*=\s*"([^"]+)"/m.exec(packageSection)?.[1];
	if (tauri.version !== version || nativeVersion !== version)
		throw new Error('Native and application versions must agree before a release.');
	return version;
}

export async function describeAsset(path) {
	const info = await lstat(path);
	if (!info.isFile() || info.size < 1 || info.size >= 2 ** 31)
		throw new Error(
			`Release assets must be ordinary nonempty files smaller than 2 GiB: ${basename(path)}`,
		);
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return {name: basename(path), bytes: info.size, sha256: hash.digest('hex')};
}

export function assertReleaseSource(root, expectedCommit) {
	if (!/^[a-f0-9]{40}$/.test(expectedCommit ?? ''))
		throw new Error('An exact release source commit is required.');
	const head = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
		cwd: root,
		encoding: 'utf8',
	}).trim();
	if (head !== expectedCommit)
		throw new Error('The release checkout does not match the installer source commit.');
	const changes = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
		cwd: root,
		encoding: 'utf8',
	});
	if (changes.trim())
		throw new Error(
			'Release assembly requires a clean checkout, including untracked source files.',
		);
}
