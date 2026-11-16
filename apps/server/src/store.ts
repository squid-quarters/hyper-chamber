import {lstat, mkdir, readdir, rename, rm} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync, backup} from 'node:sqlite';
import {
	legacyLibrarySchema,
	personalEntrySchema,
	practiceSnapshotSchema,
	practicePatchRequestSchema,
	referenceIdSchema,
	storedPersonalEntrySchema,
	type PersonalEntry,
	type PracticeImportResult,
	type PracticeSnapshot,
	type StoredPersonalEntry,
	type LibraryBackupInfo,
} from '@hyper-chamber/reference';

const APPLICATION_ID = 0x48435052;
export interface DatabaseMigration {
	version: number;
	name: string;
	sql: string;
}
export const databaseMigrations: readonly DatabaseMigration[] = [
	{
		version: 1,
		name: 'Personal practice library',
		sql: `
			CREATE TABLE schema_migrations (
				version INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				applied_at TEXT NOT NULL
			) STRICT;
			CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
			CREATE TABLE practice_entries (
				reference_id TEXT PRIMARY KEY,
				saved INTEGER NOT NULL CHECK(saved IN (0, 1)),
				status TEXT NOT NULL CHECK(status IN ('untried', 'practising', 'reliable')),
				note TEXT NOT NULL CHECK(length(note) <= 4000),
				reference_revision INTEGER NOT NULL CHECK(reference_revision > 0),
				row_version INTEGER NOT NULL CHECK(row_version > 0),
				updated_at TEXT NOT NULL
			) STRICT;
			PRAGMA application_id = ${APPLICATION_ID};
		`,
	},
	{
		version: 2,
		name: 'Installed content registry and maintenance revision',
		sql: `
   CREATE TABLE installed_packs (
    id TEXT PRIMARY KEY,
    root TEXT NOT NULL UNIQUE,
    manifest_json TEXT NOT NULL,
    installed_at INTEGER NOT NULL,
    previous_root TEXT,
    previous_manifest_json TEXT,
    previous_installed_at INTEGER
   ) STRICT;
   CREATE TABLE pack_garbage(root TEXT PRIMARY KEY) STRICT;
   INSERT INTO metadata(key,value) VALUES ('packs-initialized','0'),('catalog-generation','0'),('maintenance-revision','0');
  `,
	},
];

function pragmaNumber(db: DatabaseSync, name: 'user_version' | 'application_id'): number {
	const row = db.prepare(`PRAGMA ${name}`).get();
	return Number(row?.[name]);
}

export interface RegistryPack {
	id: string;
	root: string;
	manifestJson: string;
	installedAt: number;
	previousRoot?: string;
	previousManifestJson?: string;
	previousInstalledAt?: number;
}
export interface RegistryBootstrap {
	packs: RegistryPack[];
	garbage?: string[];
}

/** Validate compatibility before any library/catalog mutation. */
export function preflightDatabase(
	db: DatabaseSync,
	migrations: readonly DatabaseMigration[] = databaseMigrations,
): number {
	const versions = migrations.map(migration => migration.version);
	if (versions.some((version, index) => !Number.isSafeInteger(version) || version !== index + 1))
		throw new Error('Database migrations must be ordered, unique and contiguous.');
	const current = pragmaNumber(db, 'user_version');
	const latest = migrations.at(-1)?.version ?? 0;
	if (current > latest)
		throw new Error(
			'This library needs a newer Hyper Chamber version. Its data was left unchanged.',
		);
	const applicationId = pragmaNumber(db, 'application_id');
	const hasTables = !!db
		.prepare(
			"SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
		)
		.get();
	if (applicationId !== APPLICATION_ID && (applicationId !== 0 || current !== 0 || hasTables))
		throw new Error('This database is not a Hyper Chamber library. Its data was left unchanged.');
	return current;
}
function assertLibraryIdentity(db: DatabaseSync): void {
	const id = db.prepare("SELECT value FROM metadata WHERE key='library-id'").get()?.value;
	if (!practiceSnapshotSchema.shape.libraryId.safeParse(id).success)
		throw new Error('The library identity is invalid. Its data was left unchanged.');
}
export async function preflightLibrary(libraryDir: string): Promise<void> {
	const path = join(libraryDir, 'hyper-chamber.sqlite');
	const existing = await lstat(path).catch(error => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (!existing) return;
	if (!existing.isFile()) throw new Error('The library database path is not a file.');
	const db = new DatabaseSync(path, {readOnly: true});
	try {
		const current = preflightDatabase(db);
		if (current > 0) assertLibraryIdentity(db);
	} finally {
		db.close();
	}
}
async function snapshotsDirectory(libraryDir: string): Promise<string> {
	const dir = join(libraryDir, 'snapshots');
	await mkdir(dir).catch(error => {
		if (error.code !== 'EEXIST') throw error;
	});
	if (!(await lstat(dir)).isDirectory())
		throw new Error('The snapshots path must be an ordinary directory.');
	return dir;
}
async function publishSnapshot(db: DatabaseSync, directory: string, name: string): Promise<void> {
	const temporary = join(directory, `.pending-backup-${randomUUID()}.sqlite`);
	try {
		await backup(db, temporary);
		await rename(temporary, join(directory, name));
	} catch (error) {
		try {
			await rm(temporary, {force: true});
		} catch (cleanup) {
			throw new AggregateError(
				[error, cleanup],
				'The snapshot failed and its incomplete temporary copy could not be removed.',
			);
		}
		throw error;
	}
}
function insertRegistry(db: DatabaseSync, packs: readonly RegistryPack[]): void {
	const insert = db.prepare(
		'INSERT INTO installed_packs(id,root,manifest_json,installed_at,previous_root,previous_manifest_json,previous_installed_at) VALUES (?,?,?,?,?,?,?)',
	);
	for (const pack of packs)
		insert.run(
			pack.id,
			pack.root,
			pack.manifestJson,
			pack.installedAt,
			pack.previousRoot ?? null,
			pack.previousManifestJson ?? null,
			pack.previousInstalledAt ?? null,
		);
}
/** A consistent snapshot precedes an upgrade; SQL and the validated registry backfill commit together. */
export async function migrateDatabase(
	db: DatabaseSync,
	libraryDir: string,
	migrations: readonly DatabaseMigration[] = databaseMigrations,
	bootstrap?: RegistryBootstrap,
): Promise<void> {
	const current = preflightDatabase(db, migrations);
	const latest = migrations.at(-1)?.version ?? 0;
	if (current === latest && !bootstrap) return;
	if (current > 0 && current !== latest) {
		const dir = await snapshotsDirectory(libraryDir);
		await publishSnapshot(db, dir, `before-schema-${current}-${Date.now()}-${randomUUID()}.sqlite`);
	}
	db.exec('BEGIN IMMEDIATE');
	try {
		for (const migration of migrations) {
			if (migration.version <= current) continue;
			db.exec(migration.sql);
			db.prepare('INSERT INTO schema_migrations(version,name,applied_at) VALUES (?,?,?)').run(
				migration.version,
				migration.name,
				new Date().toISOString(),
			);
			db.exec(`PRAGMA user_version = ${migration.version}`);
		}
		if (bootstrap) {
			insertRegistry(db, bootstrap.packs);
			for (const root of bootstrap.garbage ?? [])
				db.prepare('INSERT OR IGNORE INTO pack_garbage(root) VALUES (?)').run(root);
			db.prepare(
				"UPDATE metadata SET value='1' WHERE key IN ('packs-initialized','catalog-generation')",
			).run();
		}
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
}

/** A separate SQLite OS lock has no pack authority and is automatically released on process death. */
export async function acquireLibraryOwnership(libraryDir: string): Promise<() => void> {
	await preflightLibrary(libraryDir);
	await mkdir(libraryDir, {recursive: true});
	const path = join(libraryDir, '.host-lock.sqlite');
	const existing = await lstat(path).catch(error => {
		if (error.code === 'ENOENT') return null;
		throw error;
	});
	if (existing && !existing.isFile())
		throw new Error('The library ownership path must be a regular file.');
	const db = new DatabaseSync(path);
	try {
		db.exec(
			'PRAGMA busy_timeout=0; CREATE TABLE IF NOT EXISTS ownership(id INTEGER); BEGIN EXCLUSIVE',
		);
	} catch (error) {
		db.close();
		if (error instanceof Error && /locked|busy/i.test(error.message))
			throw new Error(
				'This library is already open in another Hyper Chamber host. Quit that host before opening it here.',
			);
		throw error;
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		try {
			db.exec('ROLLBACK');
		} finally {
			db.close();
		}
	};
}

export class PracticeConflict extends Error {
	constructor(readonly entry: StoredPersonalEntry) {
		super('This reference was edited elsewhere. Your draft has been kept; review the newer value.');
		this.name = 'PracticeConflict';
	}
}

type Row = Record<string, unknown>;
function readEntry(row: Row): StoredPersonalEntry {
	return storedPersonalEntrySchema.parse({
		saved: row.saved === 1,
		status: row.status,
		note: row.note,
		revision: row.reference_revision,
		rowVersion: row.row_version,
		updatedAt: row.updated_at,
	});
}
function sameEntry(left: PersonalEntry, right: PersonalEntry): boolean {
	return (
		left.saved === right.saved &&
		left.status === right.status &&
		left.note === right.note &&
		left.revision === right.revision
	);
}

export class PracticeStore {
	private closed = false;
	private cachedMaintenanceRevision = 0;
	private cachedCatalogGeneration = 0;
	private constructor(
		private readonly db: DatabaseSync,
		readonly libraryDir: string,
		readonly libraryId: string,
	) {}

	static async open(
		libraryDir: string,
		options: {bootstrap?: () => Promise<RegistryBootstrap>} = {},
	): Promise<PracticeStore> {
		await mkdir(libraryDir, {recursive: true});
		const dbPath = join(libraryDir, 'hyper-chamber.sqlite');
		const existing = await lstat(dbPath).catch(error => {
			if (error.code === 'ENOENT') return null;
			throw error;
		});
		if (existing && !existing.isFile()) throw new Error('The library database path is not a file.');
		const db = new DatabaseSync(dbPath);
		try {
			const current = preflightDatabase(db);
			if (current > 0) assertLibraryIdentity(db);
			const initialized =
				current >= 2 &&
				db.prepare("SELECT value FROM metadata WHERE key='packs-initialized'").get()?.value === '1';
			const bootstrap = !initialized && options.bootstrap ? await options.bootstrap() : undefined;
			await migrateDatabase(db, libraryDir, databaseMigrations, bootstrap);
			db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA busy_timeout = 5000;');
			db.prepare("INSERT OR IGNORE INTO metadata(key, value) VALUES ('library-id', ?)").run(
				randomUUID(),
			);
			const libraryId = db
				.prepare("SELECT value FROM metadata WHERE key = 'library-id'")
				.get()?.value;
			if (!practiceSnapshotSchema.shape.libraryId.safeParse(libraryId).success) {
				throw new Error('The library identity is invalid. Its data was left unchanged.');
			}
			return new PracticeStore(db, libraryDir, String(libraryId));
		} catch (error) {
			db.close();
			throw error;
		}
	}

	private defaultEntry(revision: number): StoredPersonalEntry {
		return {
			saved: false,
			status: 'untried',
			note: '',
			revision,
			rowVersion: 0,
			updatedAt: '1970-01-01T00:00:00.000Z',
		};
	}

	entry(id: string, revision = 1): StoredPersonalEntry {
		referenceIdSchema.parse(id);
		const row = this.db.prepare('SELECT * FROM practice_entries WHERE reference_id = ?').get(id);
		return row ? readEntry(row) : this.defaultEntry(revision);
	}

	snapshot(): PracticeSnapshot {
		const entries: Record<string, StoredPersonalEntry> = {};
		for (const row of this.db
			.prepare('SELECT * FROM practice_entries ORDER BY reference_id')
			.all()) {
			const id = referenceIdSchema.parse(row.reference_id);
			entries[id] = readEntry(row);
		}
		return {libraryId: this.libraryId, maintenanceRevision: this.maintenanceRevision, entries};
	}

	patch(id: string, value: unknown, referenceRevision = 1): StoredPersonalEntry {
		referenceIdSchema.parse(id);
		const {patch, expectedVersion} = practicePatchRequestSchema.parse(value);
		this.db.exec('BEGIN IMMEDIATE');
		try {
			const current = this.entry(id, referenceRevision);
			if (current.rowVersion !== expectedVersion) throw new PracticeConflict(current);
			const next = personalEntrySchema.parse({
				saved: current.saved,
				status: current.status,
				note: current.note,
				revision: current.revision,
				...patch,
			});
			const entry: StoredPersonalEntry = {
				...next,
				rowVersion: current.rowVersion + 1,
				updatedAt: new Date().toISOString(),
			};
			this.db
				.prepare(
					`INSERT INTO practice_entries(reference_id, saved, status, note, reference_revision, row_version, updated_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT(reference_id) DO UPDATE SET saved=excluded.saved, status=excluded.status,
					 note=excluded.note, reference_revision=excluded.reference_revision,
					 row_version=excluded.row_version, updated_at=excluded.updated_at`,
				)
				.run(
					id,
					Number(entry.saved),
					entry.status,
					entry.note,
					entry.revision,
					entry.rowVersion,
					entry.updatedAt,
				);
			this.db.exec('COMMIT');
			return entry;
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
	}

	importLegacy(value: unknown): PracticeImportResult {
		const {entries} = legacyLibrarySchema.parse(value);
		const result: PracticeImportResult = {imported: 0, unchanged: 0, conflicts: []};
		this.db.exec('BEGIN IMMEDIATE');
		try {
			for (const [id, entry] of Object.entries(entries)) {
				const current = this.entry(id, entry.revision);
				if (current.rowVersion > 0) {
					if (sameEntry(current, entry)) result.unchanged++;
					else result.conflicts.push(id);
					continue;
				}
				this.db
					.prepare(
						`INSERT INTO practice_entries(reference_id, saved, status, note, reference_revision, row_version, updated_at)
						 VALUES (?, ?, ?, ?, ?, 1, ?)`,
					)
					.run(
						id,
						Number(entry.saved),
						entry.status,
						entry.note,
						entry.revision,
						new Date().toISOString(),
					);
				result.imported++;
			}
			this.db.exec('COMMIT');
			return result;
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
	}

	get maintenanceRevision(): number {
		if (this.closed) return this.cachedMaintenanceRevision;
		return Number(
			this.db.prepare("SELECT value FROM metadata WHERE key='maintenance-revision'").get()?.value ??
				0,
		);
	}
	get catalogGeneration(): number {
		if (this.closed) return this.cachedCatalogGeneration;
		return Number(
			this.db.prepare("SELECT value FROM metadata WHERE key='catalog-generation'").get()?.value ??
				0,
		);
	}
	registry(): RegistryPack[] {
		return this.db
			.prepare('SELECT * FROM installed_packs ORDER BY installed_at,id')
			.all()
			.map(row => ({
				id: String(row.id),
				root: String(row.root),
				manifestJson: String(row.manifest_json),
				installedAt: Number(row.installed_at),
				...(row.previous_root
					? {
							previousRoot: String(row.previous_root),
							previousManifestJson: String(row.previous_manifest_json),
							previousInstalledAt: Number(row.previous_installed_at),
						}
					: {}),
			}));
	}
	replaceRegistry(packs: readonly RegistryPack[], expectedGeneration: number): number {
		this.db.exec('BEGIN IMMEDIATE');
		try {
			if (this.catalogGeneration !== expectedGeneration)
				throw new Error('Installed content changed. Review this operation again.');
			const retained = new Set(
				packs.flatMap(pack => [pack.root, ...(pack.previousRoot ? [pack.previousRoot] : [])]),
			);
			for (const pack of this.registry())
				for (const root of [pack.root, pack.previousRoot])
					if (root && !retained.has(root))
						this.db.prepare('INSERT OR IGNORE INTO pack_garbage(root) VALUES (?)').run(root);
			this.db.exec('DELETE FROM installed_packs');
			insertRegistry(this.db, packs);
			const next = expectedGeneration + 1;
			this.db
				.prepare("UPDATE metadata SET value=? WHERE key='catalog-generation'")
				.run(String(next));
			this.db.exec('COMMIT');
			return next;
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
	}
	garbageRoots(): string[] {
		return this.db
			.prepare('SELECT root FROM pack_garbage')
			.all()
			.map(row => String(row.root));
	}
	forgetGarbage(root: string): void {
		this.db.prepare('DELETE FROM pack_garbage WHERE root=?').run(root);
	}
	async listBackups(): Promise<LibraryBackupInfo[]> {
		const dir = await snapshotsDirectory(this.libraryDir);
		const result: LibraryBackupInfo[] = [];
		for (const file of await readdir(dir)) {
			if (!/^(?:library-|before-schema-)[a-zA-Z0-9-]+\.sqlite$/.test(file)) continue;
			const info = await lstat(join(dir, file));
			if (info.isFile())
				result.push({
					file,
					createdAt: info.mtime.toISOString(),
					bytes: info.size,
					migration: file.startsWith('before-schema-'),
				});
		}
		return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}
	async snapshotBackup(): Promise<string> {
		const dir = await snapshotsDirectory(this.libraryDir);
		const name = `library-${Date.now()}-${randomUUID()}.sqlite`;
		await publishSnapshot(this.db, dir, name);
		return name;
	}
	async restoreNotes(
		file: string,
		expectedMaintenanceRevision: number,
	): Promise<{restored: number; maintenanceRevision: number}> {
		if (expectedMaintenanceRevision !== this.maintenanceRevision)
			throw new Error('The library was restored elsewhere. Reload before continuing.');
		if (basename(file) !== file || !/^(?:library-|before-schema-)[a-zA-Z0-9-]+\.sqlite$/.test(file))
			throw new Error('Choose an existing library snapshot.');
		const path = join(await snapshotsDirectory(this.libraryDir), file);
		const info = await lstat(path);
		if (!info.isFile() || info.size > 512 * 1024 ** 2)
			throw new Error('Choose a regular library snapshot under 512 MiB.');
		const source = new DatabaseSync(path, {readOnly: true});
		let entries: [string, StoredPersonalEntry][];
		try {
			preflightDatabase(source);
			if (
				source.prepare("SELECT value FROM metadata WHERE key='library-id'").get()?.value !==
				this.libraryId
			)
				throw new Error('This snapshot belongs to a different library.');
			const rows = source.prepare('SELECT * FROM practice_entries').all();
			if (rows.length > 100000) throw new Error('The snapshot contains too many personal entries.');
			entries = rows.map(row => [referenceIdSchema.parse(row.reference_id), readEntry(row)]);
		} finally {
			source.close();
		}
		await this.snapshotBackup();
		this.db.exec('BEGIN IMMEDIATE');
		try {
			if (expectedMaintenanceRevision !== this.maintenanceRevision)
				throw new Error('The library changed before restoration. Review the snapshot again.');
			const current = new Map(
				this.db
					.prepare('SELECT reference_id,row_version FROM practice_entries')
					.all()
					.map(row => [String(row.reference_id), Number(row.row_version)]),
			);
			this.db.exec('DELETE FROM practice_entries');
			const insert = this.db.prepare(
				'INSERT INTO practice_entries(reference_id,saved,status,note,reference_revision,row_version,updated_at) VALUES (?,?,?,?,?,?,?)',
			);
			for (const [id, entry] of entries)
				insert.run(
					id,
					Number(entry.saved),
					entry.status,
					entry.note,
					entry.revision,
					Math.max(current.get(id) ?? 0, entry.rowVersion) + 1,
					new Date().toISOString(),
				);
			const revision = expectedMaintenanceRevision + 1;
			this.db
				.prepare("UPDATE metadata SET value=? WHERE key='maintenance-revision'")
				.run(String(revision));
			this.db.exec('COMMIT');
			return {restored: entries.length, maintenanceRevision: revision};
		} catch (error) {
			this.db.exec('ROLLBACK');
			throw error;
		}
	}

	close(): void {
		if (this.closed) return;
		this.cachedMaintenanceRevision = this.maintenanceRevision;
		this.cachedCatalogGeneration = this.catalogGeneration;
		this.closed = true;
		this.db.close();
	}
}
