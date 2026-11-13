import {lstat, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
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
];

function pragmaNumber(db: DatabaseSync, name: 'user_version' | 'application_id'): number {
	const row = db.prepare(`PRAGMA ${name}`).get();
	return Number(row?.[name]);
}

/** A snapshot is made before an existing supported schema is upgraded. */
export async function migrateDatabase(
	db: DatabaseSync,
	libraryDir: string,
	migrations: readonly DatabaseMigration[] = databaseMigrations,
): Promise<void> {
	const current = pragmaNumber(db, 'user_version');
	const latest = migrations.at(-1)?.version ?? 0;
	if (current > latest) {
		throw new Error(
			'This library needs a newer Hyper Chamber version. Its data was left unchanged.',
		);
	}
	const applicationId = pragmaNumber(db, 'application_id');
	const hasTables = !!db
		.prepare(
			"SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' LIMIT 1",
		)
		.get();
	if (applicationId !== APPLICATION_ID && (applicationId !== 0 || current !== 0 || hasTables)) {
		throw new Error('This database is not a Hyper Chamber library. Its data was left unchanged.');
	}
	if (current === latest) return;
	if (current > 0) {
		const snapshots = join(libraryDir, 'snapshots');
		await mkdir(snapshots, {recursive: true});
		await backup(
			db,
			join(snapshots, `before-schema-${current}-${Date.now()}-${randomUUID()}.sqlite`),
		);
	}
	db.exec('BEGIN IMMEDIATE');
	try {
		for (const migration of migrations) {
			if (migration.version <= current) continue;
			db.exec(migration.sql);
			db.prepare('INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(
				migration.version,
				migration.name,
				new Date().toISOString(),
			);
			db.exec(`PRAGMA user_version = ${migration.version}`);
		}
		db.exec('COMMIT');
	} catch (error) {
		db.exec('ROLLBACK');
		throw error;
	}
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
	private constructor(
		private readonly db: DatabaseSync,
		readonly libraryDir: string,
		readonly libraryId: string,
	) {}

	static async open(libraryDir: string): Promise<PracticeStore> {
		await mkdir(libraryDir, {recursive: true});
		const dbPath = join(libraryDir, 'hyper-chamber.sqlite');
		const existing = await lstat(dbPath).catch(error => {
			if (error.code === 'ENOENT') return null;
			throw error;
		});
		if (existing && !existing.isFile()) throw new Error('The library database path is not a file.');
		const db = new DatabaseSync(dbPath);
		try {
			await migrateDatabase(db, libraryDir);
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
		return {libraryId: this.libraryId, entries};
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

	async snapshotBackup(): Promise<string> {
		const dir = join(this.libraryDir, 'snapshots');
		await mkdir(dir, {recursive: true});
		const name = `library-${Date.now()}-${randomUUID()}.sqlite`;
		await backup(this.db, join(dir, name));
		return name;
	}

	close(): void {
		if (this.closed) return;
		this.closed = true;
		this.db.close();
	}
}
