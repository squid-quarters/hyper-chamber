import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {strToU8, Zip, ZipPassThrough, zipSync} from 'fflate';
import {afterEach, describe, expect, it} from 'vitest';
import {gameDefinitionSchema, referenceSchema} from '@hyper-chamber/reference';
import {LibraryCatalog} from './catalog';

const content = fileURLToPath(new URL('../../../content/', import.meta.url));
const game = gameDefinitionSchema.parse(
	JSON.parse(await readFile(join(content, 'games/sf6/game.json'), 'utf8')),
);
const original = referenceSchema.parse(
	JSON.parse(await readFile(join(content, 'games/sf6/references/dhalsim.json'), 'utf8'))[0],
);
const roots: string[] = [];
const catalogs: LibraryCatalog[] = [];
afterEach(async () => {
	for (const catalog of catalogs.splice(0)) await catalog.close();
	for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true});
});

function payload(id: string) {
	const files = {
		'game.json': strToU8(JSON.stringify(game)),
		'references.json': strToU8(JSON.stringify([{...original, relatedIds: []}])),
	};
	return {
		...files,
		'manifest.json': strToU8(
			JSON.stringify({
				formatVersion: 1,
				id,
				version: '1',
				games: ['game.json'],
				catalogs: ['references.json'],
				files: Object.entries(files).map(([path, bytes]) => ({
					path,
					bytes: bytes.length,
					sha256: createHash('sha256').update(bytes).digest('hex'),
				})),
			}),
		),
	};
}
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'hyper-chamber-pack-security-'));
	roots.push(root);
	const seed = join(root, 'seed');
	await mkdir(seed);
	for (const [path, bytes] of Object.entries(payload('starter')))
		await writeFile(join(seed, path), bytes);
	const library = join(root, 'library');
	const catalog = await LibraryCatalog.open({libraryDir: library, seedDir: seed});
	catalogs.push(catalog);
	return {root, library, catalog};
}

describe('content archive resource boundaries', () => {
	it('rejects data hidden in directory entries without replacing the current catalog', async () => {
		const {root, library, catalog} = await fixture();
		const archive = join(root, 'directory-data.hcpack');
		await writeFile(
			archive,
			zipSync({'ignored/': new Uint8Array(8192).fill(65), ...payload('incoming')}),
		);
		await expect(catalog.importArchive(archive)).rejects.toThrow(/directory.*empty/i);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(library, 'packs', '.generations'))).toHaveLength(1);
		expect(catalog.snapshot.references.map(reference => reference.id)).toEqual([original.id]);
	});

	it('counts directory entries toward the archive entry limit', async () => {
		const {root, library, catalog} = await fixture();
		const directories: Record<string, Uint8Array> = {};
		for (let index = 0; index < 29999; index++)
			directories[`directory-${index}/`] = new Uint8Array();
		const archive = join(root, 'excess-directories.hcpack');
		await writeFile(archive, zipSync({...directories, ...payload('incoming')}, {level: 0}));
		await expect(catalog.importArchive(archive)).rejects.toThrow(/excessive archive/i);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(library, 'packs', '.generations'))).toHaveLength(1);
	});

	it('rejects an advertised file size above the per-entry bound', async () => {
		const {root, library, catalog} = await fixture();
		const bytes = zipSync(payload('incoming'), {level: 0});
		new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(
			22,
			2 * 1024 ** 3 + 1,
			true,
		);
		const archive = join(root, 'oversized-header.hcpack');
		await writeFile(archive, bytes);
		await expect(catalog.importArchive(archive)).rejects.toThrow(/entry.*size limit/i);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(library, 'packs', '.generations'))).toHaveLength(1);
	});

	it('accepts empty directories at the total entry boundary', async () => {
		const {root, catalog} = await fixture();
		const directories: Record<string, Uint8Array> = {};
		// Two catalog payloads and the manifest bring this to 30,001 total entries.
		for (let index = 0; index < 29998; index++)
			directories[`directory-${index}/`] = new Uint8Array();
		const archive = join(root, 'entry-boundary.hcpack');
		await writeFile(archive, zipSync({...directories, ...payload('incoming')}, {level: 0}));
		await expect(catalog.importArchive(archive)).resolves.toMatchObject({id: 'incoming'});
	});

	it('checks actual directory data even when its header claims it is empty', async () => {
		const {root, library, catalog} = await fixture();
		const bytes = zipSync(
			{'hidden/': strToU8('unexpected payload'), ...payload('incoming')},
			{level: 0},
		);
		new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(22, 0, true);
		const archive = join(root, 'forged-empty-directory.hcpack');
		await writeFile(archive, bytes);
		await expect(catalog.importArchive(archive)).rejects.toThrow(/directory.*empty/i);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(library, 'packs', '.generations'))).toHaveLength(1);
	});

	it('accepts empty directories and files using streaming data descriptors', async () => {
		const {root, catalog} = await fixture();
		const chunks: Uint8Array[] = [];
		const zip = new Zip((error, chunk) => {
			if (error) throw error;
			chunks.push(chunk);
		});
		for (const [path, bytes] of Object.entries({
			'empty/': new Uint8Array(),
			...payload('incoming'),
		})) {
			const entry = new ZipPassThrough(path);
			zip.add(entry);
			entry.push(bytes, true);
		}
		zip.end();
		const bytes = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.length;
		}
		const archive = join(root, 'streaming.hcpack');
		await writeFile(archive, bytes);
		await expect(catalog.importArchive(archive)).resolves.toMatchObject({id: 'incoming'});
	});
});

describe('portable library pack directory', () => {
	it('refuses a pre-existing linked packs directory before seeding outside the library', async () => {
		const {root, library} = await fixture();
		await rm(join(library, 'packs'), {recursive: true});
		const outside = join(root, 'outside-library');
		await mkdir(outside);
		await writeFile(join(outside, 'starter'), 'Keep this outside file');
		await symlink(
			outside,
			join(library, 'packs'),
			process.platform === 'win32' ? 'junction' : 'dir',
		);
		await expect(
			LibraryCatalog.open({libraryDir: library, seedDir: join(root, 'seed')}).then(() => true),
		).rejects.toThrow(/packs.*directory/i);
		expect(await readFile(join(outside, 'starter'), 'utf8')).toBe('Keep this outside file');
		expect(await readdir(outside)).toEqual(['starter']);
	});

	it('rechecks the packs directory before importing and leaves outside files unchanged', async () => {
		const {root, library, catalog} = await fixture();
		const retained = join(root, 'retained-packs');
		await rename(join(library, 'packs'), retained);
		const outside = join(root, 'outside-library');
		await mkdir(outside);
		await writeFile(join(outside, 'config'), 'Keep this outside configuration');
		await symlink(
			outside,
			join(library, 'packs'),
			process.platform === 'win32' ? 'junction' : 'dir',
		);
		const archive = join(root, 'config.hcpack');
		await writeFile(archive, zipSync(payload('config')));
		await expect(catalog.importArchive(archive)).rejects.toThrow(/packs.*directory/i);
		expect(await readFile(join(outside, 'config'), 'utf8')).toBe('Keep this outside configuration');
		expect(await readdir(outside)).toEqual(['config']);
		await rm(join(library, 'packs'));
		await rename(retained, join(library, 'packs'));
		await expect(catalog.importArchive(archive)).resolves.toMatchObject({id: 'config'});
	});

	it.each(['chosen root', 'ancestor'])('allows a legitimate %s directory alias', async kind => {
		const {root, library} = await fixture();
		const alias = join(root, 'library-alias');
		const target = kind === 'chosen root' ? library : root;
		await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir');
		const libraryDir = kind === 'chosen root' ? alias : join(alias, 'library');
		const catalog = await LibraryCatalog.open({libraryDir});
		catalogs.push(catalog);
		expect(catalog.snapshot.references.map(reference => reference.id)).toEqual([original.id]);
	});
});
