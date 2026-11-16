import {createHash, randomUUID} from 'node:crypto';
import {constants, createReadStream} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
	copyFile,
	lstat,
	link,
	mkdir,
	mkdtemp,
	open,
	readFile,
	readdir,
	realpath,
	rename,
	rm,
	stat,
	statfs,
} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, extname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {z} from 'zod';
import {
	gameDefinitionSchema,
	parseCatalog,
	referenceSchema,
	packManifestSchema,
	packPathSchema,
	packVersionSchema,
	MAX_FILE_BYTES,
	MAX_PACK_FILES,
	comparePackVersions,
	type GameDefinition,
	type Reference,
	type PackManifest,
} from '@hyper-chamber/reference';
import {unpackPackArchive, writePackArchive, type ArchivePack} from './archive.ts';
export {unpackPackArchive, writePackArchive} from './archive.ts';

const MAX_JSON_BYTES = 32 * 1024 ** 2;
const MAX_ASSET_BYTES = 8 * 1024 ** 2;
const identity = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
	.max(100);
export const workspaceSchema = z.strictObject({
	workspaceVersion: z.literal(1),
	editRevision: z.number().int().nonnegative().safe().default(0),
	id: identity,
	version: packVersionSchema,
	title: z.string().min(1).max(120),
	author: z.string().min(1).max(120),
	derivedFrom: z.strictObject({id: identity, version: z.string().min(1).max(100)}).optional(),
	lastExport: z
		.strictObject({version: packVersionSchema, manifestSha256: z.string().regex(/^[a-f0-9]{64}$/)})
		.optional(),
	games: z.array(gameDefinitionSchema).min(1).max(100),
	references: z.array(referenceSchema).max(10000),
});
export type Workspace = z.infer<typeof workspaceSchema>;
export interface ValidationReport {
	valid: boolean;
	errors: string[];
	warnings: string[];
	referenceCount: number;
	bytes: number;
}
function errorText(error: unknown): string {
	return error instanceof Error ? error.message : 'The workspace could not be processed.';
}
function isInside(root: string, path: string): boolean {
	const part = relative(root, path);
	return !!part && !part.startsWith(`..${sep}`) && part !== '..' && !isAbsolute(part);
}
async function workspaceRoot(directory: string): Promise<string> {
	const root = await realpath(resolve(directory));
	if (!(await stat(root)).isDirectory()) throw new Error('Choose a workspace folder.');
	return root;
}
async function regularFile(root: string, path: string): Promise<string> {
	packPathSchema.parse(path);
	const candidate = join(root, path);
	const metadata = await lstat(candidate);
	if (!metadata.isFile()) throw new Error(`Workspace assets must be regular files: ${path}`);
	const resolved = await realpath(candidate);
	if (!isInside(root, resolved)) throw new Error(`An asset leaves the workspace: ${path}`);
	return resolved;
}
async function assetParent(root: string, path: string): Promise<string> {
	packPathSchema.parse(path);
	let current = root;
	for (const part of path.split('/').slice(0, -1)) {
		current = join(current, part);
		await mkdir(current).catch(error => {
			if (error.code !== 'EEXIST') throw error;
		});
		if (!(await lstat(current)).isDirectory())
			throw new Error('Workspace directories cannot be links or files.');
	}
	return current;
}
async function atomicWrite(root: string, path: string, bytes: Uint8Array): Promise<void> {
	const parent = await assetParent(root, path);
	const target = join(root, path);
	const existing = await lstat(target).catch(error => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (existing && !existing.isFile())
		throw new Error(`Refusing to replace a linked or non-file workspace path: ${path}`);
	const temporary = join(parent, `.hc-write-${randomUUID()}`);
	try {
		const file = await open(temporary, 'wx', 0o600);
		try {
			await file.writeFile(bytes);
			await file.sync();
		} finally {
			await file.close();
		}
		await rename(temporary, target);
	} finally {
		await rm(temporary, {force: true});
	}
}
function parsedWorkspace(value: unknown): Workspace {
	const workspace = workspaceSchema.parse(value);
	parseCatalog(workspace.references, workspace.games);
	if (workspace.references.some(reference => !reference.id.startsWith(`${workspace.id}-`)))
		throw new Error(
			'Workspace references must use their pack identity namespace. Fork imported references instead of overriding them.',
		);
	return workspace;
}
export async function readWorkspace(directory: string): Promise<Workspace> {
	const root = await workspaceRoot(directory);
	const path = await regularFile(root, 'workspace.json');
	if ((await stat(path)).size > MAX_JSON_BYTES)
		throw new Error('The workspace document exceeds 32 MiB.');
	return parsedWorkspace(JSON.parse(await readFile(path, 'utf8')));
}
async function saveWorkspaceUnlocked(directory: string, value: unknown): Promise<Workspace> {
	const root = await workspaceRoot(directory);
	const workspace = parsedWorkspace(value);
	const previous = await readWorkspace(root);
	if (workspace.id !== previous.id)
		throw new Error('Editing a workspace cannot change its pack identity. Fork it instead.');
	if (workspace.editRevision !== previous.editRevision)
		throw new Error(
			'The workspace changed in another editor. Reload it before saving; your unsaved changes were kept.',
		);
	workspace.editRevision = previous.editRevision + 1;
	if (!Number.isSafeInteger(workspace.editRevision))
		throw new Error('The workspace edit revision limit was reached.');
	workspace.lastExport = previous.lastExport;
	const oldReferences = new Map(previous.references.map(reference => [reference.id, reference]));
	for (const reference of workspace.references) {
		const old = oldReferences.get(reference.id);
		if (!old) continue;
		if (reference.revision < old.revision)
			throw new Error('An execution revision cannot be lowered.');
		const signature = (value: Reference) =>
			JSON.stringify([
				value.gameId,
				value.participants,
				value.notation,
				value.inputs,
				value.conditions,
				value.resources,
			]);
		if (signature(reference) !== signature(old) && reference.revision === old.revision) {
			reference.revision++;
			reference.verification = {
				...reference.verification,
				status: 'draft',
				note: 'Execution details changed. Review the new revision against its recording.',
			};
		}
	}
	const serialized = Buffer.from(`${JSON.stringify(workspace, null, 2)}\n`);
	if (serialized.length > MAX_JSON_BYTES) throw new Error('The workspace document exceeds 32 MiB.');
	await atomicWrite(root, 'workspace.json', serialized);
	return workspace;
}
async function assertEmptyWorkspace(root: string): Promise<void> {
	if (
		(await readdir(root)).some(
			name =>
				!['.DS_Store', '.hc-authoring-lock.sqlite', '.hc-authoring-lock.sqlite-journal'].includes(
					name,
				),
		)
	)
		throw new Error(
			'Choose an empty folder for the new workspace. Existing files were left unchanged.',
		);
}
async function createWorkspaceUnlocked(
	directory: string,
	options: {title: string; author: string; games: GameDefinition[]},
): Promise<Workspace> {
	await mkdir(resolve(directory), {recursive: true});
	const root = await workspaceRoot(directory);
	await assertEmptyWorkspace(root);
	const workspace = parsedWorkspace({
		workspaceVersion: 1,
		id: `community-${randomUUID()}`,
		version: '1.0.0',
		title: options.title,
		author: options.author,
		games: options.games,
		references: [],
	});
	await atomicWrite(root, 'workspace.json', Buffer.from(`${JSON.stringify(workspace, null, 2)}\n`));
	return workspace;
}
export function newReferenceId(workspace: Pick<Workspace, 'id'>): string {
	return `${workspace.id}-${randomUUID()}`;
}
export interface ReferenceDraft {
	id?: string;
	revision?: number;
	gameId: string;
	characterId: string;
	title: string;
	summary: string;
	kind?: Reference['kind'];
	steps: {notation: string; label: string; cue?: string}[];
	situations?: string[];
	outcomes?: string[];
	conditions?: string[];
	notes?: string[];
	resources?: Record<string, string>;
	duration: number;
	source?: Reference['source'];
	media: Reference['media'];
}
export function createReference(workspace: Workspace, draft: ReferenceDraft): Reference {
	const id = draft.id ?? newReferenceId(workspace);
	if (!id.startsWith(`${workspace.id}-`))
		throw new Error('New reference IDs must belong to the workspace namespace.');
	const original = workspace.references.find(reference => reference.id === id);
	if (draft.revision !== undefined && (!original || draft.revision < original.revision))
		throw new Error('An execution revision cannot be lowered or assigned to a new reference.');
	const reference = referenceSchema.parse({
		id,
		gameId: draft.gameId,
		participants: [{id: 'main', characterId: draft.characterId}],
		revision: draft.revision ?? original?.revision ?? 1,
		title: draft.title,
		summary: draft.summary,
		kind: draft.kind ?? 'combo',
		situations: draft.situations ?? [],
		outcomes: draft.outcomes ?? [],
		notation: draft.steps.map(step => step.notation).join(' > '),
		inputs: draft.steps.map((step, index) => ({id: `step-${index + 1}`, ...step})),
		conditions: draft.conditions ?? [],
		notes: draft.notes ?? [],
		resources: draft.resources ?? {},
		source: draft.source ?? {
			kind: 'recording',
			id: `${id}-recording`,
			title: draft.title,
			creator: workspace.author,
			published: '',
			start: 0,
			end: draft.duration,
		},
		verification: {
			status: 'draft',
			gameVersion: null,
			note: 'Created in a local workspace; execution has not been reviewed.',
		},
		media: draft.media,
		relatedIds: original?.relatedIds ?? [],
	});
	parseCatalog(
		[...workspace.references.filter(item => item.id !== id), reference],
		workspace.games,
	);
	return reference;
}
function mediaPaths(reference: Reference): string[] {
	return [
		...new Set(
			[
				reference.media.clip,
				reference.media.poster,
				reference.media.descriptionTrack,
				...reference.media.frames.map(frame => frame.src),
			].filter((path): path is string => !!path),
		),
	].map(path => packPathSchema.parse(path.slice(1)));
}
async function describedFile(
	root: string,
	path: string,
): Promise<{path: string; source: string; bytes: number; sha256: string}> {
	const source = await regularFile(root, path);
	const metadata = await stat(source);
	if (metadata.size >= MAX_FILE_BYTES)
		throw new Error(`An asset must be smaller than 2 GiB: ${path}`);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(source, {highWaterMark: 64 * 1024})) {
		bytes += chunk.length;
		if (bytes >= MAX_FILE_BYTES) throw new Error(`An asset exceeds the size limit: ${path}`);
		hash.update(chunk);
	}
	return {path, source, bytes, sha256: hash.digest('hex')};
}
async function collectWorkspace(
	directory: string,
): Promise<{workspace: Workspace; pack: ArchivePack; bytes: number; warnings: string[]}> {
	const root = await workspaceRoot(directory);
	const workspace = await readWorkspace(root);
	if (!workspace.references.length)
		throw new Error('Add at least one complete reference before exporting.');
	const sources = new Map<string, string | Uint8Array>();
	const files: PackManifest['files'] = [];
	const addJson = (path: string, value: unknown) => {
		const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
		sources.set(path, bytes);
		files.push({
			path,
			bytes: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
		});
	};
	for (const game of workspace.games) addJson(`games/${game.id}.json`, game);
	addJson('catalogs/references.json', workspace.references);
	const seen = new Set<string>();
	for (const reference of workspace.references) {
		if (!reference.media.clip) throw new Error(`Add a replay clip to ${reference.title}.`);
		for (const path of mediaPaths(reference)) {
			if (!/^media\/.+\.(?:mp4|webm|png|jpe?g|webp|avif|vtt)$/i.test(path))
				throw new Error(`Unsupported media asset: ${path}`);
			if (seen.has(path)) continue;
			seen.add(path);
			if (files.length >= MAX_PACK_FILES) throw new Error('The workspace has too many assets.');
			const file = await describedFile(root, path);
			sources.set(path, file.source);
			files.push({path, bytes: file.bytes, sha256: file.sha256});
		}
	}
	const manifest = packManifestSchema.parse({
		formatVersion: 2,
		id: workspace.id,
		version: workspace.version,
		title: workspace.title,
		author: workspace.author,
		...(workspace.derivedFrom ? {derivedFrom: workspace.derivedFrom} : {}),
		games: workspace.games.map(game => `games/${game.id}.json`),
		catalogs: ['catalogs/references.json'],
		files,
	});
	const warnings = workspace.references
		.filter(reference => reference.verification.status === 'draft')
		.map(
			reference =>
				`Draft: ${reference.title}. Technical validation does not establish gameplay accuracy.`,
		);
	return {
		workspace,
		pack: {manifest, sources},
		bytes: files.reduce((total, file) => total + file.bytes, 0),
		warnings,
	};
}
export async function validateWorkspace(directory: string): Promise<ValidationReport> {
	try {
		const result = await collectWorkspace(directory);
		return {
			valid: true,
			errors: [],
			warnings: result.warnings,
			referenceCount: result.workspace.references.length,
			bytes: result.bytes,
		};
	} catch (error) {
		return {valid: false, errors: [errorText(error)], warnings: [], referenceCount: 0, bytes: 0};
	}
}
async function exportWorkspaceUnlocked(
	directory: string,
	output: string,
): Promise<{
	path: string;
	manifest: PackManifest;
	referenceCount: number;
	bytes: number;
	warnings: string[];
	workspace: Workspace;
}> {
	const result = await collectWorkspace(directory);
	const path = resolve(output);
	if (!path.toLowerCase().endsWith('.hcpack'))
		throw new Error('Choose an output file ending in .hcpack.');
	const manifestSha256 = createHash('sha256')
		.update(JSON.stringify(result.pack.manifest))
		.digest('hex');
	if (result.workspace.lastExport) {
		const order = comparePackVersions(
			result.workspace.version,
			result.workspace.lastExport.version,
		);
		if (order !== null && order < 0)
			throw new Error('Increase the pack edition rather than exporting an older version.');
		if (order === 0 && result.workspace.lastExport.manifestSha256 !== manifestSha256)
			throw new Error(
				'Content changed since this edition was exported. Increase the pack version before exporting again.',
			);
	}
	const staged = join(dirname(path), `.hc-export-${randomUUID()}.tmp`);
	const updated = {
		...result.workspace,
		lastExport: {version: result.workspace.version, manifestSha256},
		editRevision: result.workspace.editRevision + 1,
	};
	const root = await workspaceRoot(directory);
	try {
		await writePackArchive(result.pack, staged);
		// Record this edition before any public output can exist. If publication
		// fails, retaining the ledger permits only an identical same-edition retry.
		await atomicWrite(root, 'workspace.json', Buffer.from(`${JSON.stringify(updated, null, 2)}\n`));
		try {
			await link(staged, path); // Same-directory, atomic and refuses replacement.
		} catch (error) {
			if (
				!error ||
				typeof error !== 'object' ||
				!('code' in error) ||
				!['ENOTSUP', 'EOPNOTSUPP', 'EPERM', 'EXDEV', 'ENOSYS'].includes(String(error.code))
			)
				throw error;
			// FAT/network filesystems may lack hard links. Node's exclusive copy
			// refuses existing output and cleans its own partial file on I/O error.
			// A killed process can leave a partial copy, but never an untracked edition.
			await copyFile(staged, path, constants.COPYFILE_EXCL);
		}
	} finally {
		await rm(staged, {force: true});
	}
	return {
		path,
		manifest: result.pack.manifest,
		referenceCount: result.workspace.references.length,
		bytes: (await stat(path)).size,
		warnings: result.warnings,
		workspace: updated,
	};
}
async function addMediaUnlocked(
	directory: string,
	sourcePath: string,
	referenceId: string,
): Promise<{path: string; bytes: number}> {
	const root = await workspaceRoot(directory);
	const workspace = await readWorkspace(root);
	if (
		!referenceId.startsWith(`${workspace.id}-`) ||
		!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(referenceId)
	)
		throw new Error('The recording must belong to a reference in this workspace.');
	const extension = extname(sourcePath).toLowerCase();
	if (!['.mp4', '.webm'].includes(extension))
		throw new Error('Choose an already-trimmed MP4 or WebM recording.');
	const metadata = await stat(sourcePath);
	if (!metadata.isFile() || metadata.size >= MAX_FILE_BYTES)
		throw new Error('Choose a regular video file smaller than 2 GiB.');
	const path = `media/${workspace.id}/${referenceId}/clip-${randomUUID()}${extension}`;
	const parent = await assetParent(root, path);
	const temporary = join(parent, `.hc-copy-${randomUUID()}`);
	try {
		await copyFile(sourcePath, temporary);
		const copied = await stat(temporary);
		if (copied.size !== metadata.size) throw new Error('The video changed while it was copied.');
		const existing = await lstat(join(root, path)).catch(error => {
			if (error.code === 'ENOENT') return null;
			throw error;
		});
		if (existing && !existing.isFile())
			throw new Error('The recording destination is not a regular file.');
		await rename(temporary, join(root, path));
	} finally {
		await rm(temporary, {force: true});
	}
	return {path: `/${path}`, bytes: metadata.size};
}
async function writeAssetUnlocked(
	directory: string,
	mediaPath: string,
	base64: string,
): Promise<{path: string; bytes: number}> {
	const root = await workspaceRoot(directory);
	const workspace = await readWorkspace(root);
	const path = mediaPath.startsWith('/') ? mediaPath.slice(1) : mediaPath;
	if (!path.startsWith(`media/${workspace.id}/`) || !/\.(?:jpe?g|png|webp)$/i.test(path))
		throw new Error('Generated frames must be JPEG, PNG or WebP images inside this workspace.');
	if (
		base64.length > Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 4 ||
		!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
	)
		throw new Error('The generated frame is invalid or exceeds 8 MiB.');
	const bytes = Buffer.from(base64, 'base64');
	if (!bytes.length || bytes.length > MAX_ASSET_BYTES)
		throw new Error('The generated frame is empty or exceeds 8 MiB.');
	const existing = await lstat(join(root, path)).catch(error => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (existing)
		throw new Error(
			existing.isSymbolicLink()
				? 'A generated frame cannot replace a linked path.'
				: 'This frame filename already exists. Generate a new filename so saved references stay unchanged.',
		);
	await atomicWrite(root, path, bytes);
	return {path: `/${path}`, bytes: bytes.length};
}

/** Opening a distributed pack makes an independent editable fork, never edits installed media. */
async function forkPackUnlocked(
	archive: string,
	directory: string,
	options: {title?: string; author: string},
): Promise<Workspace> {
	const scratch = await realpath(await mkdtemp(join(tmpdir(), 'hc-authoring-open-')));
	let root: string | undefined;
	let created = false;
	try {
		const available = await statfs(scratch);
		await unpackPackArchive(resolve(archive), scratch, {
			maxUnpackedBytes: Math.max(0, available.bavail * available.bsize - 64 * 1024 ** 2),
		});
		const manifest = packManifestSchema.parse(
			JSON.parse(await readFile(join(scratch, 'manifest.json'), 'utf8')),
		);
		const catalogPaths = new Set([...manifest.games, ...manifest.catalogs]);
		if (
			manifest.files
				.filter(file => catalogPaths.has(file.path))
				.reduce((total, file) => total + file.bytes, 0) > MAX_JSON_BYTES
		)
			throw new Error('The combined authoring catalog exceeds 32 MiB.');
		for (const file of manifest.files) {
			const actual = await describedFile(scratch, file.path);
			if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256)
				throw new Error(`Content pack checksum failed: ${file.path}`);
			if (catalogPaths.has(file.path) && file.bytes > MAX_JSON_BYTES)
				throw new Error('A pack catalog exceeds the JSON limit.');
		}
		const games = await Promise.all(
			manifest.games.map(async path =>
				gameDefinitionSchema.parse(JSON.parse(await readFile(join(scratch, path), 'utf8'))),
			),
		);
		const references = (
			await Promise.all(
				manifest.catalogs.map(async path => {
					const value: unknown = JSON.parse(await readFile(join(scratch, path), 'utf8'));
					return z.array(referenceSchema).parse(value);
				}),
			)
		).flat();
		if (
			manifest.formatVersion === 1 &&
			references.some(reference => reference.source.kind === 'recording')
		)
			throw new Error('Own-recording sources require a format-2 content pack.');
		parseCatalog(references, games);
		const workspace = await createWorkspaceUnlocked(directory, {
			title: options.title ?? (manifest.formatVersion === 2 ? manifest.title : manifest.id),
			author: options.author,
			games,
		});
		root = await workspaceRoot(directory);
		created = true;
		const destinationSpace = await statfs(root);
		if (
			manifest.files.reduce((sum, file) => sum + file.bytes, 0) >
			Math.max(0, destinationSpace.bavail * destinationSpace.bsize - 64 * 1024 ** 2)
		)
			throw new Error('There is not enough free space for this workspace.');
		const identities = new Map(
			references.map(reference => [reference.id, newReferenceId(workspace)]),
		);
		const paths = new Map<string, string>();
		for (const reference of references)
			for (const oldPath of mediaPaths(reference)) {
				if (!/^media\/.+\.(?:mp4|webm|png|jpe?g|webp|avif|vtt)$/i.test(oldPath))
					throw new Error(`Unsupported media asset: ${oldPath}`);
				if (paths.has(oldPath)) continue;
				if (!manifest.files.some(file => file.path === oldPath))
					throw new Error(`A referenced media asset is missing: ${oldPath}`);
				const destination = packPathSchema.parse(
					`media/${workspace.id}/assets/${randomUUID()}${extname(oldPath).toLowerCase()}`,
				);
				await assetParent(root, destination);
				await copyFile(await regularFile(scratch, oldPath), join(root, destination));
				paths.set(oldPath, `/${destination}`);
			}
		const mappedPath = (path: string) => {
			const next = paths.get(path.slice(1));
			if (!next) throw new Error(`A referenced media asset is missing: ${path}`);
			return next;
		};
		workspace.derivedFrom = {id: manifest.id, version: manifest.version};
		workspace.references = references.map(reference => ({
			...reference,
			id: identities.get(reference.id)!,
			revision: 1,
			verification: {
				...reference.verification,
				status: 'draft',
				note: `Forked from ${manifest.id} ${manifest.version}. Review this draft before marking it source-reviewed. Original review note: ${reference.verification.note}`,
			},
			media: {
				...reference.media,
				...(reference.media.clip ? {clip: mappedPath(reference.media.clip)} : {}),
				poster: mappedPath(reference.media.poster),
				...(reference.media.descriptionTrack
					? {descriptionTrack: mappedPath(reference.media.descriptionTrack)}
					: {}),
				frames: reference.media.frames.map(frame => ({...frame, src: mappedPath(frame.src)})),
			},
			relatedIds: reference.relatedIds.map(id => identities.get(id)!).filter(Boolean),
		}));
		return await saveWorkspaceUnlocked(root, workspace);
	} catch (error) {
		// Only undo the tool's newly-created workspace; no pre-existing folder is removed.
		if (created && root) {
			await rm(join(root, 'workspace.json'), {force: true});
			await rm(join(root, 'media'), {recursive: true, force: true});
		}
		throw error;
	} finally {
		await rm(scratch, {recursive: true, force: true});
	}
}

/** SQLite releases this short maintenance lease when its owning tool process exits. */
async function withWorkspaceLease<T>(root: string, action: () => Promise<T>): Promise<T> {
	const path = join(root, '.hc-authoring-lock.sqlite');
	const existing = await lstat(path).catch(error => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (existing && !existing.isFile())
		throw new Error('The workspace maintenance path must be a regular file.');
	const lease = new DatabaseSync(path);
	let entered = false;
	try {
		try {
			lease.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');
			entered = true;
		} catch (error) {
			if (error instanceof Error && /locked|busy/i.test(error.message))
				throw new Error(
					'Another pack tool is editing this workspace. Wait and reload before retrying.',
				);
			throw error;
		}
		return await action();
	} finally {
		try {
			if (entered) lease.exec('ROLLBACK');
		} finally {
			lease.close();
		}
	}
}
export async function createWorkspace(
	directory: string,
	options: {title: string; author: string; games: GameDefinition[]},
): Promise<Workspace> {
	await mkdir(resolve(directory), {recursive: true});
	const root = await workspaceRoot(directory);
	await assertEmptyWorkspace(root);
	return withWorkspaceLease(root, () => createWorkspaceUnlocked(root, options));
}
export async function saveWorkspace(directory: string, value: unknown): Promise<Workspace> {
	const root = await workspaceRoot(directory);
	return withWorkspaceLease(root, () => saveWorkspaceUnlocked(root, value));
}
export async function exportWorkspace(directory: string, output: string) {
	const root = await workspaceRoot(directory);
	return withWorkspaceLease(root, () => exportWorkspaceUnlocked(root, output));
}
export async function addMedia(
	directory: string,
	sourcePath: string,
	referenceId: string,
): Promise<{path: string; bytes: number}> {
	const root = await workspaceRoot(directory);
	return withWorkspaceLease(root, () => addMediaUnlocked(root, sourcePath, referenceId));
}
export async function writeAsset(
	directory: string,
	mediaPath: string,
	base64: string,
): Promise<{path: string; bytes: number}> {
	const root = await workspaceRoot(directory);
	return withWorkspaceLease(root, () => writeAssetUnlocked(root, mediaPath, base64));
}
export async function forkPack(
	archive: string,
	directory: string,
	options: {title?: string; author: string},
): Promise<Workspace> {
	await mkdir(resolve(directory), {recursive: true});
	const root = await workspaceRoot(directory);
	await assertEmptyWorkspace(root);
	return withWorkspaceLease(root, () => forkPackUnlocked(archive, root, options));
}

const commandSchema = z.discriminatedUnion('command', [
	z.strictObject({
		command: z.literal('create'),
		directory: z.string().min(1),
		title: z.string(),
		author: z.string(),
		games: z.array(gameDefinitionSchema),
	}),
	z.strictObject({command: z.literal('read'), directory: z.string().min(1)}),
	z.strictObject({
		command: z.literal('save'),
		directory: z.string().min(1),
		workspace: workspaceSchema,
	}),
	z.strictObject({command: z.literal('validate'), directory: z.string().min(1)}),
	z.strictObject({
		command: z.literal('add-media'),
		directory: z.string().min(1),
		sourcePath: z.string().min(1),
		referenceId: z.string().min(1).max(200),
	}),
	z.strictObject({
		command: z.literal('write-asset'),
		directory: z.string().min(1),
		path: z.string().min(1).max(512),
		base64: z.string().max(Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 4),
	}),
	z.strictObject({
		command: z.literal('export'),
		directory: z.string().min(1),
		output: z.string().min(1),
	}),
	z.strictObject({
		command: z.literal('fork'),
		directory: z.string().min(1),
		archive: z.string().min(1),
		title: z.string().optional(),
		author: z.string().min(1),
	}),
]);
export type AuthoringCommand = z.infer<typeof commandSchema>;
export async function executeAuthoringCommand(value: unknown): Promise<unknown> {
	const command = commandSchema.parse(value);
	if (command.command === 'create') {
		const workspace = await createWorkspace(command.directory, command);
		return {directory: await workspaceRoot(command.directory), workspace};
	}
	if (command.command === 'read')
		return {
			directory: await workspaceRoot(command.directory),
			workspace: await readWorkspace(command.directory),
		};
	if (command.command === 'save')
		return {
			directory: await workspaceRoot(command.directory),
			workspace: await saveWorkspace(command.directory, command.workspace),
		};
	if (command.command === 'validate') return validateWorkspace(command.directory);
	if (command.command === 'add-media')
		return addMedia(command.directory, command.sourcePath, command.referenceId);
	if (command.command === 'write-asset')
		return writeAsset(command.directory, command.path, command.base64);
	if (command.command === 'export') return exportWorkspace(command.directory, command.output);
	const workspace = await forkPack(command.archive, command.directory, command);
	return {directory: await workspaceRoot(command.directory), workspace};
}
