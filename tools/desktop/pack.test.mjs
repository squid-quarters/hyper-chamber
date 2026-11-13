import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile, stat, open} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {assertMacOsMinimum, assertNativeRuntime, verifyMacOsRuntime} from './runtime.mjs';
import {createRequire} from 'node:module';
import {
	collectPack,
	describeFile,
	mediaPaths,
	safePackPath,
	writePackArchive,
	writeUnpackedPack,
} from './pack.mjs';
const require = createRequire(new URL('../../apps/desktop/package.json', import.meta.url));

test('pack paths reject traversal and media retains every authored asset once', () => {
	for (const path of [
		'/root',
		'C:/drive',
		'../clip',
		'media/../clip',
		'media\\clip',
		'media//clip',
		'media/./clip',
		'media/\0clip',
	])
		assert.throws(() => safePackPath(path));
	assert.deepEqual(
		mediaPaths({
			media: {
				clip: '/media/x/clip.mp4',
				poster: '/media/x/1.jpg',
				frames: [{src: '/media/x/1.jpg'}],
			},
		}),
		['media/x/clip.mp4', 'media/x/1.jpg'],
	);
	assert.throws(() => mediaPaths({media: {clip: 'https://elsewhere/clip.mp4'}}));
});

test('archives preserve content, manifest hashes, and repeatable bytes without extracting files', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-test-'));
	try {
		const source = join(dir, 'source');
		await writeFile(source, 'a useful clip');
		const file = await describeFile('media/test/clip.mp4', source);
		const pack = {
			manifest: {
				formatVersion: 1,
				id: 'test',
				version: '1',
				games: [],
				catalogs: [],
				files: [file],
			},
			sources: new Map([[file.path, source]]),
		};
		await writePackArchive(pack, join(dir, 'one.hcpack'));
		await writePackArchive(pack, join(dir, 'two.hcpack'));
		assert.deepEqual(
			await readFile(join(dir, 'one.hcpack')),
			await readFile(join(dir, 'two.hcpack')),
		);
		await assert.rejects(() => writePackArchive(pack, join(dir, 'one.hcpack')), {code: 'EEXIST'});
		const {unzipSync, strFromU8} = require('fflate');
		const entries = unzipSync(await readFile(join(dir, 'one.hcpack')));
		assert.equal(strFromU8(entries[file.path]), 'a useful clip');
		assert.deepEqual(JSON.parse(strFromU8(entries['manifest.json'])), pack.manifest);
		await writeUnpackedPack(pack, join(dir, 'unpacked'));
		assert.equal((await readFile(join(dir, 'unpacked', file.path))).toString(), 'a useful clip');
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('starter is a complete self-contained collection of three Dhalsim demonstrations', async () => {
	const pack = await collectPack({starter: true});
	assert.equal(pack.referenceCount, 3);
	assert.equal(pack.clipCount, 3);
	assert.equal(pack.manifest.files.filter(file => file.path.endsWith('/clip.mp4')).length, 3);
	assert.equal(pack.manifest.catalogs.length, 1);
	const references = JSON.parse(pack.sources.get(pack.manifest.catalogs[0]).toString());
	const ids = new Set(references.map(reference => reference.id));
	assert.ok(references.every(reference => reference.relatedIds.every(id => ids.has(id))));
	assert.ok(
		pack.manifest.files.every(file => /^[0-9a-f]{64}$/.test(file.sha256) && file.bytes > 0),
	);
});

test('installer minimum cannot understate the bundled Node runtime requirement', () => {
	assert.throws(() => assertMacOsMinimum('13.5', '12.0'));
	assert.throws(() => assertMacOsMinimum('13.5', '13.4'));
	assert.doesNotThrow(() => assertMacOsMinimum('13.5.0', '13.5'));
	assert.doesNotThrow(() => assertMacOsMinimum('13.5', '14.0'));
});
test(
	'macOS application metadata supports the actual Node executable',
	{skip: process.platform !== 'darwin'},
	async () => {
		const config = JSON.parse(
			await readFile(
				new URL('../../apps/desktop/src-tauri/tauri.conf.json', import.meta.url),
				'utf8',
			),
		);
		verifyMacOsRuntime(config.bundle.macOS.minimumSystemVersion);
	},
);

test('desktop runtime pin and native target reject mismatched builds', () => {
	assert.doesNotThrow(() =>
		assertNativeRuntime(
			{version: 'v24.14.1', platform: 'darwin', arch: 'arm64'},
			{platform: 'darwin', arch: 'arm64'},
		),
	);
	assert.doesNotThrow(() =>
		assertNativeRuntime({version: 'v24.14.1', platform: 'win32', arch: 'x64'}),
	);
	assert.throws(() =>
		assertNativeRuntime({version: 'v24.15.0', platform: 'darwin', arch: 'arm64'}),
	);
	assert.throws(() =>
		assertNativeRuntime({version: 'v24.14.1', platform: 'darwin', arch: 'arm64'}, {arch: 'x64'}),
	);
	assert.throws(() => assertNativeRuntime({version: 'v24.14.1', platform: 'win32', arch: 'arm64'}));
});

test('streaming readers preserve binary ZIP signatures across arbitrary chunk boundaries', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-binary-test-'));
	try {
		const payload = Buffer.alloc(180000, 0xab);
		for (const offset of [45000, 65534, 131071]) {
			payload.set([0x50, 0x4b, 0x07, 0x08], offset);
			payload.fill(0, offset + 4, offset + 16);
		}
		payload.set([0x50, 0x4b, 0x03, 0x04], 90000);
		payload.fill(0, 90004, 90030);
		const file = await describeFile('media/test/clip.mp4', payload);
		const pack = {
			manifest: {
				formatVersion: 1,
				id: 'binary',
				version: '1',
				games: [],
				catalogs: [],
				files: [file],
			},
			sources: new Map([[file.path, payload]]),
		};
		const archivePath = join(dir, 'binary.hcpack');
		await writePackArchive(pack, archivePath);
		const archive = await readFile(archivePath);
		const {Unzip, UnzipInflate} = require('fflate');
		for (const chunkSize of [65536, 17]) {
			const entries = new Map();
			let failure;
			const unzip = new Unzip(entry => {
				const chunks = [];
				entry.ondata = (error, chunk, final) => {
					if (error) failure = error;
					else chunks.push(Buffer.from(chunk));
					if (final) entries.set(entry.name, Buffer.concat(chunks));
				};
				entry.start();
			});
			unzip.register(UnzipInflate);
			for (let offset = 0; offset < archive.length; offset += chunkSize)
				unzip.push(archive.subarray(offset, offset + chunkSize));
			unzip.push(new Uint8Array(), true);
			if (failure) throw failure;
			assert.equal(
				entries.get(file.path)?.length,
				payload.length,
				`Streaming chunk size ${chunkSize}`,
			);
			assert.deepEqual(entries.get(file.path), payload, `Streaming chunk size ${chunkSize}`);
			assert.deepEqual([...entries.keys()], ['manifest.json', file.path]);
		}
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('archive failures remove partial output and refuse changed source bytes', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-failure-test-'));
	try {
		const source = join(dir, 'source');
		await writeFile(source, 'original');
		const file = await describeFile('media/test/clip.mp4', source);
		const pack = {
			manifest: {
				formatVersion: 1,
				id: 'test',
				version: '1',
				games: [],
				catalogs: [],
				files: [file],
			},
			sources: new Map([[file.path, source]]),
		};
		for (const replacement of ['short', 'a longer replacement', 'modified']) {
			await writeFile(source, replacement);
			const output = join(dir, 'incomplete.hcpack');
			await assert.rejects(writePackArchive(pack, output), /source (?:size|hash) changed/);
			await assert.rejects(stat(output), {code: 'ENOENT'});
		}
		await rm(source);
		const output = join(dir, 'missing.hcpack');
		await assert.rejects(writePackArchive(pack, output), {code: 'ENOENT'});
		await assert.rejects(stat(output), {code: 'ENOENT'});
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('ZIP32 bounds reject oversized archives, UTF-8 names, and excessive entries', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-limits-test-'));
	try {
		const base = {formatVersion: 1, id: 'test', version: '1', games: [], catalogs: []};
		for (const files of [
			[{path: 'media/clip.mp4', bytes: 2 ** 31}],
			[{path: 'media/clip.mp4', bytes: 2 ** 31 - 1}],
			[{path: 'media/clip.mp4', bytes: -1}],
			[{path: 'media/clip.mp4', bytes: 1.5}],
			[{path: 'é'.repeat(32768), bytes: 1}],
			[{path: 'manifest.json', bytes: 1}],
			Array.from({length: 30000}, (_, i) => ({path: `media/${i}`, bytes: 1})),
		]) {
			const output = join(dir, 'invalid.hcpack');
			await assert.rejects(
				writePackArchive({manifest: {...base, files}, sources: new Map()}, output),
			);
			await assert.rejects(stat(output), {code: 'ENOENT'});
		}
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('archives retain Unicode filenames and matching local/central CRCs without descriptors', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-unicode-test-'));
	try {
		const payload = Buffer.from('123456789');
		const file = await describeFile('media/武術/épreuve.bin', payload);
		const manifest = {
			formatVersion: 1,
			id: 'test',
			version: '1',
			games: [],
			catalogs: [],
			files: [file],
		};
		const output = join(dir, 'unicode.hcpack');
		await writePackArchive({manifest, sources: new Map([[file.path, payload]])}, output);
		const archive = await readFile(output);
		const {unzipSync} = require('fflate');
		assert.deepEqual(Buffer.from(unzipSync(archive)[file.path]), payload);
		const directory = archive.readUInt32LE(archive.length - 6);
		let offset = 0;
		for (let index = 0, central = directory; index < 2; index++) {
			assert.equal(archive.readUInt32LE(offset), 0x04034b50);
			assert.equal(archive.readUInt16LE(offset + 6), 0x0800);
			assert.equal(archive.readUInt16LE(central + 8), 0x0800);
			assert.equal(archive.readUInt32LE(offset + 14), archive.readUInt32LE(central + 16));
			if (index === 1) assert.equal(archive.readUInt32LE(offset + 14), 0xcbf43926);
			offset += 30 + archive.readUInt16LE(offset + 26) + archive.readUInt32LE(offset + 18);
			central += 46 + archive.readUInt16LE(central + 28);
		}
		assert.equal(offset, directory, 'No ambiguous data-descriptor records follow payloads.');
	} finally {
		await rm(dir, {recursive: true, force: true});
	}
});

test('archive writes retry partial I/O and remove output when a write stalls', async context => {
	const dir = await mkdtemp(join(tmpdir(), 'hcpack-write-test-'));
	try {
		const probe = await open(join(dir, 'probe'), 'wx');
		const prototype = Object.getPrototypeOf(probe);
		const original = prototype.write;
		await probe.close();
		const payload = Buffer.from('partial writes');
		const file = await describeFile('media/clip.bin', payload);
		const pack = {
			manifest: {
				formatVersion: 1,
				id: 'test',
				version: '1',
				games: [],
				catalogs: [],
				files: [file],
			},
			sources: new Map([[file.path, payload]]),
		};
		context.mock.method(prototype, 'write', function (buffer, offset, length, position) {
			return original.call(this, buffer, offset, Math.min(length, 7), position);
		});
		const output = join(dir, 'partial.hcpack');
		await writePackArchive(pack, output);
		const {unzipSync} = require('fflate');
		assert.deepEqual(Buffer.from(unzipSync(await readFile(output))[file.path]), payload);
		context.mock.restoreAll();
		context.mock.method(prototype, 'write', async () => ({bytesWritten: 0}));
		const failed = join(dir, 'stalled.hcpack');
		await assert.rejects(writePackArchive(pack, failed), /write made no progress/);
		await assert.rejects(stat(failed), {code: 'ENOENT'});
	} finally {
		context.mock.restoreAll();
		await rm(dir, {recursive: true, force: true});
	}
});
