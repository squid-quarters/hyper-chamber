import {createHash, randomUUID} from 'node:crypto';
import {createReadStream, closeSync, mkdirSync, openSync, writeSync, renameSync} from 'node:fs';
import {cp, lstat, mkdir, readFile, readdir, realpath, rm, stat, writeFile} from 'node:fs/promises';
import {basename, dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {Unzip, UnzipInflate} from 'fflate';
import {z} from 'zod';
import {
	gameDefinitionSchema,
	parseCatalog,
	referenceSchema,
	type CatalogSnapshot,
	type GameDefinition,
	type Reference,
} from '@hyper-chamber/reference';

const MAX_FILE_BYTES = 2 * 1024 ** 3;
const MAX_PACK_BYTES = 20 * 1024 ** 3;
const MAX_PACK_FILES = 30000;
const safePathSchema = z
	.string()
	.min(1)
	.max(512)
	.refine(value => {
		const segments = value.split('/');
		return (
			/^[a-zA-Z0-9_/.-]+$/.test(value) &&
			!isAbsolute(value) &&
			segments.length <= 20 &&
			segments.every(segment => segment !== '' && !segment.startsWith('.'))
		);
	}, 'Pack paths must be relative files without traversal');
export const packManifestSchema = z
	.strictObject({
		formatVersion: z.literal(1),
		id: z
			.string()
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			.max(100),
		version: z.string().min(1).max(100),
		games: z.array(safePathSchema).min(1).max(100),
		catalogs: z.array(safePathSchema).min(1).max(1000),
		files: z
			.array(
				z.strictObject({
					path: safePathSchema,
					sha256: z.string().regex(/^[a-f0-9]{64}$/),
					bytes: z.number().int().nonnegative().max(MAX_FILE_BYTES),
				}),
			)
			.max(MAX_PACK_FILES),
	})
	.superRefine((manifest, context) => {
		const paths = new Set(manifest.files.map(file => file.path));
		if (paths.size !== manifest.files.length || paths.has('manifest.json')) {
			context.addIssue({
				code: 'custom',
				path: ['files'],
				message: 'Pack file paths must be unique; manifest.json is not a payload file',
			});
		}
		for (const path of [...manifest.games, ...manifest.catalogs]) {
			if (!paths.has(path))
				context.addIssue({code: 'custom', message: `Missing manifest file: ${path}`});
		}
		if (manifest.files.reduce((sum, file) => sum + file.bytes, 0) > MAX_PACK_BYTES) {
			context.addIssue({code: 'custom', message: 'Content pack exceeds the unpacked size limit'});
		}
	});
export type PackManifest = z.infer<typeof packManifestSchema>;
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
async function readPackReferences(pack: InstalledPack): Promise<Reference[]> {
	const references: Reference[] = [];
	const ids = new Set<string>();
	for (const path of pack.manifest.catalogs) {
		const value = await jsonFile(join(pack.root, path));
		if (!Array.isArray(value)) throw new Error('A reference catalog must be a JSON array.');
		for (const rawReference of value) {
			const reference = referenceSchema.parse(rawReference);
			if (ids.has(reference.id))
				throw new Error('A content pack contains duplicate reference IDs.');
			if (mediaPaths(reference).some(path => !isPassiveMediaPath(path)))
				throw new Error('Reference media must use passive video, raster image or VTT files.');
			ids.add(reference.id);
			references.push(reference);
		}
	}
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
		for (const path of pack.manifest.games) {
			const game = gameDefinitionSchema.parse(await jsonFile(join(pack.root, path)));
			gamesById.set(game.id, game);
		}
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
	if (!games.length || !references.length)
		throw new Error('The library has no installed reference catalog.');
	return {snapshot: {formatVersion: 1, games, references}, media};
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

/** ZIP extraction writes regular files only, with bounded actual decompression and no path traversal. */
async function unpackArchive(archive: string, target: string): Promise<void> {
	const archiveStat = await stat(archive);
	if (!archiveStat.isFile() || archiveStat.size > MAX_FILE_BYTES)
		throw new Error('Choose a content pack file under 2 GiB.');
	const seen = new Set<string>();
	const openFiles = new Set<number>();
	let totalBytes = 0;
	let failure: Error | null = null;
	const fail = (error: unknown) => {
		failure = error instanceof Error ? error : new Error('Could not extract the content pack.');
	};
	const unzip = new Unzip(file => {
		if (failure) return;
		try {
			if (file.name.endsWith('/')) {
				safePathSchema.parse(file.name.slice(0, -1));
				return;
			}
			const name = safePathSchema.parse(file.name);
			if (seen.has(name) || seen.size >= MAX_PACK_FILES + 1)
				throw new Error('Duplicate or excessive archive files.');
			seen.add(name);
			const path = join(target, name);
			mkdirSync(dirname(path), {recursive: true});
			const fd = openSync(path, 'wx', 0o600);
			openFiles.add(fd);
			let bytes = 0;
			file.ondata = (error, chunk, final) => {
				if (failure) return;
				try {
					if (error) throw error;
					bytes += chunk.byteLength;
					totalBytes += chunk.byteLength;
					if (bytes > MAX_FILE_BYTES || totalBytes > MAX_PACK_BYTES)
						throw new Error('The unpacked content pack exceeds the size limit.');
					let written = 0;
					while (written < chunk.byteLength) written += writeSync(fd, chunk, written);
					if (final) {
						closeSync(fd);
						openFiles.delete(fd);
					}
				} catch (error) {
					fail(error);
				}
			};
			file.start();
		} catch (error) {
			fail(error);
		}
	});
	unzip.register(UnzipInflate);
	try {
		for await (const chunk of createReadStream(archive, {highWaterMark: 64 * 1024})) {
			unzip.push(new Uint8Array(chunk));
			if (failure) throw failure;
		}
		unzip.push(new Uint8Array(), true);
		if (failure) throw failure;
		if (openFiles.size) throw new Error('The content pack is truncated.');
		const manifest = packManifestSchema.parse(await jsonFile(join(target, 'manifest.json')));
		const expected = new Set(['manifest.json', ...manifest.files.map(file => file.path)]);
		if (seen.size !== expected.size || [...seen].some(path => !expected.has(path)))
			throw new Error('The archive contains files outside its manifest.');
	} finally {
		for (const fd of openFiles) closeSync(fd);
	}
}

export class LibraryCatalog {
	private packs: InstalledPack[] = [];
	private data: Awaited<ReturnType<typeof readPackCatalog>> | undefined;
	private importing = false;
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
		await mkdir(join(options.libraryDir, 'packs'), {recursive: true});
		await catalog.recoverInterruptedReplacement();
		const installed = (
			await readdir(join(options.libraryDir, 'packs'), {withFileTypes: true})
		).some(entry => entry.isDirectory() && !entry.name.startsWith('.'));
		if (!installed && options.seedDir) await catalog.seed(options.seedDir);
		await catalog.reload();
		return catalog;
	}

	get snapshot(): CatalogSnapshot {
		if (!this.data) throw new Error('The catalog has not been loaded.');
		return this.data.snapshot;
	}
	get packCount(): number {
		return this.packs.length;
	}
	revision(id: string): number {
		return this.snapshot.references.find(reference => reference.id === id)?.revision ?? 1;
	}
	media(path: string): MediaFile | undefined {
		const installed = this.data?.media.get(path);
		if (installed) return installed;
		return this.fallbackMediaDir && path.startsWith('/media/')
			? {root: this.fallbackMediaDir, path: path.slice('/media/'.length)}
			: undefined;
	}

	private async recoverInterruptedReplacement(): Promise<void> {
		const root = join(this.libraryDir, 'packs');
		const candidates: InstalledPack[] = [];
		for (const entry of await readdir(root, {withFileTypes: true})) {
			if (!entry.isDirectory() || !entry.name.startsWith('.previous-')) continue;
			try {
				const retired = join(root, entry.name);
				const manifest = packManifestSchema.parse(await jsonFile(join(retired, 'manifest.json')));
				const active = await lstat(join(root, manifest.id)).catch(error => {
					if (error.code === 'ENOENT') return null;
					throw error;
				});
				if (!active) candidates.push(await inspectPack(retired, false));
			} catch {
				// Retired copies are recovery aids; corrupt old copies cannot disable a valid active pack.
			}
		}
		for (const prior of candidates.sort((a, b) => b.installedAt - a.installedAt)) {
			const target = join(root, prior.manifest.id);
			const present = await lstat(target).catch(error => {
				if (error.code === 'ENOENT') return null;
				throw error;
			});
			if (!present) renameSync(prior.root, target);
		}
	}
	private async currentPacks(): Promise<InstalledPack[]> {
		const root = join(this.libraryDir, 'packs');
		const packs: InstalledPack[] = [];
		for (const entry of await readdir(root, {withFileTypes: true})) {
			if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
			const pack = await inspectPack(join(root, entry.name), false);
			if (pack.manifest.id !== entry.name)
				throw new Error('Installed pack directory does not match its manifest.');
			packs.push(pack);
		}
		return packs;
	}
	private async reload(): Promise<void> {
		const packs = await this.currentPacks();
		const data = await readPackCatalog(packs);
		this.packs = packs;
		this.data = data;
	}
	private async activate(stage: string, pack: InstalledPack): Promise<void> {
		const root = join(this.libraryDir, 'packs');
		const target = join(root, pack.manifest.id);
		const retired = join(root, `.previous-${pack.manifest.id}-${randomUUID()}`);
		const existing = await stat(target).catch(error => {
			if (error.code === 'ENOENT') return null;
			throw error;
		});
		await writeFile(join(stage, '.installed.json'), JSON.stringify({installedAt: Date.now()}));
		if (existing) renameSync(target, retired);
		try {
			renameSync(stage, target);
			await this.reload();
		} catch (error) {
			await rm(target, {recursive: true, force: true});
			if (existing) renameSync(retired, target);
			throw error;
		}
		// A prior pack is retained for recovery; replacing content never deletes learner entries.
	}
	private async seed(source: string): Promise<void> {
		const stage = join(this.libraryDir, 'packs', `.seed-${randomUUID()}`);
		await mkdir(stage, {recursive: true});
		try {
			const isPack = await stat(join(source, 'manifest.json'))
				.then(() => true)
				.catch(error => {
					if (error.code === 'ENOENT') return false;
					throw error;
				});
			if (isPack) {
				const seed = await inspectPack(source, true);
				for (const file of ['manifest.json', ...seed.manifest.files.map(file => file.path)]) {
					await mkdir(dirname(join(stage, file)), {recursive: true});
					await cp(join(source, file), join(stage, file));
				}
			} else await copyRawSeed(source, stage);
			const pack = await inspectPack(stage, true);
			await readPackCatalog([pack]);
			await this.activate(stage, pack);
		} finally {
			await rm(stage, {recursive: true, force: true});
		}
	}

	async importArchive(path: string): Promise<{id: string; version: string; references: number}> {
		if (this.importing)
			throw new Error('Another content pack is being installed. Try again when it finishes.');
		if (!isAbsolute(path) || !basename(path).toLowerCase().endsWith('.hcpack'))
			throw new Error('Choose a .hcpack archive file.');
		this.importing = true;
		const stage = join(this.libraryDir, 'packs', `.import-${randomUUID()}`);
		try {
			await mkdir(stage, {recursive: true});
			await unpackArchive(path, stage);
			const pack = await inspectPack(stage, true);
			const existing = await this.currentPacks();
			assertCatalogJsonBudget([
				...existing
					.filter(item => item.manifest.id !== pack.manifest.id)
					.map(item => item.manifest),
				pack.manifest,
			]);
			const prior = existing.find(item => item.manifest.id === pack.manifest.id);
			if (prior?.manifest.version === pack.manifest.version) {
				if (JSON.stringify(prior.manifest) !== JSON.stringify(pack.manifest))
					throw new Error(
						'This pack version is already installed with different files. Use a new version.',
					);
				return {
					id: pack.manifest.id,
					version: pack.manifest.version,
					references: this.snapshot.references.length,
				};
			}

			pack.installedAt = Date.now();
			const candidate = await readPackCatalog([
				...existing.filter(item => item.manifest.id !== pack.manifest.id),
				pack,
			]);
			const currentRevisions = new Map(
				this.snapshot.references.map(reference => [reference.id, reference.revision]),
			);
			for (const reference of candidate.snapshot.references) {
				if (reference.revision < (currentRevisions.get(reference.id) ?? 0))
					throw new Error(
						`Cannot lower an installed reference's execution revision: ${reference.id}`,
					);
			}
			await this.activate(stage, pack);
			return {
				id: pack.manifest.id,
				version: pack.manifest.version,
				references: this.snapshot.references.length,
			};
		} finally {
			this.importing = false;
			await rm(stage, {recursive: true, force: true});
		}
	}
}
