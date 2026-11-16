import {mkdtemp, readFile, writeFile, mkdir, rm, symlink, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {unzipSync, zipSync} from 'fflate';
import {afterEach, describe, expect, it} from 'vitest';
import {
	gameDefinitionSchema,
	referenceSchema,
	packManifestSchema,
	comparePackVersions,
} from '@hyper-chamber/reference';
import {
	createWorkspace,
	readWorkspace,
	saveWorkspace,
	createReference,
	newReferenceId,
	addMedia,
	writeAsset,
	validateWorkspace,
	exportWorkspace,
	forkPack,
	unpackPackArchive,
} from './index.ts';

const roots: string[] = [];
afterEach(async () => {
	for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true});
});
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'hc-authoring-test-'));
	roots.push(root);
	return {root, directory: join(root, 'workspace')};
}
const game = gameDefinitionSchema.parse({
	id: 'test-arena',
	name: 'Test Arena',
	resourceLabels: {},
	notation: {description: 'Synthetic authoring sample.', numpad: true, legend: []},
	guides: [],
	characters: [{id: 'test-fighter', name: 'Test Fighter'}],
});
const image = Buffer.from('synthetic-raster-fixture').toString('base64');
async function complete() {
	const {root, directory} = await fixture();
	const workspace = await createWorkspace(directory, {
		title: 'My references',
		author: 'Test author',
		games: [game],
	});
	const id = newReferenceId(workspace);
	const clip = join(root, 'short.mp4');
	await writeFile(clip, 'synthetic-video-fixture');
	const media = await addMedia(directory, clip, id);
	const poster = await writeAsset(directory, `media/${workspace.id}/${id}/poster.jpg`, image);
	const reference = createReference(workspace, {
		id,
		gameId: game.id,
		characterId: 'test-fighter',
		title: 'Test route',
		summary: 'Synthetic sequence for authoring tests.',
		steps: [{notation: 'LP', label: 'Light punch'}],
		duration: 2,
		media: {
			clip: media.path,
			poster: poster.path,
			frames: [
				{id: 'start', src: poster.path, at: 0, label: 'Start', alt: 'Synthetic opening frame'},
			],
		},
	});
	workspace.references.push(reference);
	const saved = await saveWorkspace(directory, workspace);
	return {root, directory, workspace: saved, reference};
}

describe('portable authoring workspaces', () => {
	it('rejects stale saves instead of overwriting edits made by another creator', async () => {
		const {directory} = await complete();
		const first = await readWorkspace(directory),
			stale = await readWorkspace(directory);
		first.title = 'Newer edit';
		await saveWorkspace(directory, first);
		stale.title = 'Stale edit';
		await expect(saveWorkspace(directory, stale)).rejects.toThrow(/changed.*reload/i);
		expect((await readWorkspace(directory)).title).toBe('Newer edit');
	});
	it('refuses a second process lease and recovers immediately when the lease is released', async () => {
		const {directory, workspace} = await complete();
		const lock = new DatabaseSync(join(directory, '.hc-authoring-lock.sqlite'));
		lock.exec('BEGIN EXCLUSIVE');
		try {
			await expect(saveWorkspace(directory, workspace)).rejects.toThrow(/another.*workspace/i);
		} finally {
			lock.exec('ROLLBACK');
			lock.close();
		}
		await expect(saveWorkspace(directory, await readWorkspace(directory))).resolves.toMatchObject({
			title: workspace.title,
		});
	});
	it('keeps a saved replay unchanged when a replacement recording is added then discarded', async () => {
		const {root, directory, reference} = await complete();
		const oldPath = reference.media.clip!;
		const oldBytes = await readFile(join(directory, oldPath.slice(1)));
		const replacement = join(root, 'replacement.mp4');
		await writeFile(replacement, 'replacement video bytes');
		const added = await addMedia(directory, replacement, reference.id);
		expect(added.path).not.toBe(oldPath);
		expect(await readFile(join(directory, oldPath.slice(1)))).toEqual(oldBytes);
		expect((await readWorkspace(directory)).references[0].media.clip).toBe(oldPath);
	});

	it('creates an empty draft with stable identities without requiring repository content', async () => {
		const {directory} = await fixture();
		const created = await createWorkspace(directory, {
			title: 'Pack',
			author: 'Creator',
			games: [game],
		});
		expect(await readWorkspace(directory)).toEqual(created);
		expect(created.id).toMatch(/^community-/);
		expect(created.version).toBe('1.0.0');
		expect((await validateWorkspace(directory)).valid).toBe(false);
		await expect(
			createWorkspace(directory, {title: 'Other', author: 'Creator', games: [game]}),
		).rejects.toThrow(/empty folder/);
	});
	it('exports a complete pack and imports its exact assets with own-recording provenance', async () => {
		const {root, directory, workspace} = await complete();
		expect((await validateWorkspace(directory)).valid).toBe(true);
		const exported = await exportWorkspace(directory, join(root, 'pack.hcpack'));
		expect(exported.manifest).toMatchObject({
			formatVersion: 2,
			id: workspace.id,
			title: 'My references',
			author: 'Test author',
			version: '1.0.0',
		});
		const extracted = join(root, 'extracted');
		await mkdir(extracted);
		await unpackPackArchive(exported.path, extracted);
		const manifest = packManifestSchema.parse(
			JSON.parse(await readFile(join(extracted, 'manifest.json'), 'utf8')),
		);
		expect(manifest.formatVersion).toBe(2);
		const references = JSON.parse(await readFile(join(extracted, manifest.catalogs[0]), 'utf8'));
		expect(referenceSchema.parse(references[0]).source).toMatchObject({
			kind: 'recording',
			creator: 'Test author',
		});
		expect(references[0].source.url).toBeUndefined();
		expect(exported.warnings[0]).toContain('Draft');
	});
	it('preserves identity, increments material execution revisions and leaves copy edits at their revision', async () => {
		const {directory, workspace, reference} = await complete();
		workspace.references[0].title = 'Clearer title';
		Object.assign(workspace, await saveWorkspace(directory, workspace));
		expect(workspace.references[0].revision).toBe(1);
		workspace.references[0].inputs[0].notation = 'MP';
		const updated = await saveWorkspace(directory, workspace);
		expect(updated.references[0].id).toBe(reference.id);
		expect(updated.references[0].revision).toBe(2);
		expect(updated.references[0].verification.status).toBe('draft');
		updated.references[0].revision = 1;
		await expect(saveWorkspace(directory, updated)).rejects.toThrow(/lowered/);
		await expect(saveWorkspace(directory, {...workspace, id: 'someone-else'})).rejects.toThrow(
			/identity/,
		);
	});
	it('requires a new edition for changed exported content and preserves the last export ledger', async () => {
		const {root, directory} = await complete();
		await exportWorkspace(directory, join(root, 'first.hcpack'));
		const changed = await readWorkspace(directory);
		delete changed.lastExport;
		changed.title = 'A better title';
		await saveWorkspace(directory, changed);
		await expect(exportWorkspace(directory, join(root, 'same-edition.hcpack'))).rejects.toThrow(
			/Increase the pack version/,
		);
		const next = await readWorkspace(directory);
		next.version = '1.0.1';
		await saveWorkspace(directory, next);
		await expect(exportWorkspace(directory, join(root, 'next.hcpack'))).resolves.toMatchObject({
			manifest: {version: '1.0.1'},
		});
	});
	it('forks content into independent identities and media URLs while retaining original attribution', async () => {
		const {root, directory, reference, workspace} = await complete();
		const exported = await exportWorkspace(directory, join(root, 'original.hcpack'));
		const destination = join(root, 'fork');
		const fork = await forkPack(exported.path, destination, {author: 'Another creator'});
		expect(await readWorkspace(destination)).toEqual(fork);
		expect(fork.id).not.toBe(workspace.id);
		expect(fork.derivedFrom).toEqual({id: workspace.id, version: '1.0.0'});
		expect(fork.references[0].id).not.toBe(reference.id);
		expect(fork.references[0].source).toEqual(reference.source);
		expect(fork.references[0].media.clip).not.toBe(reference.media.clip);
		expect(fork.references[0].verification.status).toBe('draft');
		expect((await validateWorkspace(destination)).valid).toBe(true);
	});
	it('can fork a pack repeatedly without growing media paths past format limits', async () => {
		const initial = await complete();
		let directory = initial.directory;
		for (let index = 0; index < 10; index++) {
			const exported = await exportWorkspace(
				directory,
				join(initial.root, `generation-${index}.hcpack`),
			);
			directory = join(initial.root, `fork-${index}`);
			await forkPack(exported.path, directory, {author: 'Another creator'});
		}
		expect((await validateWorkspace(directory)).valid).toBe(true);
	});
	it('refuses missing assets, path escapes and linked destinations without damaging outside files', async () => {
		const {root, directory, workspace} = await complete();
		await expect(writeAsset(directory, '../outside.jpg', image)).rejects.toThrow();
		const outside = join(root, 'outside.jpg');
		await writeFile(outside, 'keep');
		const linked = `media/${workspace.id}/linked.jpg`;
		if (process.platform !== 'win32') {
			await symlink(outside, join(directory, linked));
			await expect(writeAsset(directory, linked, image)).rejects.toThrow(/linked/);
			expect(await readFile(outside, 'utf8')).toBe('keep');
		}
		await rm(join(directory, workspace.references[0].media.poster.slice(1)));
		expect((await validateWorkspace(directory)).valid).toBe(false);
	});
	it('requires format2 when forking own-recording provenance', async () => {
		const {root, directory} = await complete();
		const output = join(root, 'original.hcpack');
		await exportWorkspace(directory, output);
		const entries = unzipSync(await readFile(output));
		const manifest = JSON.parse(Buffer.from(entries['manifest.json']).toString('utf8'));
		manifest.formatVersion = 1;
		delete manifest.title;
		delete manifest.author;
		entries['manifest.json'] = Buffer.from(JSON.stringify(manifest));
		const legacy = join(root, 'mislabelled.hcpack');
		await writeFile(legacy, zipSync(entries));
		await expect(forkPack(legacy, join(root, 'fork'), {author: 'Curator'})).rejects.toThrow(
			/format-2/i,
		);
	});

	it('refuses overwriting an exported archive and leaves its bytes unchanged', async () => {
		const {root, directory} = await complete();
		const output = join(root, 'pack.hcpack');
		await exportWorkspace(directory, output);
		const before = await readFile(output);
		await expect(exportWorkspace(directory, output)).rejects.toThrow();
		expect(await readFile(output)).toEqual(before);
	});
	it('runs the JSON CLI independently of the current working directory', async () => {
		const {root, directory} = await fixture();
		const cli = new URL('./cli.ts', import.meta.url);
		const result = spawnSync(process.execPath, [cli.pathname, '--json'], {
			cwd: root,
			input: JSON.stringify({
				command: 'create',
				directory,
				title: 'CLI pack',
				author: 'CLI author',
				games: [game],
			}),
			encoding: 'utf8',
		});
		expect(result.status, result.stderr).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({
			ok: true,
			result: {workspace: {title: 'CLI pack', references: []}},
		});
		expect((await stat(join(directory, 'workspace.json'))).isFile()).toBe(true);
	});
});

describe('pack edition ordering', () => {
	it.each([
		['1.0.0', '1.0.1', -1],
		['1.0.0-beta.9', '1.0.0-beta.10', -1],
		['1.0.0-beta-a', '1.0.0-beta-b', -1],
		['1.0.0-1', '1.0.0-alpha', -1],
		['1.0.0', '1.0.0-beta', 1],
		['1.0.0+build.1', '1.0.0+build.2', 0],
		['9007199254740992.0.0', '9007199254740993.0.0', -1],
		['legacy', '1.0.0', null],
	])('compares %s with %s', (a, b, expected) =>
		expect(comparePackVersions(String(a), String(b))).toBe(expected),
	);
});
