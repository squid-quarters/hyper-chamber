import {createHash, randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {
	cp,
	lstat,
	mkdir,
	readFile,
	readdir,
	realpath,
	rm,
	stat,
	statfs,
	writeFile,
} from 'node:fs/promises';
import {basename, dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {unpackPackArchive} from '@hyper-chamber/authoring/archive';
import {PracticeStore, type RegistryPack} from './store';
import {
	gameDefinitionSchema,
	parseCatalog,
	referenceSchema,
	type CatalogSnapshot,
	type GameDefinition,
	type Reference,
	packManifestSchema,
	packPathSchema,
	MAX_PACK_BYTES,
	comparePackVersions,
	type PackManifest,
	type PackInventory,
	type InstalledPackInfo,
	type PackChangePreview,
} from '@hyper-chamber/reference';

export {packManifestSchema} from '@hyper-chamber/reference';
const safePathSchema = packPathSchema;
export type {PackManifest} from '@hyper-chamber/reference';
/** Validate manifest byte totals before allocating or parsing candidate JSON catalogs. */
export function assertCatalogJsonBudget(manifests: readonly PackManifest[]): void {
	let gameBytes = 0;
	let catalogBytes = 0;
	for (const manifest of manifests) {
		const sizes = new Map(manifest.files.map(file => [file.path, file.bytes]));
		for (const path of new Set(manifest.games)) gameBytes += sizes.get(path) ?? 0;
		for (const path of new Set(manifest.catalogs)) catalogBytes += sizes.get(path) ?? 0;
		if (gameBytes > 16 * 1024 ** 2)
			throw new Error('Installed game profile JSON exceeds the 16 MiB limit.');
		if (catalogBytes > 128 * 1024 ** 2)
			throw new Error('Installed reference catalog JSON exceeds the 128 MiB limit.');
	}
}
interface InstalledPack {
	root: string;
	manifest: PackManifest;
	installedAt: number;
	references?: Reference[];
	games?: GameDefinition[];
}
export interface MediaFile {
	root: string;
	path: string;
	sha256?: string;
}

export async function containedFile(root: string, path: string): Promise<string | null> {
	try {
		const target = resolve(root, path);
		const rootReal = await realpath(root);
		const targetReal = await realpath(target);
		const inside = relative(rootReal, targetReal);
		if (!inside || inside.startsWith(`..${sep}`) || inside === '..' || isAbsolute(inside))
			return null;
		if ((await lstat(target)).isSymbolicLink()) return null;
		if (!(await stat(targetReal)).isFile()) return null;
		return targetReal;
	} catch (error) {
		if (
			error instanceof Error &&
			'code' in error &&
			['ENOENT', 'ENOTDIR'].includes(String(error.code))
		)
			return null;
		throw error;
	}
}

async function digestFile(path: string): Promise<string> {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest('hex');
}
async function jsonFile(path: string): Promise<unknown> {
	if ((await stat(path)).size > 32 * 1024 ** 2) throw new Error('Catalog JSON is too large.');
	return JSON.parse(await readFile(path, 'utf8'));
}
async function inspectPack(root: string, hashAll: boolean): Promise<InstalledPack> {
	const manifestPath = await containedFile(root, 'manifest.json');
	if (!manifestPath) throw new Error('The content pack has no manifest.json file.');
	const manifest = packManifestSchema.parse(await jsonFile(manifestPath));
	const catalogFiles = new Set([...manifest.games, ...manifest.catalogs]);
	for (const file of manifest.files) {
		const path = await containedFile(root, file.path);
		if (!path || (await stat(path)).size !== file.bytes)
			throw new Error(`Missing or incomplete pack file: ${file.path}`);
		if ((hashAll || catalogFiles.has(file.path)) && (await digestFile(path)) !== file.sha256) {
			throw new Error(`Content pack checksum failed: ${file.path}`);
		}
	}
	let installedAt = 0;
	try {
		const value = JSON.parse(await readFile(join(root, '.installed.json'), 'utf8'));
		if (typeof value.installedAt === 'number' && Number.isFinite(value.installedAt))
			installedAt = value.installedAt;
	} catch (error) {
		if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
	}
	return {root, manifest, installedAt};
}

export function isPassiveMediaPath(path: string): boolean {
	return /\.(?:mp4|webm|png|jpe?g|webp|avif|vtt)$/i.test(path);
}
function mediaPaths(reference: Reference): string[] {
	return [
		reference.media.clip,
		reference.media.poster,
		reference.media.descriptionTrack,
		...reference.media.frames.map(frame => frame.src),
	].filter((path): path is string => !!path);
}
async function readPackGames(pack: InstalledPack): Promise<GameDefinition[]> {
	if (pack.games) return pack.games;
	pack.games = await Promise.all(
		pack.manifest.games.map(async path =>
			gameDefinitionSchema.parse(await jsonFile(join(pack.root, path))),
		),
	);
	return pack.games;
}
async function readPackReferences(pack: InstalledPack): Promise<Reference[]> {
	if (pack.references) return pack.references;
	const references: Reference[] = [];
	const ids = new Set<string>();
	for (const path of pack.manifest.catalogs) {
		const value = await jsonFile(join(pack.root, path));
		if (!Array.isArray(value)) throw new Error('A reference catalog must be a JSON array.');
		for (const rawReference of value) {
			const reference = referenceSchema.parse(rawReference);
			if (pack.manifest.formatVersion === 1 && reference.source.kind === 'recording')
				throw new Error('Own recordings require a format-2 content pack.');
			if (ids.has(reference.id))
				throw new Error('A content pack contains duplicate reference IDs.');
			if (mediaPaths(reference).some(path => !isPassiveMediaPath(path)))
				throw new Error('Reference media must use passive video, raster image or VTT files.');
			ids.add(reference.id);
			references.push(reference);
		}
	}
	pack.references = references;
	return references;
}
async function readPackCatalog(packs: readonly InstalledPack[]): Promise<{
	snapshot: CatalogSnapshot;
	media: Map<string, MediaFile>;
}> {
	assertCatalogJsonBudget(packs.map(pack => pack.manifest));
	const gamesById = new Map<string, GameDefinition>();
	const referencesById = new Map<string, Reference>();
	const media = new Map<string, MediaFile>();
	const packReferences = new Map<InstalledPack, Reference[]>();
	for (const pack of [...packs].sort(
		(a, b) => a.installedAt - b.installedAt || a.manifest.id.localeCompare(b.manifest.id),
	)) {
		for (const game of await readPackGames(pack)) gamesById.set(game.id, game);
		const items = await readPackReferences(pack);
		packReferences.set(pack, items);
		for (const reference of items) {
			const current = referencesById.get(reference.id);
			if (!current || reference.revision >= current.revision)
				referencesById.set(reference.id, reference);
		}
	}
	// Choose each reference's media first, then reject ambiguous shared URLs. Equal
	// revision refreshes for one ID are valid; different executions cannot disagree
	// about the bytes served at one authored path.
	const candidates = new Map<string, Map<string, MediaFile>>();
	for (const [pack, items] of packReferences) {
		const files = new Map(pack.manifest.files.map(file => [`/${file.path}`, file]));
		for (const reference of items) {
			const selected = referencesById.get(reference.id);
			if (selected?.revision !== reference.revision) continue;
			const selectedPaths = new Set(mediaPaths(selected));
			for (const path of mediaPaths(reference)) {
				if (!selectedPaths.has(path)) continue;
				const file = files.get(path);
				if (!file) continue;
				const owners = candidates.get(path) ?? new Map<string, MediaFile>();
				owners.set(reference.id, {root: pack.root, path: file.path, sha256: file.sha256});
				candidates.set(path, owners);
			}
		}
	}
	for (const [path, owners] of candidates) {
		const providers = [...owners.values()];
		if (new Set(providers.map(file => file.sha256)).size > 1)
			throw new Error(`References require different media at the same path: ${path}`);
		media.set(path, providers.at(-1)!);
	}
	const games = [...gamesById.values()].sort((a, b) => a.id.localeCompare(b.id));
	const references = parseCatalog([...referencesById.values()], games);
	return {snapshot: {formatVersion: 1, generation: 0, games, references}, media};
}

async function copyRawSeed(source: string, target: string): Promise<void> {
	const gamesRoot = join(source, 'games');
	const games: string[] = [];
	const catalogs: string[] = [];
	const files: PackManifest['files'] = [];
	for (const directory of await readdir(gamesRoot, {withFileTypes: true})) {
		if (!directory.isDirectory() || !/^[a-z0-9-]+$/.test(directory.name)) continue;
		const game = `games/${directory.name}/game.json`;
		games.push(game);
		const paths = [game];
		for (const file of await readdir(join(gamesRoot, directory.name, 'references'))) {
			if (file.endsWith('.json')) {
				const catalog = `games/${directory.name}/references/${file}`;
				catalogs.push(catalog);
				paths.push(catalog);
			}
		}
		for (const path of paths) {
			safePathSchema.parse(path);
			const from = await containedFile(source, path);
			if (!from) throw new Error('The source catalog is incomplete.');
			await mkdir(dirname(join(target, path)), {recursive: true});
			await cp(from, join(target, path));
			files.push({path, sha256: await digestFile(from), bytes: (await stat(from)).size});
		}
	}
	await writeFile(
		join(target, 'manifest.json'),
		JSON.stringify(
			{formatVersion: 1, id: 'bundled-catalog', version: 'development', games, catalogs, files},
			null,
			2,
		),
	);
}

interface PreparedChange {
	preview: PackChangePreview;
	stage?: string;
	pack?: InstalledPack;
	candidate: InstalledPack[];
	data: Awaited<ReturnType<typeof readPackCatalog>>;
	expiresAt: number;
	repair?: boolean;
}
export class LibraryCatalog {
	private packs: InstalledPack[] = [];
	private problems = new Map<string, string>();
	private quarantinedPaths = new Set<string>();
	private data: Awaited<ReturnType<typeof readPackCatalog>> | undefined;
	private importing = false;
	private operationTask: Promise<unknown> | undefined;
	private closeTask: Promise<void> | undefined;
	private stages = new Set<string>();
	private closed = false;
	private prepared: PreparedChange | undefined;
	private previewTimer: ReturnType<typeof setTimeout> | undefined;
	private history = new Map<number, Map<string, MediaFile>>();
	private leases = new Map<string, number>();
	private cleanupTask: Promise<void> | undefined;
	private cleanupWarning: string | undefined;
	private cleanupPending = true;
	readonly store!: PracticeStore;
	private constructor(
		readonly libraryDir: string,
		private readonly fallbackMediaDir?: string,
	) {}

	static async open(options: {
		libraryDir: string;
		seedDir?: string;
		mediaDir?: string;
	}): Promise<LibraryCatalog> {
		const catalog = new LibraryCatalog(options.libraryDir, options.mediaDir);
		let seedRoot: string | undefined;
		try {
			const store = await PracticeStore.open(options.libraryDir, {
				bootstrap: async () => {
					await catalog.ensurePacksDirectory();
					const found = await catalog.legacyPacks();
					let packs = found.packs;
					if (!packs.length && options.seedDir) {
						seedRoot = await catalog.generationDirectory();
						await catalog.copySeed(options.seedDir, seedRoot);
						packs = [await inspectPack(seedRoot, true)];
					}
					await readPackCatalog(packs);
					return {packs: packs.map(pack => catalog.record(pack)), garbage: found.garbage};
				},
			});
			Object.defineProperty(catalog, 'store', {value: store});
			await catalog.ensurePacksDirectory();
			await catalog.reload();
			if (seedRoot) catalog.stages.delete(seedRoot);
			await catalog.cleanup();
			return catalog;
		} catch (error) {
			if (catalog.store) catalog.store.close();
			else if (seedRoot) await rm(seedRoot, {recursive: true, force: true});
			throw error;
		}
	}
	get snapshot(): CatalogSnapshot {
		if (!this.data) throw new Error('The catalog has not been loaded.');
		return this.data.snapshot;
	}
	get packCount(): number {
		return this.packs.length + this.problems.size;
	}
	get generation(): number {
		return this.store.catalogGeneration;
	}
	revision(id: string): number {
		return this.snapshot.references.find(reference => reference.id === id)?.revision ?? 1;
	}
	media(path: string, generation?: number): MediaFile | undefined {
		if (generation !== undefined && generation !== this.generation)
			return this.history.get(generation)?.get(path);
		const installed = this.data?.media.get(path);
		if (installed) return installed;
		if (this.quarantinedPaths.has(path)) return undefined;
		return this.fallbackMediaDir && path.startsWith('/media/')
			? {root: this.fallbackMediaDir, path: path.slice('/media/'.length)}
			: undefined;
	}
	holdMedia(path: string, generation?: number): {file: MediaFile; release: () => void} | undefined {
		const file = this.media(path, generation);
		if (!file) return;
		this.leases.set(file.root, (this.leases.get(file.root) ?? 0) + 1);
		let released = false;
		return {
			file,
			release: () => {
				if (released) return;
				released = true;
				const next = (this.leases.get(file.root) ?? 1) - 1;
				if (next) this.leases.set(file.root, next);
				else this.leases.delete(file.root);
				if (this.cleanupPending) void this.cleanup();
			},
		};
	}
	private relativeRoot(root: string): string {
		return relative(this.libraryDir, root).split(sep).join('/');
	}
	private async resolveRoot(root: string): Promise<string> {
		if (!/^packs\/(?:[a-z0-9-]+|\.previous-[a-z0-9-]+|\.generations\/[a-f0-9-]+)$/.test(root))
			throw new Error('The installed pack registry has an unsafe directory.');
		const path = join(this.libraryDir, ...root.split('/'));
		const boundary = await realpath(join(this.libraryDir, 'packs'));
		const actual = await realpath(path);
		const inside = relative(boundary, actual);
		if (
			!inside ||
			inside === '..' ||
			inside.startsWith(`..${sep}`) ||
			isAbsolute(inside) ||
			!(await lstat(path)).isDirectory()
		)
			throw new Error('The installed pack directory must stay inside the library.');
		return path;
	}
	private record(pack: InstalledPack, previous?: RegistryPack): RegistryPack {
		return {
			id: pack.manifest.id,
			root: this.relativeRoot(pack.root),
			manifestJson: JSON.stringify(pack.manifest),
			installedAt: pack.installedAt,
			...(previous
				? {
						previousRoot: previous.root,
						previousManifestJson: previous.manifestJson,
						previousInstalledAt: previous.installedAt,
					}
				: {}),
		};
	}

	private async currentPacks(): Promise<InstalledPack[]> {
		const packs: InstalledPack[] = [];
		this.problems.clear();
		this.quarantinedPaths.clear();
		for (const record of this.store.registry()) {
			try {
				const root = await this.resolveRoot(record.root);
				const pack = await inspectPack(root, false);
				if (pack.manifest.id !== record.id || JSON.stringify(pack.manifest) !== record.manifestJson)
					throw new Error('The installed files differ from the registered pack.');
				pack.installedAt = record.installedAt;
				packs.push(pack);
			} catch (error) {
				this.problems.set(
					record.id,
					error instanceof Error ? error.message : 'This pack could not be read.',
				);
				this.quarantine(record);
			}
		}
		return packs;
	}
	private quarantine(record: RegistryPack): void {
		const manifest = packManifestSchema.safeParse(
			(() => {
				try {
					return JSON.parse(record.manifestJson);
				} catch {
					return null;
				}
			})(),
		);
		if (manifest.success)
			for (const file of manifest.data.files)
				if (file.path.startsWith('media/')) this.quarantinedPaths.add(`/${file.path}`);
	}

	private async reload(): Promise<void> {
		const packs = await this.currentPacks();
		try {
			this.data = await readPackCatalog(packs);
			this.packs = packs;
		} catch {
			// A damaged dependency/profile must not make every healthy pack inaccessible.
			this.packs = [];
			this.data = await readPackCatalog([]);
			for (const pack of packs) {
				try {
					const candidate = await readPackCatalog([...this.packs, pack]);
					this.packs.push(pack);
					this.data = candidate;
				} catch (error) {
					this.problems.set(
						pack.manifest.id,
						error instanceof Error ? error.message : 'This pack conflicts with installed content.',
					);
					const record = this.store.registry().find(record => record.id === pack.manifest.id);
					if (record) this.quarantine(record);
				}
			}
		}
		this.data.snapshot.generation = this.generation;
	}

	private async ensurePacksDirectory(): Promise<void> {
		const root = join(this.libraryDir, 'packs');
		await mkdir(root).catch(error => {
			if (error.code !== 'EEXIST') throw error;
		});
		if (!(await lstat(root)).isDirectory())
			throw new Error('The library packs path must be an ordinary directory.');
	}
	private async generationDirectory(): Promise<string> {
		await this.ensurePacksDirectory();
		const root = join(this.libraryDir, 'packs', '.generations');
		await mkdir(root).catch(error => {
			if (error.code !== 'EEXIST') throw error;
		});
		if (!(await lstat(root)).isDirectory())
			throw new Error('Pack generations must use an ordinary directory.');
		const target = join(root, randomUUID());
		await mkdir(target);
		this.stages.add(target);
		return target;
	}

	private async legacyPacks(): Promise<{packs: InstalledPack[]; garbage: string[]}> {
		const root = join(this.libraryDir, 'packs');
		const active = new Map<string, InstalledPack>();
		const retired: InstalledPack[] = [];
		const garbage: string[] = [];
		for (const entry of await readdir(root, {withFileTypes: true})) {
			if (
				!entry.isDirectory() ||
				(entry.name.startsWith('.') && !entry.name.startsWith('.previous-'))
			)
				continue;
			const path = join(root, entry.name);
			if (entry.name.startsWith('.previous-')) {
				try {
					retired.push(await inspectPack(path, false));
				} catch {
					garbage.push(this.relativeRoot(path));
				}
			} else {
				const pack = await inspectPack(path, false);
				if (pack.manifest.id !== entry.name)
					throw new Error('Installed pack directory does not match its manifest.');
				active.set(pack.manifest.id, pack);
			}
		}
		for (const prior of retired.sort((a, b) => b.installedAt - a.installedAt))
			if (!active.has(prior.manifest.id)) active.set(prior.manifest.id, prior);
		if (!active.size && garbage.length)
			throw new Error(
				'The legacy library has no readable active or recovery pack. Restore its content before upgrading.',
			);
		const retained = new Set([...active.values()].map(pack => pack.root));
		return {
			packs: [...active.values()],
			garbage: [
				...garbage,
				...retired
					.filter(pack => !retained.has(pack.root))
					.map(pack => this.relativeRoot(pack.root)),
			],
		};
	}

	private async copySeed(source: string, target: string): Promise<void> {
		const isPack = await stat(join(source, 'manifest.json'))
			.then(() => true)
			.catch(error => {
				if (error.code === 'ENOENT') return false;
				throw error;
			});
		if (isPack) {
			const seed = await inspectPack(source, true);
			for (const file of ['manifest.json', ...seed.manifest.files.map(file => file.path)]) {
				await mkdir(dirname(join(target, file)), {recursive: true});
				await cp(join(source, file), join(target, file));
			}
		} else await copyRawSeed(source, target);
	}
	private async info(
		pack: InstalledPack,
		record = this.store.registry().find(record => record.id === pack.manifest.id),
	): Promise<InstalledPackInfo> {
		const prior = record?.previousManifestJson;
		const manifest = pack.manifest;
		const references = await readPackReferences(pack);
		const games = await readPackGames(pack);
		const characterIds = new Set(
			references.flatMap(reference =>
				reference.participants.map(participant => participant.characterId),
			),
		);
		const names = [
			...new Set(
				games.flatMap(game =>
					game.characters
						.filter(character => characterIds.has(character.id))
						.map(character => character.name),
				),
			),
		];
		const legacyTitle =
			names.length === 1 && games.length === 1
				? `${games[0].name} · ${names[0]}`
				: manifest.id.replace(/^hyper-chamber-/, '').replaceAll('-', ' ');
		return {
			id: manifest.id,
			title: 'title' in manifest ? manifest.title : legacyTitle,
			...('author' in manifest ? {author: manifest.author} : {}),
			version: manifest.version,
			formatVersion: manifest.formatVersion,
			bytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0),
			retainedBytes: prior
				? packManifestSchema
						.parse(JSON.parse(prior))
						.files.reduce((sum, file) => sum + file.bytes, 0)
				: 0,
			references: references.length,
			installedAt: pack.installedAt,
		};
	}

	private brokenInfo(record: RegistryPack): InstalledPackInfo {
		let manifest: PackManifest | undefined;
		try {
			manifest = packManifestSchema.parse(JSON.parse(record.manifestJson));
		} catch {
			/* Registry damage is reported without trusting its payload. */
		}
		return {
			id: record.id,
			title:
				manifest && 'title' in manifest
					? manifest.title
					: record.id.replace(/^hyper-chamber-/, '').replaceAll('-', ' '),
			...(manifest && 'author' in manifest ? {author: manifest.author} : {}),
			version: manifest?.version ?? 'Unknown',
			formatVersion: manifest?.formatVersion ?? 0,
			bytes: manifest?.files.reduce((sum, file) => sum + file.bytes, 0) ?? 0,
			retainedBytes: 0,
			references: 0,
			installedAt: record.installedAt,
			problem: this.problems.get(record.id) ?? 'This pack is unavailable.',
		};
	}
	async inventory(): Promise<PackInventory> {
		const healthy = new Map(this.packs.map(pack => [pack.manifest.id, pack]));
		return {
			generation: this.generation,
			packs: await Promise.all(
				this.store.registry().map(record => {
					const pack = healthy.get(record.id);
					return pack ? this.info(pack, record) : this.brokenInfo(record);
				}),
			),
			...(this.cleanupWarning ? {cleanupWarning: this.cleanupWarning} : {}),
		};
	}

	private compare(
		candidate: Awaited<ReturnType<typeof readPackCatalog>>,
	): Pick<PackChangePreview, 'added' | 'changed' | 'removed' | 'fallbacks'> {
		const before = new Map(this.snapshot.references.map(reference => [reference.id, reference]));
		const after = new Map(
			candidate.snapshot.references.map(reference => [reference.id, reference]),
		);
		return {
			added: [...after.keys()].filter(id => !before.has(id)),
			changed: [...after]
				.filter(
					([id, reference]) =>
						before.has(id) && JSON.stringify(before.get(id)) !== JSON.stringify(reference),
				)
				.map(([id]) => id),
			removed: [...before.keys()].filter(id => !after.has(id)),
			fallbacks: [...after]
				.filter(
					([id, reference]) => before.has(id) && reference.revision < before.get(id)!.revision,
				)
				.map(([id]) => id),
		};
	}
	private referenceTitles(
		candidate: Awaited<ReturnType<typeof readPackCatalog>>,
	): Record<string, string> {
		const changes = this.compare(candidate);
		const affected = new Set([
			...changes.added,
			...changes.changed,
			...changes.removed,
			...changes.fallbacks,
		]);
		return Object.fromEntries(
			[...this.snapshot.references, ...candidate.snapshot.references]
				.filter(reference => affected.has(reference.id))
				.map(reference => [reference.id, reference.title]),
		);
	}
	private async clearPreview(): Promise<void> {
		if (this.previewTimer) clearTimeout(this.previewTimer);
		this.previewTimer = undefined;
		const prepared = this.prepared;
		this.prepared = undefined;
		if (prepared?.stage) {
			// Failed deletion must remain eligible for the normal, warning-reporting GC.
			this.stages.delete(prepared.stage);
			this.cleanupPending = true;
			await rm(prepared.stage, {recursive: true, force: true});
		}
	}
	private savePreview(prepared: PreparedChange): PackChangePreview {
		this.prepared = prepared;
		this.previewTimer = setTimeout(
			() => {
				void this.expirePreview(prepared);
			},
			10 * 60 * 1000,
		);
		this.previewTimer.unref();
		return prepared.preview;
	}

	private async expirePreview(prepared: PreparedChange): Promise<void> {
		try {
			// Expiry can coincide with another maintenance action. Never delete a
			// stage while that action is using it, or clear a replacement preview.
			await this.operationTask?.catch(() => undefined);
			if (this.closed || this.prepared !== prepared) return;
			await this.exclusive(async () => {
				if (this.prepared === prepared) await this.clearPreview();
			});
		} catch (error) {
			this.cleanupWarning =
				error instanceof Error
					? error.message
					: 'An expired preview could not be removed. Its files will be retried later.';
		}
	}

	private async exclusive<T>(action: () => Promise<T>): Promise<T> {
		if (this.closed) throw new Error('The library is closing.');
		if (this.importing)
			throw new Error('Another content operation is in progress. Try again when it finishes.');
		this.importing = true;
		const task = (async () => {
			await this.cleanupTask;
			return action();
		})();
		this.operationTask = task;
		try {
			return await task;
		} finally {
			this.operationTask = undefined;
			this.importing = false;
			await this.cleanup();
		}
	}

	async previewArchive(path: string): Promise<PackChangePreview> {
		return this.exclusive(async () => {
			await this.clearPreview();
			await this.ensurePacksDirectory();
			if (!isAbsolute(path) || !basename(path).toLowerCase().endsWith('.hcpack'))
				throw new Error('Choose a .hcpack archive file.');
			const space = await statfs(this.libraryDir);
			const free = space.bavail * space.bsize;
			// ZIPs may expand substantially; the decoder enforces actual limits as well.
			if (
				free <
				Math.min((await stat(path)).size * 2 + 64 * 1024 ** 2, MAX_PACK_BYTES + 64 * 1024 ** 2)
			)
				throw new Error('There is not enough free space to stage this content pack.');
			const stage = await this.generationDirectory();
			let saved = false;
			try {
				await unpackPackArchive(path, stage, {
					maxUnpackedBytes: Math.max(0, Math.floor(free - 64 * 1024 ** 2)),
				});
				const pack = await inspectPack(stage, true);
				pack.installedAt =
					this.store
						.registry()
						.reduce((latest, record) => Math.max(latest, record.installedAt), Date.now()) + 1;
				const existing = this.packs;
				const prior = existing.find(item => item.manifest.id === pack.manifest.id);
				const priorRecord = this.store.registry().find(record => record.id === pack.manifest.id);
				const knownManifest = priorRecord
					? packManifestSchema.parse(JSON.parse(priorRecord.manifestJson))
					: undefined;
				const sameManifest =
					!!knownManifest && JSON.stringify(knownManifest) === JSON.stringify(pack.manifest);
				let identical = !!prior && sameManifest;
				if (identical)
					try {
						await inspectPack(prior!.root, true);
					} catch {
						identical = false;
					}
				if (knownManifest?.version === pack.manifest.version && !sameManifest)
					throw new Error(
						'This pack version is already installed with different files. Use a new version.',
					);
				const candidate = [...existing.filter(item => item.manifest.id !== pack.manifest.id), pack];
				const data = await readPackCatalog(candidate);
				const changes = this.compare(data);
				const conflicts: string[] = [];
				const incomingRefs = await readPackReferences(pack);
				const others = await readPackCatalog(
					existing.filter(item => item.manifest.id !== pack.manifest.id),
				);
				const othersById = new Map(
					others.snapshot.references.map(reference => [reference.id, reference]),
				);
				for (const reference of incomingRefs) {
					const other = othersById.get(reference.id);
					if (other && JSON.stringify(other) !== JSON.stringify(reference))
						conflicts.push(`Reference ${reference.id} is also provided by another pack.`);
				}
				for (const path of pack.manifest.games) {
					const game = gameDefinitionSchema.parse(await jsonFile(join(pack.root, path)));
					const other = others.snapshot.games.find(item => item.id === game.id);
					if (other && JSON.stringify(other) !== JSON.stringify(game))
						conflicts.push(`Game profile ${game.id} differs from another installed pack.`);
				}
				const warnings: string[] = [];
				const repair = !!priorRecord && sameManifest && !identical;
				if (repair)
					warnings.push(
						'This reinstalls a damaged pack using its registered edition and preserves your notes.',
					);
				if (prior && prior.manifest.version !== pack.manifest.version) {
					const order = comparePackVersions(pack.manifest.version, prior.manifest.version);
					warnings.push(
						order === null
							? `Replace legacy edition ${prior.manifest.version} with ${pack.manifest.version}; its order cannot be inferred.`
							: order < 0
								? `This rolls back edition ${prior.manifest.version} to ${pack.manifest.version}.`
								: `Replace edition ${prior.manifest.version} with ${pack.manifest.version}.`,
					);
				}
				if (changes.fallbacks.length)
					warnings.push('Some references would use an older execution revision.');
				const downgrade =
					!!changes.fallbacks.length ||
					!!(
						prior && (comparePackVersions(pack.manifest.version, prior.manifest.version) ?? 0) < 0
					);
				const preview: PackChangePreview = {
					token: randomUUID(),
					generation: this.generation,
					action: identical ? 'identical' : priorRecord ? 'update' : 'install',
					pack: await this.info(pack),
					...changes,
					conflicts,
					warnings,
					downgrade,
					referenceTitles: this.referenceTitles(data),
					requiresConfirmation: !!(
						conflicts.length ||
						changes.removed.length ||
						changes.fallbacks.length ||
						downgrade
					),
				};
				saved = true;
				return this.savePreview({
					preview,
					stage,
					pack,
					candidate,
					data,
					expiresAt: Date.now() + 10 * 60 * 1000,
					repair,
				});
			} finally {
				if (!saved) {
					await rm(stage, {recursive: true, force: true});
					this.stages.delete(stage);
				}
			}
		});
	}

	async previewRemoval(packId: string): Promise<PackChangePreview> {
		return this.exclusive(async () => {
			await this.clearPreview();
			const record = this.store.registry().find(record => record.id === packId);
			if (!record) throw new Error('This content pack is not installed.');
			const pack = this.packs.find(item => item.manifest.id === packId);
			const candidate = this.packs.filter(item => item.manifest.id !== packId);
			const data = await readPackCatalog(candidate);
			const changes = this.compare(data);
			const preview: PackChangePreview = {
				token: randomUUID(),
				generation: this.generation,
				action: 'remove',
				pack: pack ? await this.info(pack) : this.brokenInfo(record),
				...changes,
				conflicts: [],
				downgrade: !!changes.fallbacks.length,
				referenceTitles: this.referenceTitles(data),
				warnings: changes.fallbacks.length
					? ['Some references would fall back to an older execution revision.']
					: [],
				requiresConfirmation: true,
			};
			return this.savePreview({preview, candidate, data, expiresAt: Date.now() + 10 * 60 * 1000});
		});
	}

	async commitPreview(
		token: string,
		options: {expectedGeneration: number; allowConflicts?: boolean; allowDowngrade?: boolean},
	): Promise<{id: string; version: string; references: number; generation: number}> {
		return this.exclusive(async () => {
			const prepared = this.prepared;
			if (!prepared || prepared.preview.token !== token || prepared.expiresAt < Date.now())
				throw new Error('This preview expired. Choose the pack and review it again.');
			if (
				options.expectedGeneration !== this.generation ||
				prepared.preview.generation !== this.generation
			)
				throw new Error('Installed content changed. Review this operation again.');
			if (prepared.preview.conflicts.length && !options.allowConflicts)
				throw new Error('Review and confirm the overlapping content before importing.');
			if (
				(prepared.preview.fallbacks.length ||
					(prepared.pack &&
						this.packs.some(
							pack =>
								pack.manifest.id === prepared.pack!.manifest.id &&
								(comparePackVersions(prepared.pack!.manifest.version, pack.manifest.version) ?? 0) <
									0,
						))) &&
				!options.allowDowngrade
			)
				throw new Error(
					'Review and confirm the older pack edition or execution revisions before continuing.',
				);
			if (prepared.preview.action === 'identical') {
				const result = {
					id: prepared.preview.pack.id,
					version: prepared.preview.pack.version,
					references: this.snapshot.references.length,
					generation: this.generation,
				};
				await this.clearPreview();
				return result;
			}
			const oldGeneration = this.generation;
			const oldData = this.data!;
			const records = this.store.registry();
			const next =
				prepared.preview.action === 'remove'
					? records.filter(record => record.id !== prepared.preview.pack.id)
					: [
							...records.filter(record => record.id !== prepared.preview.pack.id),
							this.record(
								prepared.pack!,
								prepared.repair
									? undefined
									: records.find(record => record.id === prepared.preview.pack.id),
							),
						];
			const generation = this.store.replaceRegistry(next, oldGeneration);
			this.cleanupPending = true;
			if (this.previewTimer) clearTimeout(this.previewTimer);
			this.previewTimer = undefined;
			this.prepared = undefined;
			if (prepared.stage) this.stages.delete(prepared.stage);
			this.history.set(oldGeneration, oldData.media);
			while (this.history.size > 1) this.history.delete(this.history.keys().next().value!);
			this.packs = prepared.candidate;
			this.problems.delete(prepared.preview.pack.id);
			this.quarantinedPaths.clear();
			for (const record of next) if (this.problems.has(record.id)) this.quarantine(record);
			this.data = prepared.data;
			this.data.snapshot.generation = generation;
			// A removal must never keep its content addressable through a stale catalog.
			if (prepared.preview.action === 'remove') this.history.clear();
			await this.cleanup();
			return {
				id: prepared.preview.pack.id,
				version: prepared.preview.pack.version,
				references: this.snapshot.references.length,
				generation,
			};
		});
	}
	async discardPreview(token: string): Promise<void> {
		return this.exclusive(async () => {
			if (this.prepared?.preview.token === token) await this.clearPreview();
		});
	}
	async restoreNotes(
		file: string,
		revision: number,
	): Promise<{restored: number; maintenanceRevision: number}> {
		return this.exclusive(() => this.store.restoreNotes(file, revision));
	}
	async importArchive(
		path: string,
	): Promise<{id: string; version: string; references: number; generation: number}> {
		const preview = await this.previewArchive(path);
		// Existing internal/CLI callers retain a direct path; overlap confirmation is a GUI concern.
		if (preview.fallbacks.length) {
			await this.clearPreview();
			throw new Error(
				`Cannot lower an installed reference's execution revision: ${preview.fallbacks[0]}`,
			);
		}
		return this.commitPreview(preview.token, {
			expectedGeneration: preview.generation,
			allowConflicts: true,
		});
	}
	async removePack(
		packId: string,
		expectedGeneration: number,
		allowFallback = false,
	): Promise<PackInventory> {
		const preview = await this.previewRemoval(packId);
		await this.commitPreview(preview.token, {expectedGeneration, allowDowngrade: allowFallback});
		return this.inventory();
	}
	async cleanup(): Promise<void> {
		if (this.closed || this.importing || !this.cleanupPending) return;
		if (this.cleanupTask) return this.cleanupTask;
		this.cleanupTask = (async () => {
			try {
				const retained = new Set(
					this.store
						.registry()
						.flatMap(record => [
							record.root,
							...(record.previousRoot ? [record.previousRoot] : []),
						]),
				);
				let blocked = false;
				const roots = new Set(this.store.garbageRoots());
				const generations = join(this.libraryDir, 'packs', '.generations');
				const entries = await readdir(generations, {withFileTypes: true}).catch(error => {
					if (error.code === 'ENOENT') return [];
					throw error;
				});
				for (const entry of entries)
					if (entry.isDirectory() && /^[a-f0-9-]+$/.test(entry.name))
						roots.add(`packs/.generations/${entry.name}`);
				for (const root of roots) {
					if (retained.has(root) || this.stages.has(join(this.libraryDir, ...root.split('/'))))
						continue;
					const path = join(this.libraryDir, ...root.split('/'));
					if (this.leases.get(path)) {
						blocked = true;
						continue;
					}
					// Stale generation maps are retired before their bytes are reclaimed.
					for (const [generation, files] of this.history)
						if ([...files.values()].some(file => file.root === path))
							this.history.delete(generation);
					const existing = await lstat(path).catch(error => {
						if (error.code === 'ENOENT') return null;
						throw error;
					});
					if (existing) {
						await this.resolveRoot(root);
						await rm(path, {recursive: true, force: true});
					}
					this.store.forgetGarbage(root);
				}
				this.cleanupWarning = undefined;
				this.cleanupPending = blocked;
			} catch (error) {
				this.cleanupPending = true;
				this.cleanupWarning =
					error instanceof Error
						? error.message
						: 'Some retired content could not be reclaimed. Retry after closing its replay.';
			}
		})().finally(() => {
			this.cleanupTask = undefined;
		});
		return this.cleanupTask;
	}
	async close(): Promise<void> {
		if (this.closeTask) return this.closeTask;
		this.closed = true;
		this.closeTask = (async () => {
			try {
				await this.operationTask?.catch(() => undefined);
				await this.clearPreview();
				await this.cleanupTask;
			} finally {
				this.history.clear();
				this.store.close();
			}
		})();
		return this.closeTask;
	}
}
