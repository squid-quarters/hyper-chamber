import {test} from 'node:test';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {
	mkdtemp,
	writeFile,
	symlink,
	rm,
	mkdir,
	truncate,
	stat,
	readFile,
	copyFile,
	readdir,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {collectPack} from '../desktop/pack.mjs';
import {createHash} from 'node:crypto';
import {
	applicationVersion,
	installerName,
	describeAsset,
	releaseVersion,
	assertReleaseSource,
	assertReleaseTag,
} from './model.mjs';

test('release path accepts stable and explicit beta versions, rejecting malformed inputs', () => {
	assert.equal(applicationVersion('1.0.0'), '1.0.0');
	assert.equal(applicationVersion('1.0.0-beta.1'), '1.0.0-beta.1');
	for (const version of [
		'01.0.0',
		'1.00.0',
		'1.0.00',
		'1.0.0-beta.01',
		'1.0.0+build.1',
		'1.0.0\n',
		null,
		100,
		'1.0.0-rc.1',
		'1.0.0-beta.0',
		'v1.0.0-beta.1',
		'1.0.0-beta.1\n',
		'../beta.1',
	])
		assert.throws(() => applicationVersion(version));
});

test('release tag binding rejects a raced or redirected tag', () => {
	const source = 'a'.repeat(40);
	const tag = 'v1.0.0';
	const reference = {ref: `refs/tags/${tag}`, object: {type: 'commit', sha: source}};
	assert.doesNotThrow(() => assertReleaseTag(reference, tag, source));
	for (const changed of [
		{...reference, object: {type: 'commit', sha: 'b'.repeat(40)}},
		{...reference, object: {type: 'tag', sha: source}},
		{...reference, ref: 'refs/tags/v1.0.1'},
		undefined,
	])
		assert.throws(() => assertReleaseTag(changed, tag, source), /verified source commit/);
});

test('release target selection rejects unbuilt architectures', () => {
	assert.equal(installerName('1.0.0', 'darwin', 'arm64'), 'Hyper-Chamber_1.0.0_aarch64.dmg');
	assert.equal(installerName('1.0.0', 'darwin', 'x64'), 'Hyper-Chamber_1.0.0_x64.dmg');
	assert.equal(installerName('1.0.0', 'win32', 'x64'), 'Hyper-Chamber_1.0.0_x64-setup.exe');
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

test('source binding rejects same-version content drift and untracked release inputs', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-release-source-'));
	const git = args =>
		execFileSync(
			'git',
			[
				'-c',
				'user.name=Hyper Chamber fixture',
				'-c',
				'user.email=fixture@example.invalid',
				...args,
			],
			{cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']},
		);
	try {
		git(['init', '--quiet']);
		await writeFile(join(dir, 'package.json'), JSON.stringify({version: '1.0.0-beta.1'}));
		await writeFile(join(dir, 'reference.json'), 'route A');
		git(['add', 'package.json', 'reference.json']);
		git(['commit', '--quiet', '-m', 'test: create release fixture']);
		const sourceA = git(['rev-parse', 'HEAD']).trim();
		assert.doesNotThrow(() => assertReleaseSource(dir, sourceA));
		await writeFile(join(dir, 'reference.json'), 'route B');
		assert.throws(() => assertReleaseSource(dir, sourceA), /clean checkout/);
		git(['add', 'reference.json']);
		git(['commit', '--quiet', '-m', 'test: change same-version source fixture']);
		const sourceB = git(['rev-parse', 'HEAD']).trim();
		assert.throws(() => assertReleaseSource(dir, sourceA), /source commit/);
		assert.doesNotThrow(() => assertReleaseSource(dir, sourceB));
		await writeFile(join(dir, 'new-media.mp4'), 'untracked payload');
		assert.throws(() => assertReleaseSource(dir, sourceB), /clean checkout/);
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('assembly rejects a mismatched checkout before reading or creating release assets', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-release-cli-'));
	try {
		const output = join(dir, 'release');
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL('./assemble.mjs', import.meta.url)),
				'--installers',
				join(dir, 'missing-installers'),
				'--packs',
				join(dir, 'missing-packs'),
				'--pack-verification',
				join(dir, 'missing-proof.json'),
				'--source-commit',
				'0'.repeat(40),
				'--output',
				output,
			],
			{encoding: 'utf8', timeout: 10000},
		);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /checkout does not match.*source commit/);
		await assert.rejects(stat(output), {code: 'ENOENT'});
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

for (const [version, prerelease] of [
	['1.0.0', false],
	['1.0.1-beta.2', true],
]) {
	test(`assembly preserves source and checksum gates for ${version}`, async () => {
		const dir = await mkdtemp(join(tmpdir(), 'hc-stable-assembly-'));
		const source = join(dir, 'source');
		const installers = join(dir, 'installers');
		const packs = join(dir, 'packs');
		const output = join(dir, '.local/release');
		const git = args =>
			execFileSync(
				'git',
				['-c', 'user.name=Release fixture', '-c', 'user.email=fixture@example.invalid', ...args],
				{cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']},
			);
		try {
			for (const path of [
				'tools/release',
				'tools/desktop',
				'apps/web/static/media/ryu',
				'apps/server',
				'apps/desktop/src-tauri',
				'content/games/sf6/references',
				'../packs',
			])
				await mkdir(join(source, path), {recursive: true});
			for (const path of [
				'tools/release/assemble.mjs',
				'tools/release/model.mjs',
				'tools/release/pack-editions.mjs',
				'tools/desktop/pack.mjs',
			])
				await copyFile(
					fileURLToPath(new URL('../../' + path, import.meta.url)),
					join(source, path),
				);
			for (const path of [
				'package.json',
				'apps/web/package.json',
				'apps/server/package.json',
				'apps/desktop/package.json',
				'apps/desktop/src-tauri/tauri.conf.json',
			])
				await writeFile(join(source, path), JSON.stringify({version}));
			await writeFile(
				join(source, 'apps/desktop/src-tauri/Cargo.toml'),
				`[package]\nversion = "${version}"\n`,
			);
			await writeFile(
				join(source, 'content/games/sf6/game.json'),
				JSON.stringify({characters: [{id: 'ryu'}]}),
			);
			await writeFile(
				join(source, 'content/games/sf6/references/ryu.json'),
				JSON.stringify([{id: 'ryu-reference', media: {clip: '/media/ryu/clip.mp4'}}]),
			);
			await writeFile(join(source, 'apps/web/static/media/ryu/clip.mp4'), 'fixture clip');
			const edition = '1.0.0';
			await writeFile(
				join(source, 'content/pack-editions.json'),
				JSON.stringify({formatVersion: 1, editions: {sf6: {ryu: edition}}}),
			);
			git(['init', '--quiet']);
			git(['add', '.']);
			git(['commit', '--quiet', '-m', 'test: stable source fixture']);
			const commit = git(['rev-parse', 'HEAD']).trim();
			for (const [id, platform, arch, name] of [
				['macos-arm64', 'darwin', 'arm64', `Hyper-Chamber_${version}_aarch64.dmg`],
				['macos-x64', 'darwin', 'x64', `Hyper-Chamber_${version}_x64.dmg`],
				['windows-x64', 'win32', 'x64', `Hyper-Chamber_${version}_x64-setup.exe`],
			]) {
				const directory = join(installers, `installer-${id}`);
				await mkdir(directory, {recursive: true});
				const path = join(directory, name);
				await writeFile(path, `fixture installer ${id}`);
				const asset = await describeAsset(path);
				await writeFile(
					join(directory, 'build-info.json'),
					JSON.stringify({
						sourceCommit: commit,
						version,
						platform,
						arch,
						asset,
						verification: {
							passed: true,
							checks: {nativeBootstrap: true, upgradeFromV1: true, packAuthoringCli: true},
						},
					}),
				);
			}
			const pack = await collectPack({sourceRoot: source, characterId: 'ryu', version: edition});
			const packPath = join(packs, `sf6-ryu_${edition}.hcpack`);
			await writeFile(packPath, 'fixture archive payload');
			const indexPath = join(packs, 'content-packs.json');
			await writeFile(
				indexPath,
				JSON.stringify({
					version,
					packs: [
						{
							...(await describeAsset(packPath)),
							character: 'ryu',
							version: edition,
							references: 1,
							demonstrations: 1,
							manifestSha256: createHash('sha256')
								.update(JSON.stringify(pack.manifest))
								.digest('hex'),
						},
					],
				}),
			);
			const proof = join(dir, 'content-verification.json');
			await writeFile(
				proof,
				JSON.stringify({
					passed: true,
					version,
					indexSha256: (await describeAsset(indexPath)).sha256,
				}),
			);
			const run = destination =>
				spawnSync(
					process.execPath,
					[
						join(source, 'tools/release/assemble.mjs'),
						'--installers',
						installers,
						'--packs',
						packs,
						'--pack-verification',
						proof,
						'--source-commit',
						commit,
						'--output',
						destination,
					],
					{encoding: 'utf8', timeout: 10000},
				);
			const buildInfoPath = join(installers, 'installer-macos-arm64/build-info.json');
			const originalBuildInfo = await readFile(buildInfoPath, 'utf8');
			const withoutUpgradeProof = JSON.parse(originalBuildInfo);
			delete withoutUpgradeProof.verification.checks.upgradeFromV1;
			await writeFile(buildInfoPath, JSON.stringify(withoutUpgradeProof));
			const unverifiedUpgrade = run(join(dir, '.local/unverified-upgrade'));
			assert.notEqual(
				unverifiedUpgrade.status,
				0,
				'Passing fresh-install smoke cannot replace upgrade verification.',
			);
			assert.match(unverifiedUpgrade.stderr, /unverified|verification/i);
			const withoutAuthoringProof = JSON.parse(originalBuildInfo);
			delete withoutAuthoringProof.verification.checks.packAuthoringCli;
			await writeFile(buildInfoPath, JSON.stringify(withoutAuthoringProof));
			const unverifiedAuthoring = run(join(dir, '.local/unverified-authoring'));
			assert.notEqual(
				unverifiedAuthoring.status,
				0,
				'Installer publication requires its packaged authoring CLI to be tested.',
			);
			assert.match(unverifiedAuthoring.stderr, /unverified|verification/i);
			await writeFile(buildInfoPath, originalBuildInfo);
			const assembled = run(output);
			assert.equal(assembled.status, 0, assembled.stderr);
			const manifest = JSON.parse(await readFile(join(output, 'release-manifest.json'), 'utf8'));
			assert.equal(manifest.version, version);
			assert.equal(manifest.tag, `v${version}`);
			assert.equal(manifest.prerelease, prerelease);
			assert.equal(manifest.sourceCommit, commit);
			assert.equal(manifest.builds.length, 3);
			assert.equal(manifest.references, 1);

			const workflow = await readFile(
				new URL('../../.github/workflows/assemble-release.yml', import.meta.url),
				'utf8',
			);
			const verification = workflow
				.replace(/\r\n/g, '\n')
				.split('name: Verify uploaded assets and retain a staging record')[1]
				?.split('\n      - ')[0];
			const code = /<<'NODE'\n([\s\S]+?)\n\s*NODE/.exec(verification ?? '')?.[1];
			assert.ok(code, 'Exercise the actual workflow upload verification.');
			await mkdir(join(dir, 'tools/release'), {recursive: true});
			await copyFile(join(source, 'tools/release/model.mjs'), join(dir, 'tools/release/model.mjs'));
			const uploaded = await Promise.all(
				(await readdir(output)).map(async name => {
					const asset = await describeAsset(join(output, name));
					return {name, size: asset.bytes, state: 'uploaded', digest: `sha256:${asset.sha256}`};
				}),
			);
			await writeFile(join(dir, '.local/uploaded-assets.json'), JSON.stringify([uploaded]));
			await writeFile(
				join(dir, '.local/draft-release-verified.json'),
				JSON.stringify({
					id: 1,
					draft: true,
					tag_name: manifest.tag,
					target_commitish: commit,
					prerelease,
				}),
			);
			const tagPath = join(dir, '.local/verified-tag.json');
			await writeFile(
				tagPath,
				JSON.stringify({
					ref: `refs/tags/${manifest.tag}`,
					object: {type: 'commit', sha: 'b'.repeat(40)},
				}),
			);
			const verifyUpload = () =>
				spawnSync(process.execPath, ['--input-type=module', '-'], {
					input: code,
					cwd: dir,
					encoding: 'utf8',
					timeout: 10000,
					env: {
						...process.env,
						SOURCE_COMMIT: commit,
						INSTALLER_RUN_ID: '123',
						GITHUB_STEP_SUMMARY: join(dir, 'summary.md'),
					},
				});
			const rejectedTag = verifyUpload();
			assert.notEqual(rejectedTag.status, 0, 'Workflow must reject a mismatched actual tag.');
			assert.match(
				rejectedTag.stderr,
				/release tag must point directly to the verified source commit/,
			);
			await writeFile(
				tagPath,
				JSON.stringify({ref: `refs/tags/${manifest.tag}`, object: {type: 'commit', sha: commit}}),
			);
			const verifiedUpload = verifyUpload();
			assert.equal(verifiedUpload.status, 0, verifiedUpload.stderr);
			await writeFile(packPath, 'tampered archive payload');
			const tampered = run(join(dir, 'tampered-release'));
			assert.notEqual(tampered.status, 0);
			assert.match(tampered.stderr, /Character pack differs from its index/);
		} finally {
			await rm(dir, {recursive: true, force: true});
		}
	});
}

test('draft workflow provenance gate rejects noncanonical or failed installer runs', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hc-installer-run-'));
	try {
		const workflow = await readFile(
			new URL('../../.github/workflows/assemble-release.yml', import.meta.url),
			'utf8',
		);
		const step = workflow
			.replace(/\r\n/g, '\n')
			.split('name: Verify the canonical installer run before checking out source')[1]
			?.split('\n      - ')[0];
		const code = /<<'NODE'\n([\s\S]+?)\n\s*NODE/.exec(step ?? '')?.[1];
		assert.ok(code, 'Exercise the actual workflow gate, not a separate validator.');
		const repository = 'squid-quarters/hyper-chamber';
		const source = 'a'.repeat(40);
		const valid = {
			status: 'completed',
			conclusion: 'success',
			event: 'workflow_dispatch',
			name: 'Desktop installers',
			path: '.github/workflows/beta-installers.yml',
			head_branch: 'develop',
			head_sha: source,
			repository: {full_name: repository},
			head_repository: {full_name: repository},
		};
		const run = async record => {
			await writeFile(join(dir, 'installer-run.json'), JSON.stringify(record));
			const result = spawnSync(process.execPath, ['--input-type=module', '-'], {
				input: code,
				encoding: 'utf8',
				timeout: 10000,
				env: {...process.env, RUNNER_TEMP: dir, SOURCE_COMMIT: source, GH_REPO: repository},
			});
			assert.ifError(result.error);
			assert.equal(result.signal, null);
			return result;
		};
		const accepted = await run(valid);
		assert.equal(accepted.status, 0, accepted.stderr);
		for (const [name, patch] of [
			['wrong source commit', {head_sha: 'b'.repeat(40)}],
			['feature branch', {head_branch: 'release/unreviewed'}],
			['pull-request merge build', {event: 'pull_request'}],
			['another workflow name', {name: 'Beta installers'}],
			['another workflow path', {path: '.github/workflows/unreviewed.yml'}],
			['failed run', {conclusion: 'failure'}],
			['unfinished run', {status: 'in_progress'}],
			['another repository', {repository: {full_name: 'other/project'}}],
			['fork head repository', {head_repository: {full_name: 'other/project'}}],
		]) {
			assert.equal((await run({...valid, ...patch})).status, 1, name);
		}
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});
