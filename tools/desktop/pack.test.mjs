import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {assertMacOsMinimum, verifyMacOsRuntime} from './runtime.mjs';
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
