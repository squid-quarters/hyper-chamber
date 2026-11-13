import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, symlink, rm, mkdir, truncate} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {betaVersion, installerName, describeAsset, releaseVersion} from './model.mjs';

test('release path refuses stable, malformed and path-injecting versions', () => {
	assert.equal(betaVersion('1.0.0-beta.1'), '1.0.0-beta.1');
	for (const version of [
		'1.0.0',
		'1.0.0-rc.1',
		'1.0.0-beta.0',
		'v1.0.0-beta.1',
		'1.0.0-beta.1\n',
		'../beta.1',
	])
		assert.throws(() => betaVersion(version));
});

test('release target selection rejects unbuilt architectures', () => {
	assert.match(installerName('1.0.0-beta.1', 'darwin', 'arm64'), /_aarch64\.dmg$/);
	assert.match(installerName('1.0.0-beta.1', 'darwin', 'x64'), /_x64\.dmg$/);
	assert.match(installerName('1.0.0-beta.1', 'win32', 'x64'), /_x64-setup\.exe$/);
	assert.throws(() => installerName('1.0.0-beta.1', 'win32', 'arm64'));
	assert.throws(() => installerName('1.0.0-beta.1', 'linux', 'x64'));
});

test('asset checksums reject empty files and symlinked payloads', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-release-test-'));
	try {
		const payload = join(dir, 'installer.dmg');
		await writeFile(payload, 'abc');
		assert.deepEqual(await describeAsset(payload), {
			name: 'installer.dmg',
			bytes: 3,
			sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
		});
		await writeFile(join(dir, 'empty'), '');
		await assert.rejects(describeAsset(join(dir, 'empty')));
		if (process.platform !== 'win32') {
			await symlink(payload, join(dir, 'linked'));
			await assert.rejects(describeAsset(join(dir, 'linked')));
		}
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('application version guard ignores private library versions and rejects native drift', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-release-version-'));
	try {
		for (const file of [
			'package.json',
			'apps/web/package.json',
			'apps/server/package.json',
			'apps/desktop/package.json',
			'packages/reference/package.json',
		]) {
			await mkdir(join(dir, file, '..'), {recursive: true});
			await writeFile(
				join(dir, file),
				JSON.stringify({version: file.startsWith('packages/') ? '0.1.0' : '1.0.0-beta.1'}),
			);
		}
		await mkdir(join(dir, 'apps/desktop/src-tauri'), {recursive: true});
		await writeFile(
			join(dir, 'apps/desktop/src-tauri/tauri.conf.json'),
			JSON.stringify({version: '1.0.0-beta.1'}),
		);
		await writeFile(
			join(dir, 'apps/desktop/src-tauri/Cargo.toml'),
			'[package]\nversion = "1.0.0-beta.1"\n',
		);
		assert.equal(await releaseVersion(dir), '1.0.0-beta.1');
		await writeFile(
			join(dir, 'apps/desktop/src-tauri/Cargo.toml'),
			'[package]\nversion = "1.0.0"\n[dependencies.example]\nversion = "1.0.0-beta.1"\n',
		);
		await assert.rejects(releaseVersion(dir));
		await writeFile(
			join(dir, 'apps/desktop/src-tauri/Cargo.toml'),
			'[package]\nversion = "1.0.0-beta.1"\n',
		);
		await writeFile(join(dir, 'apps/web/package.json'), JSON.stringify({version: '1.0.0-beta.2'}));
		await assert.rejects(releaseVersion(dir));
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('asset guard refuses the exact GitHub and content-pack size boundary', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-release-size-'));
	try {
		const payload = join(dir, 'oversize.hcpack');
		await writeFile(payload, '');
		await truncate(payload, 2 ** 31);
		await assert.rejects(describeAsset(payload));
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});
