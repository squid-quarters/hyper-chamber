import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile} from 'node:fs/promises';
import {request as httpRequest} from 'node:http';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {zipSync, strToU8} from 'fflate';
import {afterEach, describe, expect, it} from 'vitest';
import {
	gameDefinitionSchema,
	referenceSchema,
	type PersonalEntry,
	type Reference,
} from '@hyper-chamber/reference';
import {
	LibraryCatalog,
	PracticeStore,
	databaseMigrations,
	migrateDatabase,
	startLibraryServer,
	type LibraryServer,
} from './index';
import {assertCatalogJsonBudget, type PackManifest} from './catalog';

const contentRoot = fileURLToPath(new URL('../../../content/', import.meta.url));
const game = gameDefinitionSchema.parse(
	JSON.parse(await readFile(join(contentRoot, 'games/sf6/game.json'), 'utf8')),
);
const original = referenceSchema.parse(
	JSON.parse(await readFile(join(contentRoot, 'games/sf6/references/dhalsim.json'), 'utf8'))[0],
);
const reference: Reference = {...original, relatedIds: [], revision: 3};
const clipPath = reference.media.clip.slice(1);
const personal: PersonalEntry = {
	saved: true,
	status: 'practising',
	note: 'Check the timing',
	revision: 2,
};
const resources: Array<() => Promise<unknown> | void> = [];
afterEach(async () => {
	for (const cleanup of resources.splice(0).reverse()) await cleanup();
});
async function directory(): Promise<string> {
	const path = await mkdtemp(join(tmpdir(), 'hyper-chamber-server-'));
	resources.push(() => rm(path, {recursive: true, force: true}));
	return path;
}
async function pack(
	root: string,
	options: {id?: string; version?: string; references?: Reference[]; clip?: string} = {},
) {
	const payload: Record<string, Uint8Array> = {
		'game.json': strToU8(JSON.stringify(game)),
		'references.json': strToU8(JSON.stringify(options.references ?? [reference])),
	};
	if (options.clip !== undefined) payload[clipPath] = strToU8(options.clip);
	const manifest = {
		formatVersion: 1,
		id: options.id ?? 'starter',
		version: options.version ?? '1',
		games: ['game.json'],
		catalogs: ['references.json'],
		files: Object.entries(payload).map(([path, data]) => ({
			path,
			sha256: createHash('sha256').update(data).digest('hex'),
			bytes: data.length,
		})),
	};
	const archive = {...payload, 'manifest.json': strToU8(JSON.stringify(manifest))};
	await mkdir(root, {recursive: true});
	for (const [path, data] of Object.entries(archive)) {
		await mkdir(join(root, path, '..'), {recursive: true});
		await writeFile(join(root, path), data);
	}
	return {archive, manifest};
}
async function fixture(
	options: {media?: string; token?: string} = {},
): Promise<{app: LibraryServer; root: string; seed: string; library: string}> {
	const root = await directory();
	const seed = join(root, 'seed');
	await pack(seed, {clip: options.media});
	const library = join(root, 'library');
	const web = join(root, 'web');
	await mkdir(web);
	await writeFile(join(web, 'index.html'), '<!doctype html><title>Hyper Chamber</title>');
	const fallbackMedia = join(root, 'fallback-media');
	await mkdir(fallbackMedia);
	const app = await startLibraryServer({
		libraryDir: library,
		mediaDir: fallbackMedia,
		seedDir: seed,
		webDir: web,
		port: 0,
		adminToken: options.token ?? 'test-host-secret',
		onError: error => {
			throw error;
		},
	});
	resources.push(() => app.close());
	return {app, root, seed, library};
}
function headers(app: LibraryServer) {
	return {'Content-Type': 'application/json', 'X-Hyper-Chamber-Library': app.libraryId};
}
async function patch(app: LibraryServer, body: unknown, id = reference.id) {
	return fetch(`${app.url}/api/practice/${id}`, {
		method: 'PATCH',
		headers: headers(app),
		body: JSON.stringify(body),
	});
}
async function admin(
	app: LibraryServer,
	endpoint: string,
	body: unknown,
	token = 'test-host-secret',
) {
	return fetch(`${app.url}/api/admin/${endpoint}`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Host': token},
		body: JSON.stringify(body),
	});
}
function raw(
	url: string,
	path: string,
	headers: Record<string, string> = {},
): Promise<{status: number; body: string}> {
	return new Promise((resolve, reject) => {
		const request = httpRequest(url, {path, headers}, response => {
			let body = '';
			response.setEncoding('utf8');
			response.on('data', chunk => {
				body += chunk;
			});
			response.on('end', () => resolve({status: response.statusCode ?? 0, body}));
		});
		request.on('error', reject);
		request.end();
	});
}

describe('authoritative personal library', () => {
	it('persists field patches, separates row versions from assessed revisions, and keeps unknown IDs', async () => {
		const {app, library} = await fixture();
		const first = await patch(app, {patch: {saved: true}, expectedVersion: 0});
		expect(first.status).toBe(200);
		expect((await first.json()).entry).toMatchObject({
			saved: true,
			revision: 3,
			rowVersion: 1,
			note: '',
		});
		const second = await patch(app, {patch: {status: 'reliable', revision: 2}, expectedVersion: 1});
		expect(second.status).toBe(200);
		expect((await second.json()).entry).toMatchObject({
			saved: true,
			status: 'reliable',
			revision: 2,
			rowVersion: 2,
		});
		const stale = await patch(app, {patch: {note: 'Stale tab'}, expectedVersion: 1});
		expect(stale.status).toBe(409);
		expect(await stale.json()).toMatchObject({
			error: {code: 'conflict'},
			entry: {rowVersion: 2, note: '', revision: 2},
		});
		expect(
			(
				await patch(
					app,
					{patch: {note: 'Future or removed reference'}, expectedVersion: 0},
					'unknown-reference',
				)
			).status,
		).toBe(200);
		await app.close();
		const reopened = await startLibraryServer({libraryDir: library, port: 0});
		resources.push(() => reopened.close());
		expect(reopened.libraryId).toBe(app.libraryId);
		const snapshot = await (await fetch(`${reopened.url}/api/practice`)).json();
		expect(snapshot.entries[reference.id]).toMatchObject({
			saved: true,
			status: 'reliable',
			revision: 2,
			rowVersion: 2,
			note: '',
		});
		expect(snapshot.entries['unknown-reference'].note).toBe('Future or removed reference');
		expect((await (await fetch(`${reopened.url}/api/catalog`)).json()).libraryId).toBe(
			app.libraryId,
		);
	});

	it('merges legacy imports once without overwriting differing authoritative values or partially importing invalid data', async () => {
		const {app} = await fixture();
		const imported = {
			version: 1,
			entries: {[reference.id]: personal, 'orphan-id': {...personal, note: 'Preserve me'}},
		};
		const send = (value: unknown) =>
			fetch(`${app.url}/api/practice/import`, {
				method: 'POST',
				headers: headers(app),
				body: JSON.stringify(value),
			});
		expect(await (await send(imported)).json()).toEqual({imported: 2, unchanged: 0, conflicts: []});
		expect(await (await send(imported)).json()).toEqual({imported: 0, unchanged: 2, conflicts: []});
		await patch(app, {patch: {note: 'New server note'}, expectedVersion: 1});
		expect(await (await send(imported)).json()).toEqual({
			imported: 0,
			unchanged: 1,
			conflicts: [reference.id],
		});
		expect(
			(
				await send({
					version: 1,
					entries: {'another-id': personal, 'invalid-id': {...personal, status: 'invalid'}},
				})
			).status,
		).toBe(400);
		const snapshot = await (await fetch(`${app.url}/api/practice`)).json();
		expect(snapshot.entries['another-id']).toBeUndefined();
		expect(snapshot.entries[reference.id].note).toBe('New server note');
		expect(
			(
				await send(
					JSON.parse(
						'{"version":1,"entries":{"__proto__":{"saved":true,"status":"untried","note":"","revision":1}}}',
					),
				)
			).status,
		).toBe(400);
	});

	it('rejects stale library identities and cross-origin writes before modifying data', async () => {
		const a = await fixture();
		const b = await fixture();
		const body = JSON.stringify({patch: {note: 'Belongs to A'}, expectedVersion: 0});
		const stale = await fetch(`${b.app.url}/api/practice/${reference.id}`, {
			method: 'PATCH',
			headers: headers(a.app),
			body,
		});
		expect(stale.status).toBe(409);
		expect(await stale.json()).toMatchObject({error: {code: 'library_changed'}});
		const foreign = await fetch(`${b.app.url}/api/practice/${reference.id}`, {
			method: 'PATCH',
			headers: {...headers(b.app), Origin: 'https://another-site.example'},
			body,
		});
		expect(foreign.status).toBe(403);
		const missingIdentity = await fetch(`${b.app.url}/api/practice/import`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({version: 1, entries: {'other-id': personal}}),
		});
		expect(missingIdentity.status).toBe(409);
		expect((await (await fetch(`${b.app.url}/api/practice`)).json()).entries).toEqual({});
		expect(
			(await raw(b.app.url, '/api/health', {Host: `hostile.example:${b.app.port}`})).status,
		).toBe(403);
	});

	it('enforces strict field/body validation without disturbing existing values', async () => {
		const {app} = await fixture();
		await patch(app, {patch: {note: 'Original'}, expectedVersion: 0});
		expect((await patch(app, {patch: {note: 'x'.repeat(4001)}, expectedVersion: 1})).status).toBe(
			400,
		);
		expect(
			(await patch(app, {patch: {saved: true, surprise: true}, expectedVersion: 1})).status,
		).toBe(400);
		expect((await patch(app, {patch: {}, expectedVersion: 1})).status).toBe(400);
		expect((await patch(app, {patch: {note: 'x'.repeat(40000)}, expectedVersion: 1})).status).toBe(
			413,
		);
		const snapshot = await (await fetch(`${app.url}/api/practice`)).json();
		expect(snapshot.entries[reference.id]).toMatchObject({note: 'Original', rowVersion: 1});
	});
});

describe('external media and local network boundary', () => {
	it('serves bounded media ranges, HEAD, cache validation and SPA routes without exposing arbitrary files', async () => {
		const {app, root, library} = await fixture({media: '0123456789'});
		const url = `${app.url}/${clipPath}`;
		await writeFile(
			join(root, 'fallback-media/unsafe.html'),
			'<script>fetch("/api/practice")</script>',
		);
		await writeFile(
			join(root, 'fallback-media/unsafe.svg'),
			'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
		);
		expect((await fetch(`${app.url}/media/unsafe.html`)).status).toBe(404);
		expect((await fetch(`${app.url}/media/unsafe.svg`)).status).toBe(404);
		const range = await fetch(url, {headers: {Range: 'bytes=2-5'}});
		expect(range.status).toBe(206);
		expect(range.headers.get('content-range')).toBe('bytes 2-5/10');
		expect(await range.text()).toBe('2345');
		const suffix = await fetch(url, {headers: {Range: 'bytes=-3'}});
		expect(await suffix.text()).toBe('789');
		const head = await fetch(url, {method: 'HEAD'});
		expect(head.status).toBe(200);
		expect(head.headers.get('content-length')).toBe('10');
		expect(await head.text()).toBe('');
		const invalid = await fetch(url, {headers: {Range: 'bytes=10-12'}});
		expect(invalid.status).toBe(416);
		expect(invalid.headers.get('content-range')).toBe('bytes */10');
		expect((await fetch(url, {headers: {'If-None-Match': head.headers.get('etag')!}})).status).toBe(
			304,
		);
		expect(
			(await fetch(url, {headers: {Range: 'bytes=0-1', 'If-Range': 'older-version'}})).status,
		).toBe(200);
		expect((await fetch(`${app.url}/training/route`)).status).toBe(200);
		expect((await raw(app.url, '/media/%2e%2e/hyper-chamber.sqlite')).status).toBe(400);
		await writeFile(join(root, 'secret.mp4'), 'secret');
		const symlinkPath = join(library, 'packs/starter', clipPath);
		await rm(symlinkPath);
		await symlink(join(root, 'secret.mp4'), symlinkPath);
		expect((await fetch(url)).status).toBe(404);
	});

	it('requires native host authentication and keeps the primary server stable across sharing changes', async () => {
		const {app} = await fixture();
		const primary = app.url;
		expect((await admin(app, 'sharing', {enabled: true}, 'wrong-token')).status).toBe(403);
		const enable = await admin(app, 'sharing', {enabled: true});
		expect(enable.status).toBe(200);
		const sharing = await enable.json();
		expect(sharing.enabled).toBe(true);
		expect(app.url).toBe(primary);
		expect((await fetch(`${primary}/api/health`)).status).toBe(200);
		// LAN service uses another listener and cannot execute host actions, even from localhost.
		if (sharing.addresses.length) {
			const lan = new URL(sharing.addresses[0]);
			lan.hostname = '127.0.0.1';
			const forbidden = await fetch(`${lan.origin}/api/admin/sharing`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Host': 'test-host-secret'},
				body: JSON.stringify({enabled: false}),
			});
			expect(forbidden.status).toBe(403);
		}
		expect((await (await admin(app, 'sharing', {enabled: false})).json()).enabled).toBe(false);
		expect(app.url).toBe(primary);
		expect((await (await fetch(`${primary}/api/runtime`)).json()).sharing).toEqual({
			enabled: false,
			addresses: [],
		});
		const backup = await admin(app, 'backup', {});
		expect(backup.status).toBe(200);
		expect((await backup.json()).file).toMatch(/^library-.*\.sqlite$/);
	});
	it('closes an in-flight sharing listener rather than leaving an orphan port', async () => {
		const {app} = await fixture();
		const enabling = app.setSharing(true);
		const closing = app.close();
		await expect(enabling).rejects.toMatchObject({code: 'closing'});
		await closing;
		expect(app.runtime().sharing.enabled).toBe(false);
	});
});

describe('portable content packs', () => {
	it('bounds aggregate catalog and profile JSON before parsing across installed packs', () => {
		const manifest = (id: string, catalogs: number[], games: number[]): PackManifest => ({
			formatVersion: 1,
			id,
			version: '1',
			games: games.map((_, index) => `games/${index}.json`),
			catalogs: catalogs.map((_, index) => `catalogs/${index}.json`),
			files: [
				...games.map((bytes, index) => ({
					path: `games/${index}.json`,
					bytes,
					sha256: 'a'.repeat(64),
				})),
				...catalogs.map((bytes, index) => ({
					path: `catalogs/${index}.json`,
					bytes,
					sha256: 'a'.repeat(64),
				})),
			],
		});
		const megabyte = 1024 ** 2;
		const first = manifest('first', [32 * megabyte, 32 * megabyte], [8 * megabyte]);
		const second = manifest('second', [32 * megabyte, 32 * megabyte], [8 * megabyte]);
		expect(() => assertCatalogJsonBudget([first, second])).not.toThrow();
		expect(() => assertCatalogJsonBudget([first, second, manifest('extra', [1], [])])).toThrow(
			'128 MiB',
		);
		expect(() => assertCatalogJsonBudget([first, second, manifest('extra', [], [1])])).toThrow(
			'16 MiB',
		);
	});

	it('seeds once, overlays character media at the same stable ID, and imports identical versions idempotently', async () => {
		const {app, root, library, seed} = await fixture();
		expect((await fetch(`${app.url}/${clipPath}`)).status).toBe(404);
		await patch(app, {patch: {note: 'User data stays'}, expectedVersion: 0});
		const incoming = await pack(join(root, 'incoming'), {id: 'dhalsim-media', clip: 'new-media'});
		const archive = join(root, 'dhalsim.hcpack');
		await writeFile(archive, zipSync(incoming.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(200);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('new-media');
		expect((await (await fetch(`${app.url}/api/catalog`)).json()).references).toHaveLength(1);
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(200);
		expect(
			(await readdir(join(library, 'packs'))).filter(path => path.startsWith('.previous')),
		).toHaveLength(0);
		await app.close();
		await writeFile(join(seed, 'references.json'), 'a broken app upgrade seed');
		const reopened = await startLibraryServer({libraryDir: library, seedDir: seed, port: 0});
		resources.push(() => reopened.close());
		expect(
			(await (await fetch(`${reopened.url}/api/practice`)).json()).entries[reference.id].note,
		).toBe('User data stays');
		expect((await (await fetch(`${reopened.url}/api/catalog`)).json()).references).toHaveLength(1);
	});

	it('rejects damaged, duplicate and path-traversing archives atomically', async () => {
		const {app, root, library} = await fixture({media: 'original'});
		const incoming = await pack(join(root, 'incoming'), {id: 'update', clip: 'bad'});
		incoming.archive[clipPath] = strToU8('corrupted');
		const archive = join(root, 'bad.hcpack');
		await writeFile(archive, zipSync(incoming.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(400);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('original');
		await writeFile(archive, zipSync({...incoming.archive, '../outside': strToU8('escape')}));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(400);
		const duplicate = await pack(join(root, 'duplicate'), {
			id: 'duplicate',
			references: [reference, reference],
		});
		await writeFile(archive, zipSync(duplicate.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(400);
		expect((await readdir(join(library, 'packs'))).sort()).toEqual(['starter']);
	});

	it('keeps newer execution footage when an older revision is imported later', async () => {
		const {app, root} = await fixture({media: 'revision-3-footage'});
		const old = await pack(join(root, 'older'), {
			id: 'older-character',
			references: [{...reference, revision: 2}],
			clip: 'outdated-footage',
		});
		const archive = join(root, 'older.hcpack');
		await writeFile(archive, zipSync(old.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(200);
		expect((await (await fetch(`${app.url}/api/catalog`)).json()).references[0].revision).toBe(3);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('revision-3-footage');
	});

	it('rejects same-pack execution downgrades without replacing metadata or footage', async () => {
		const {app, root, library} = await fixture({media: 'revision-3-footage'});
		const older = await pack(join(root, 'older-same-pack'), {
			id: 'starter',
			version: '2',
			references: [{...reference, revision: 2}],
			clip: 'outdated-footage',
		});
		const archive = join(root, 'older-same-pack.hcpack');
		await writeFile(archive, zipSync(older.archive));
		const response = await admin(app, 'content/import', {path: archive});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: {code: 'invalid_pack', message: expect.stringContaining('execution revision')},
		});
		expect((await (await fetch(`${app.url}/api/catalog`)).json()).references[0].revision).toBe(3);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('revision-3-footage');
		expect(await readdir(join(library, 'packs'))).toEqual(['starter']);
	});

	it('rejects a pack replacement that exposes a lower fallback revision by omitting the current winner', async () => {
		const {app, root, library} = await fixture({media: 'winning-revision-3'});
		const fallback = await pack(join(root, 'fallback'), {
			id: 'fallback',
			references: [{...reference, revision: 2}],
			clip: 'fallback-revision-2',
		});
		const archive = join(root, 'replacement.hcpack');
		await writeFile(archive, zipSync(fallback.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(200);
		const another = {
			...reference,
			id: 'another-reference',
			title: 'Replacement content',
			media: {
				...reference.media,
				clip: '/media/other/clip.mp4',
				poster: '/media/other/poster.jpg',
				descriptionTrack: undefined,
				frames: reference.media.frames.map((frame, index) => ({
					...frame,
					src: `/media/other/frame-${index}.jpg`,
				})),
			},
		};
		const replacement = await pack(join(root, 'omitting-winner'), {
			id: 'starter',
			version: '2',
			references: [another],
		});
		await writeFile(archive, zipSync(replacement.archive));
		const response = await admin(app, 'content/import', {path: archive});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: {code: 'invalid_pack', message: expect.stringContaining('execution revision')},
		});
		expect((await (await fetch(`${app.url}/api/catalog`)).json()).references).toMatchObject([
			{id: reference.id, revision: 3},
		]);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('winning-revision-3');
		expect((await readdir(join(library, 'packs'))).sort()).toEqual(['fallback', 'starter']);
	});

	it('rejects conflicting media bytes shared by different winning reference IDs', async () => {
		const {app, root, library} = await fixture({media: 'original-footage'});
		const other = {
			...reference,
			id: 'another-reference',
			title: 'A different execution',
			revision: 1,
		};
		const incoming = await pack(join(root, 'collision'), {
			id: 'collision',
			references: [other],
			clip: 'different-footage',
		});
		const archive = join(root, 'collision.hcpack');
		await writeFile(archive, zipSync(incoming.archive));
		const response = await admin(app, 'content/import', {path: archive});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			error: {code: 'invalid_pack', message: expect.stringContaining('different media')},
		});
		expect((await (await fetch(`${app.url}/api/catalog`)).json()).references).toHaveLength(1);
		expect(await (await fetch(`${app.url}/${clipPath}`)).text()).toBe('original-footage');
		expect(await readdir(join(library, 'packs'))).toEqual(['starter']);
	});

	it('permits identical shared media while rejecting active documents in data packs', async () => {
		const {app, root} = await fixture({media: 'shared-passive-video'});
		const other = {...reference, id: 'another-reference', title: 'Shared original excerpt'};
		const shared = await pack(join(root, 'shared'), {
			id: 'shared',
			references: [other],
			clip: 'shared-passive-video',
		});
		const archive = join(root, 'shared.hcpack');
		await writeFile(archive, zipSync(shared.archive));
		expect((await admin(app, 'content/import', {path: archive})).status).toBe(200);
		const active = {
			...reference,
			id: 'active-document',
			media: {...reference.media, poster: '/media/active.svg'},
		};
		const unsafe = await pack(join(root, 'active'), {id: 'active', references: [active]});
		await writeFile(archive, zipSync(unsafe.archive));
		const response = await admin(app, 'content/import', {path: archive});
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({error: {code: 'invalid_pack'}});
		const clip = await fetch(`${app.url}/${clipPath}`);
		expect(clip.headers.get('content-security-policy')).toContain('sandbox');
	});

	it('recovers the prior pack when replacement was interrupted between directory renames', async () => {
		const {app, library} = await fixture({media: 'original'});
		await app.close();
		await rename(
			join(library, 'packs/starter'),
			join(library, 'packs/.previous-starter-interrupted'),
		);
		const recovered = await LibraryCatalog.open({libraryDir: library});
		expect(recovered.snapshot.references[0].id).toBe(reference.id);
		expect(await readdir(join(library, 'packs'))).toEqual(['starter']);
	});
});

describe('safe database upgrades', () => {
	it('backs up the old schema and rolls failed upgrades back without losing notes', async () => {
		const root = await directory();
		const store = await PracticeStore.open(root);
		store.patch('orphan-id', {patch: {note: 'Keep this note'}, expectedVersion: 0});
		store.close();
		const db = new DatabaseSync(join(root, 'hyper-chamber.sqlite'));
		try {
			await expect(
				migrateDatabase(db, root, [
					...databaseMigrations,
					{
						version: 2,
						name: 'Broken test migration',
						sql: 'CREATE TABLE should_rollback(id TEXT); INVALID SQL',
					},
				]),
			).rejects.toThrow();
			expect(db.prepare('PRAGMA user_version').get()?.user_version).toBe(1);
			expect(
				db.prepare("SELECT name FROM sqlite_schema WHERE name = 'should_rollback'").get(),
			).toBeUndefined();
			expect(
				db.prepare("SELECT note FROM practice_entries WHERE reference_id='orphan-id'").get()?.note,
			).toBe('Keep this note');
		} finally {
			db.close();
		}
		const backups = await readdir(join(root, 'snapshots'));
		expect(backups).toHaveLength(1);
		const snapshot = new DatabaseSync(join(root, 'snapshots', backups[0]), {readOnly: true});
		try {
			expect(snapshot.prepare('SELECT note FROM practice_entries').get()?.note).toBe(
				'Keep this note',
			);
		} finally {
			snapshot.close();
		}
	});

	it('refuses a newer or foreign database without replacing it', async () => {
		const root = await directory();
		const store = await PracticeStore.open(root);
		store.close();
		const path = join(root, 'hyper-chamber.sqlite');
		const db = new DatabaseSync(path);
		db.exec('PRAGMA user_version=99');
		db.close();
		await expect(PracticeStore.open(root)).rejects.toThrow('newer Hyper Chamber');
		const check = new DatabaseSync(path);
		try {
			expect(check.prepare('PRAGMA user_version').get()?.user_version).toBe(99);
		} finally {
			check.close();
		}
		const foreignDir = await directory();
		const foreign = new DatabaseSync(join(foreignDir, 'hyper-chamber.sqlite'));
		foreign.exec("CREATE TABLE unrelated(value TEXT); INSERT INTO unrelated VALUES ('keep')");
		foreign.close();
		await expect(PracticeStore.open(foreignDir)).rejects.toThrow('not a Hyper Chamber');
	});
});
