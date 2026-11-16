import {createHash, randomUUID} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import {request as httpRequest} from 'node:http';
import {once} from 'node:events';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {strToU8, zipSync} from 'fflate';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {referenceSchema, gameDefinitionSchema} from '@hyper-chamber/reference';
import {createWorkspace} from '@hyper-chamber/authoring';
import {LibraryCatalog} from './catalog';
import {acquireLibraryOwnership, PracticeStore} from './store';
import {startLibraryServer, type LibraryServer} from './index';
const disk = vi.hoisted(() => ({
	unavailable: false,
	failSnapshotPublish: false,
	failStageCleanup: false,
}));
vi.mock('node:fs/promises', async importOriginal => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return {
		...actual,
		rm: async (...args: Parameters<typeof actual.rm>) => {
			if (disk.failStageCleanup && String(args[0]).includes('.generations/'))
				throw new Error('Simulated preview cleanup EPERM');
			return actual.rm(...args);
		},
		rename: async (...args: Parameters<typeof actual.rename>) => {
			if (disk.failSnapshotPublish && String(args[0]).includes('.pending-backup-'))
				throw new Error('Simulated snapshot publish failure');
			return actual.rename(...args);
		},
		statfs: async (...args: Parameters<typeof actual.statfs>) => {
			const info = await actual.statfs(...args);
			if (disk.unavailable) info.bavail = 0;
			return info;
		},
	};
});

const content = fileURLToPath(new URL('../../../content/', import.meta.url));
const game = gameDefinitionSchema.parse(
	JSON.parse(await readFile(join(content, 'games/sf6/game.json'), 'utf8')),
);
const reference = {
	...referenceSchema.parse(
		JSON.parse(await readFile(join(content, 'games/sf6/references/dhalsim.json'), 'utf8'))[0],
	),
	relatedIds: [],
};
const v1Sql = await readFile(new URL('./test-fixtures/v1.0.0.sql', import.meta.url), 'utf8');
const cleanups: Array<() => void | Promise<unknown>> = [];
afterEach(async () => {
	disk.unavailable = false;
	disk.failSnapshotPublish = false;
	disk.failStageCleanup = false;
	vi.restoreAllMocks();
	for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});
async function directory() {
	const root = await mkdtemp(join(tmpdir(), 'hc-lifecycle-'));
	cleanups.push(() => rm(root, {recursive: true, force: true}));
	return root;
}
function dbRead(root: string, sql: string) {
	const db = new DatabaseSync(join(root, 'hyper-chamber.sqlite'), {readOnly: true});
	try {
		return db.prepare(sql).all();
	} finally {
		db.close();
	}
}
async function releasedLibrary() {
	const root = await directory();
	const db = new DatabaseSync(join(root, 'hyper-chamber.sqlite'));
	db.exec(v1Sql);
	db.close();
	return root;
}
async function pack(
	root: string,
	id = 'starter',
	version = '1.0.0',
	clip = 'old clip',
	revision = reference.revision,
) {
	const files: Record<string, Uint8Array> = {
		'game.json': strToU8(JSON.stringify(game)),
		'references.json': strToU8(JSON.stringify([{...reference, revision}])),
	};
	files[reference.media.clip.slice(1)] = strToU8(clip);
	const manifest = {
		formatVersion: 1,
		id,
		version,
		games: ['game.json'],
		catalogs: ['references.json'],
		files: Object.entries(files).map(([path, bytes]) => ({
			path,
			bytes: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
		})),
	};
	const payload = {...files, 'manifest.json': strToU8(JSON.stringify(manifest))};
	await mkdir(root, {recursive: true});
	for (const [path, bytes] of Object.entries(payload)) {
		await mkdir(join(root, path, '..'), {recursive: true});
		await writeFile(join(root, path), bytes);
	}
	return payload;
}
async function archive(
	root: string,
	id = 'starter',
	version = '1.0.0',
	clip = 'new clip',
	revision = reference.revision,
) {
	const payload = await pack(join(root, `source-${randomUUID()}`), id, version, clip, revision);
	const path = join(root, `${randomUUID()}.hcpack`);
	await writeFile(path, zipSync(payload));
	return path;
}
async function openCatalog(root: string, seedDir?: string) {
	const catalog = await LibraryCatalog.open({libraryDir: root, seedDir});
	cleanups.push(() => catalog.close());
	return catalog;
}
async function server(root: string, seedDir?: string) {
	const app = await startLibraryServer({
		libraryDir: root,
		seedDir,
		port: 0,
		adminToken: 'lifecycle-test-token',
	});
	cleanups.push(() => app.close());
	return app;
}
function personalHeaders(
	app: LibraryServer,
	maintenanceRevision = app.runtime().maintenanceRevision,
) {
	return {
		'Content-Type': 'application/json',
		'X-Hyper-Chamber-Library': app.libraryId,
		'X-Hyper-Chamber-Maintenance': String(maintenanceRevision),
	};
}
async function admin(app: LibraryServer, path: string, body: unknown = {}) {
	return fetch(`${app.url}/api/admin/${path}`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Host': 'lifecycle-test-token'},
		body: JSON.stringify(body),
	});
}

describe('released-library upgrade contract', () => {
	it('upgrades actual v1.0.0 data and registers legacy media in place only once', async () => {
		const root = await releasedLibrary();
		const packRoot = join(root, 'packs/starter');
		await pack(packRoot);
		const before = await stat(join(packRoot, reference.media.clip.slice(1)));
		const app = await server(root);
		expect(app.libraryId).toBe('6e1b9675-e60a-4e04-8ae7-d6a93d219380');
		const practice = await (await fetch(`${app.url}/api/practice`)).json();
		expect(practice.entries[reference.id]).toMatchObject({
			note: 'Keep this released-library note.',
			saved: true,
			status: 'reliable',
			revision: 3,
			rowVersion: 3,
		});
		expect(practice.entries['temporarily-unavailable'].note).toBe(
			'Keep unavailable references too.',
		);
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(2);
		expect(dbRead(root, 'SELECT root FROM installed_packs')[0].root).toBe('packs/starter');
		expect((await stat(join(packRoot, reference.media.clip.slice(1)))).ino).toBe(before.ino);
		const backups = await readdir(join(root, 'snapshots'));
		expect(backups).toHaveLength(1);
		const snapshot = new DatabaseSync(join(root, 'snapshots', backups[0]), {readOnly: true});
		expect(snapshot.prepare('PRAGMA user_version').get()?.user_version).toBe(1);
		snapshot.close();
		await app.close();
		const reopened = await server(root);
		expect(reopened.libraryId).toBe(app.libraryId);
		expect(await readdir(join(root, 'snapshots'))).toEqual(backups);
	});
	it('refuses newer databases before creating, seeding or recovering any pack state', async () => {
		const root = await releasedLibrary();
		const db = new DatabaseSync(join(root, 'hyper-chamber.sqlite'));
		db.exec('PRAGMA user_version=99');
		db.close();
		const seed = join(root, 'source');
		await pack(seed);
		await expect(startLibraryServer({libraryDir: root, seedDir: seed, port: 0})).rejects.toThrow(
			/newer Hyper Chamber/,
		);
		expect(await readdir(root)).toEqual(expect.not.arrayContaining(['packs', '.host-lock.sqlite']));
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(99);
	});
	it('validates legacy packs before committing the schema conversion', async () => {
		const root = await releasedLibrary();
		await pack(join(root, 'packs/starter'));
		await writeFile(join(root, 'packs/starter/references.json'), 'invalid');
		await expect(LibraryCatalog.open({libraryDir: root})).rejects.toThrow();
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(1);
		expect(
			dbRead(
				root,
				"SELECT note FROM practice_entries WHERE reference_id='temporarily-unavailable'",
			)[0].note,
		).toBe('Keep unavailable references too.');
	});
	it('does not upgrade if its required backup cannot be created', async () => {
		const root = await releasedLibrary();
		await writeFile(join(root, 'snapshots'), 'not a directory');
		await expect(PracticeStore.open(root)).rejects.toThrow(/snapshots.*directory/);
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(1);
	});
	it('uses OS-released ownership across separate host processes', async () => {
		const root = await directory();
		const release = await acquireLibraryOwnership(root);
		cleanups.push(release);
		const probe = () =>
			spawnSync(
				process.execPath,
				[
					'--input-type=module',
					'-e',
					`import {DatabaseSync} from 'node:sqlite';try{const db=new DatabaseSync(process.argv[1]);db.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');process.exit(0);}catch{process.exit(2);}`,
					join(root, '.host-lock.sqlite'),
				],
				{timeout: 10000},
			);
		expect(probe().status).toBe(2);
		release();
		expect(probe().status).toBe(0);
		const reacquire = await acquireLibraryOwnership(root);
		reacquire();
	});
	it('refuses a second running host and releases ownership after a startup error', async () => {
		const root = await directory();
		const app = await server(root);
		await expect(startLibraryServer({libraryDir: root, port: 0})).rejects.toThrow(/already open/);
		await app.close();
		const again = await server(root);
		await again.close();
		const broken = await releasedLibrary();
		await pack(join(broken, 'packs/broken'));
		await expect(startLibraryServer({libraryDir: broken, port: 0})).rejects.toThrow(
			/directory.*manifest/,
		);
		const release = await acquireLibraryOwnership(broken);
		release();
	});
});

describe('transactional installed content', () => {
	it('previews without activating, discards staging, and imports identical editions idempotently', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		const path = await archive(root);
		const preview = await catalog.previewArchive(path);
		expect(preview).toMatchObject({action: 'install', added: [reference.id], generation: 1});
		expect(catalog.snapshot.references).toHaveLength(0);
		await catalog.discardPreview(preview.token);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
		const installed = await catalog.importArchive(path);
		const again = await catalog.importArchive(path);
		expect(again.generation).toBe(installed.generation);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(1);
	});
	it('removes the last pack durably while retaining notes and reconnecting them on reimport', async () => {
		const root = await releasedLibrary();
		const seed = join(root, 'seed');
		await pack(seed);
		const catalog = await openCatalog(root, seed);
		const generation = catalog.generation;
		await catalog.removePack('starter', generation);
		expect(catalog.snapshot.references).toEqual([]);
		expect((await catalog.inventory()).packs).toEqual([]);
		expect(catalog.store.snapshot().entries[reference.id].note).toBe(
			'Keep this released-library note.',
		);
		await catalog.close();
		const reopened = await openCatalog(root, seed);
		expect(reopened.snapshot.references).toEqual([]);
		expect((await reopened.inventory()).packs).toEqual([]);
		await reopened.importArchive(await archive(root));
		expect(reopened.store.snapshot().entries[reference.id]).toMatchObject({
			saved: true,
			status: 'reliable',
			revision: 3,
			rowVersion: 3,
		});
	});
	it('retains one prior edition, reclaims older editions, and never serves new bytes through an old generation', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root, 'starter', '1.0.0', 'first'));
		const oldGeneration = catalog.generation;
		await catalog.importArchive(await archive(root, 'starter', '1.1.0', 'second'));
		expect(
			await readFile(
				catalog.media(reference.media.clip, oldGeneration)!.root +
					'/' +
					reference.media.clip.slice(1),
				'utf8',
			),
		).toBe('first');
		expect((await catalog.inventory()).packs[0].retainedBytes).toBeGreaterThan(0);
		await catalog.importArchive(await archive(root, 'starter', '1.2.0', 'third'));
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(2);
		expect(catalog.media(reference.media.clip, oldGeneration)).toBeUndefined();
		await catalog.removePack('starter', catalog.generation);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
	});
	it('preserves leased media during removal and reclaims it when the response releases ownership', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root));
		const generation = catalog.generation;
		const held = catalog.holdMedia(reference.media.clip, generation)!;
		await catalog.removePack('starter', generation);
		expect(catalog.media(reference.media.clip, generation)).toBeUndefined();
		expect(await readFile(join(held.file.root, held.file.path), 'utf8')).toBe('new clip');
		held.release();
		await catalog.cleanup();
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
	});
	it('does not activate abandoned generation folders or resurrect removed legacy copies after restart', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root));
		const abandoned = join(root, 'packs/.generations', randomUUID());
		await pack(abandoned, 'abandoned');
		await catalog.removePack('starter', catalog.generation);
		await catalog.close();
		await pack(join(root, 'packs/.previous-starter-interrupted'));
		const reopened = await openCatalog(root);
		expect(reopened.snapshot.references).toHaveLength(0);
		expect((await reopened.inventory()).packs).toEqual([]);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
	});
	it('requires explicit approval for edition rollback and rejects a stale preview generation', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root, 'starter', '2.0.0'));
		const rollback = await catalog.previewArchive(await archive(root, 'starter', '1.0.0'));
		await expect(
			catalog.commitPreview(rollback.token, {expectedGeneration: rollback.generation}),
		).rejects.toThrow(/older pack edition/);
		await expect(
			catalog.commitPreview(rollback.token, {
				expectedGeneration: rollback.generation - 1,
				allowDowngrade: true,
			}),
		).rejects.toThrow(/content changed/);
		await catalog.commitPreview(rollback.token, {
			expectedGeneration: rollback.generation,
			allowDowngrade: true,
		});
		expect((await catalog.inventory()).packs[0].version).toBe('1.0.0');
	});
	it('requires explicit approval for shared game profile changes', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root, 'starter'));
		const source = join(root, 'custom-source');
		const payload = await pack(source, 'custom');
		const changed = {...game, name: 'Custom SF6 profile'};
		payload['game.json'] = strToU8(JSON.stringify(changed));
		const manifest = JSON.parse(new TextDecoder().decode(payload['manifest.json']));
		const entry = manifest.files.find((file: {path: string}) => file.path === 'game.json');
		entry.bytes = payload['game.json'].length;
		entry.sha256 = createHash('sha256').update(payload['game.json']).digest('hex');
		payload['manifest.json'] = strToU8(JSON.stringify(manifest));
		const path = join(root, 'custom.hcpack');
		await writeFile(path, zipSync(payload));
		const preview = await catalog.previewArchive(path);
		expect(preview.conflicts).toContain('Game profile sf6 differs from another installed pack.');
		await expect(
			catalog.commitPreview(preview.token, {expectedGeneration: preview.generation}),
		).rejects.toThrow(/overlapping/);
	});
});

describe('selective learner restoration and cached clients', () => {
	it('restores learner data without reviving removed packs, and invalidates stale writes', async () => {
		const root = await releasedLibrary();
		await pack(join(root, 'packs/starter'));
		const app = await server(root);
		const saved = await (await admin(app, 'backup')).json();
		const stale = app.runtime().maintenanceRevision;
		await fetch(`${app.url}/api/practice/${reference.id}`, {
			method: 'PATCH',
			headers: personalHeaders(app),
			body: JSON.stringify({patch: {note: 'After snapshot'}, expectedVersion: 3}),
		});
		const inventory = await (await admin(app, 'content/list')).json();
		await admin(app, 'content/remove', {
			packId: 'starter',
			expectedGeneration: inventory.generation,
		});
		const restored = await admin(app, 'backup/restore', {
			file: saved.file,
			expectedMaintenanceRevision: stale,
		});
		expect(restored.status).toBe(200);
		expect((await (await admin(app, 'content/list')).json()).packs).toEqual([]);
		const personal = await (await fetch(`${app.url}/api/practice`)).json();
		expect(personal.entries[reference.id].note).toBe('Keep this released-library note.');
		expect(personal.entries[reference.id].rowVersion).toBeGreaterThan(4);
		const rejected = await fetch(`${app.url}/api/practice/${reference.id}`, {
			method: 'PATCH',
			headers: personalHeaders(app, stale),
			body: JSON.stringify({
				patch: {note: 'Stale overwrite'},
				expectedVersion: personal.entries[reference.id].rowVersion,
			}),
		});
		expect(rejected.status).toBe(409);
		expect((await rejected.json()).error.code).toBe('maintenance_changed');
		const missingProtocol = await fetch(`${app.url}/api/practice/${reference.id}`, {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Library': app.libraryId},
			body: JSON.stringify({
				patch: {note: 'Old browser'},
				expectedVersion: personal.entries[reference.id].rowVersion,
			}),
		});
		expect(missingProtocol.status).toBe(409);
	});
});

describe('upgrade and activation failure boundaries', () => {
	it('fails closed on a corrupt library identity before upgrading or creating packs', async () => {
		const root = await releasedLibrary();
		const db = new DatabaseSync(join(root, 'hyper-chamber.sqlite'));
		db.prepare("UPDATE metadata SET value='invalid' WHERE key='library-id'").run();
		db.close();
		await expect(startLibraryServer({libraryDir: root, port: 0})).rejects.toThrow(
			/identity is invalid/,
		);
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(1);
		expect(await readdir(root)).not.toContain('packs');
	});
	it('preserves the old edition when activation cannot commit and allows a reviewed retry', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root, 'starter', '1.0.0', 'first'));
		const preview = await catalog.previewArchive(await archive(root, 'starter', '1.1.0', 'second'));
		const fail = vi.spyOn(catalog.store, 'replaceRegistry').mockImplementationOnce(() => {
			throw new Error('Simulated SQLite commit failure');
		});
		await expect(
			catalog.commitPreview(preview.token, {expectedGeneration: preview.generation}),
		).rejects.toThrow(/commit failure/);
		fail.mockRestore();
		expect((await catalog.inventory()).packs[0].version).toBe('1.0.0');
		expect(catalog.generation).toBe(preview.generation);
		await catalog.commitPreview(preview.token, {expectedGeneration: preview.generation});
		expect((await catalog.inventory()).packs[0].version).toBe('1.1.0');
	});
	it('rejects insufficient staging space without changing installed content', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root));
		const generation = catalog.generation;
		const path = await archive(root, 'second');
		disk.unavailable = true;
		await expect(catalog.previewArchive(path)).rejects.toThrow(/not enough free space/);
		disk.unavailable = false;
		expect(catalog.generation).toBe(generation);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(1);
	});
	it('recovers a committed removal even if the process stopped before reclaiming its media', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root));
		catalog.store.replaceRegistry([], catalog.generation);
		await catalog.close();
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(1);
		const reopened = await openCatalog(root);
		expect((await reopened.inventory()).packs).toEqual([]);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
	});
});

describe('registered pack repair mode', () => {
	it.each(['missing clip', 'corrupt catalog'])(
		'keeps healthy content and notes accessible after %s, then repairs the same edition',
		async damage => {
			const root = await releasedLibrary();
			const catalog = await openCatalog(root);
			const original = await archive(root, 'starter');
			await catalog.importArchive(original);
			await catalog.importArchive(await archive(root, 'healthy'));
			const record = catalog.store.registry().find(pack => pack.id === 'starter')!;
			await catalog.close();
			if (damage === 'missing clip')
				await rm(join(root, record.root, reference.media.clip.slice(1)));
			else await writeFile(join(root, record.root, 'references.json'), 'corrupt catalog');
			const reopened = await openCatalog(root);
			const inventory = await reopened.inventory();
			expect(inventory.packs).toHaveLength(2);
			expect(inventory.packs.find(pack => pack.id === 'starter')?.problem).toBeTruthy();
			expect(inventory.packs.find(pack => pack.id === 'healthy')?.problem).toBeUndefined();
			expect(reopened.snapshot.references).toHaveLength(1);
			expect(reopened.store.snapshot().entries[reference.id].note).toBe(
				'Keep this released-library note.',
			);
			const preview = await reopened.previewArchive(original);
			expect(preview.action).toBe('update');
			expect(preview.warnings.join(' ')).toMatch(/damaged pack/);
			await reopened.commitPreview(preview.token, {expectedGeneration: preview.generation});
			expect(
				(await reopened.inventory()).packs.find(pack => pack.id === 'starter')?.problem,
			).toBeUndefined();
			expect(reopened.store.snapshot().entries[reference.id].note).toBe(
				'Keep this released-library note.',
			);
		},
	);
	it('allows removing a missing registered pack without reviving its previous edition', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		await catalog.importArchive(await archive(root, 'starter', '1.0.0'));
		await catalog.importArchive(await archive(root, 'starter', '1.1.0'));
		const record = catalog.store.registry()[0];
		await catalog.close();
		await rm(join(root, record.root), {recursive: true});
		const reopened = await openCatalog(root);
		expect((await reopened.inventory()).packs[0].problem).toBeTruthy();
		await reopened.removePack('starter', reopened.generation);
		expect((await reopened.inventory()).packs).toEqual([]);
		expect(await readdir(join(root, 'packs/.generations'))).toHaveLength(0);
	});
	it('detects same-size media corruption on an identical-edition reimport and repairs it', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		const path = await archive(root);
		await catalog.importArchive(path);
		const record = catalog.store.registry()[0];
		await writeFile(join(root, record.root, reference.media.clip.slice(1)), 'bad clip');
		const preview = await catalog.previewArchive(path);
		expect(preview.action).toBe('update');
		expect(preview.warnings.join(' ')).toMatch(/damaged pack/);
		await catalog.commitPreview(preview.token, {expectedGeneration: preview.generation});
		expect(
			await readFile(
				join(catalog.media(reference.media.clip)!.root, reference.media.clip.slice(1)),
				'utf8',
			),
		).toBe('new clip');
	});
});

describe('pack format compatibility', () => {
	it('rejects own-recording provenance in a legacy format-1 envelope', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		const payload = await pack(join(root, 'source'));
		const recording = {
			...reference,
			source: {...reference.source, kind: 'recording', url: undefined},
		};
		payload['references.json'] = strToU8(JSON.stringify([recording]));
		const manifest = JSON.parse(new TextDecoder().decode(payload['manifest.json']));
		const entry = manifest.files.find((file: {path: string}) => file.path === 'references.json');
		entry.bytes = payload['references.json'].length;
		entry.sha256 = createHash('sha256').update(payload['references.json']).digest('hex');
		payload['manifest.json'] = strToU8(JSON.stringify(manifest));
		const path = join(root, 'legacy-recording.hcpack');
		await writeFile(path, zipSync(payload));
		await expect(catalog.previewArchive(path)).rejects.toThrow(/recordings.*format.2/i);
		expect(catalog.packCount).toBe(0);
	});
});

describe('legacy recovery-copy migration', () => {
	it('does not let a corrupt retired copy disable a valid active v1 library', async () => {
		const root = await releasedLibrary();
		await pack(join(root, 'packs/starter'));
		const retired = join(root, 'packs/.previous-starter-corrupt');
		await mkdir(retired);
		await writeFile(join(retired, 'manifest.json'), 'corrupt old recovery copy');
		const catalog = await openCatalog(root);
		expect(catalog.snapshot.references).toHaveLength(1);
		expect(catalog.store.snapshot().entries[reference.id].note).toBe(
			'Keep this released-library note.',
		);
		expect((await catalog.inventory()).packs.map(pack => pack.id)).toEqual(['starter']);
		expect(await readdir(join(root, 'packs'))).not.toContain('.previous-starter-corrupt');
	});
});

describe('snapshot publication failures', () => {
	it('publishes only complete snapshots and leaves v1 data unchanged if publication fails', async () => {
		const root = await releasedLibrary();
		disk.failSnapshotPublish = true;
		await expect(
			PracticeStore.open(root).then(store => {
				store.close();
				return true;
			}),
		).rejects.toThrow(/snapshot publish failure/);
		disk.failSnapshotPublish = false;
		expect(dbRead(root, 'PRAGMA user_version')[0].user_version).toBe(1);
		expect(await readdir(join(root, 'snapshots'))).toEqual([]);
		const store = await PracticeStore.open(root);
		cleanups.push(() => store.close());
		expect(store.snapshot().entries[reference.id].note).toBe('Keep this released-library note.');
		expect(await readdir(join(root, 'snapshots'))).toHaveLength(1);
	});
});

describe('authoring preview HTTP lifecycle', () => {
	it('releases the exact preview token returned over HTTP without exhausting sessions', async () => {
		const root = await directory();
		const workspace = join(root, 'workspace');
		await createWorkspace(workspace, {
			title: 'Preview lifecycle',
			author: 'Test creator',
			games: [game],
		});
		await mkdir(join(workspace, 'media'));
		await writeFile(join(workspace, 'media/clip.mp4'), 'preview-media');
		const app = await server(join(root, 'library'));
		for (let i = 0; i < 6; i++) {
			const response = await admin(app, 'authoring/preview', {directory: workspace});
			expect(response.status).toBe(200);
			const session = await response.json();
			expect(session.token).toMatch(/^[a-f0-9]{64}$/);
			const clip = await fetch(app.url + session.baseUrl + 'media/clip.mp4');
			expect(clip.status).toBe(200);
			expect(await clip.text()).toBe('preview-media');
			expect((await admin(app, 'authoring/release', {token: session.token})).status).toBe(200);
			expect((await fetch(app.url + session.baseUrl + 'media/clip.mp4')).status).toBe(404);
		}
		expect((await admin(app, 'authoring/release', {token: '../invalid'})).status).toBe(400);
	});
});

describe('maintenance lifetime failure boundaries', () => {
	it('surfaces expired preview cleanup failures and retries without crashing or retaining the stage', async () => {
		const root = await directory();
		const catalog = await openCatalog(root);
		const timer = globalThis.setTimeout;
		let expire: (() => void) | undefined;
		vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler, delay, ...args) => {
			if (delay === 10 * 60 * 1000) expire = () => handler(...args);
			return timer(handler, delay, ...args);
		});
		await catalog.previewArchive(await archive(root));
		expect(expire).toBeDefined();
		disk.failStageCleanup = true;
		expire!();
		await vi.waitFor(async () => {
			expect((await catalog.inventory()).cleanupWarning).toMatch(/preview cleanup EPERM/);
		});
		expect(catalog.snapshot.references).toHaveLength(0);
		disk.failStageCleanup = false;
		await catalog.cleanup();
		expect((await catalog.inventory()).cleanupWarning).toBeUndefined();
		expect(await readdir(join(root, 'packs/.generations'))).toEqual([]);
	});
	it('keeps learner writes blocked when a concurrent restore is rejected', async () => {
		const app = await server(await directory());
		const saved = await (await admin(app, 'backup')).json();
		let release!: () => void;
		let entered!: () => void;
		const gate = new Promise<void>(resolve => {
			release = resolve;
		});
		const started = new Promise<void>(resolve => {
			entered = resolve;
		});
		const original = PracticeStore.prototype.restoreNotes;
		vi.spyOn(PracticeStore.prototype, 'restoreNotes').mockImplementation(
			async function (file, revision) {
				entered();
				await gate;
				return original.call(this, file, revision);
			},
		);
		const body = {file: saved.file, expectedMaintenanceRevision: 0};
		const active = admin(app, 'backup/restore', body);
		try {
			await started;
			expect((await admin(app, 'backup/restore', body)).status).toBe(503);
			const blocked = await fetch(`${app.url}/api/practice/orphan-reference`, {
				method: 'PATCH',
				headers: personalHeaders(app),
				body: JSON.stringify({patch: {note: 'Must remain a draft'}, expectedVersion: 0}),
			});
			expect(blocked.status).toBe(503);
		} finally {
			release();
			expect((await active).status).toBe(200);
		}
	});
	it.each(['PATCH', 'import'] as const)(
		'rechecks the maintenance epoch after a paused %s body',
		async action => {
			const app = await server(await directory());
			const saved = await (await admin(app, 'backup')).json();
			const payload = JSON.stringify(
				action === 'PATCH'
					? {patch: {note: 'Stale request'}, expectedVersion: 0}
					: {
							version: 1,
							entries: {
								'orphan-reference': {
									saved: true,
									status: 'untried',
									note: 'Stale import',
									revision: 1,
								},
							},
						},
			);
			let complete!: (value: {status: number; body: string}) => void;
			let failed!: (reason: Error) => void;
			const completed = new Promise<{status: number; body: string}>((resolve, reject) => {
				complete = resolve;
				failed = reject;
			});
			const request = httpRequest(
				`${app.url}/api/practice/${action === 'PATCH' ? 'orphan-reference' : 'import'}`,
				{
					method: action === 'PATCH' ? 'PATCH' : 'POST',
					headers: {
						...personalHeaders(app),
						Expect: '100-continue',
						'Content-Length': Buffer.byteLength(payload),
					},
				},
				response => {
					let body = '';
					response.setEncoding('utf8');
					response.on('data', chunk => {
						body += chunk;
					});
					response.on('end', () => complete({status: response.statusCode ?? 0, body}));
				},
			);
			request.on('error', failed);
			try {
				request.flushHeaders();
				await once(request, 'continue');
				expect(
					(await admin(app, 'backup/restore', {file: saved.file, expectedMaintenanceRevision: 0}))
						.status,
				).toBe(200);
				request.end(payload);
				const result = await completed;
				expect(result.status).toBe(409);
				expect(JSON.parse(result.body).error.code).toBe('maintenance_changed');
				expect((await (await fetch(`${app.url}/api/practice`)).json()).entries).toEqual({});
			} finally {
				request.destroy();
			}
		},
	);
});
