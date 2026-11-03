import {z} from 'zod';
import type {PersonalEntry, PersonalLibrary, Reference} from '@hyper-chamber/reference';

export const STORAGE_KEY = 'hyper-chamber.personal-library.v1';
const referenceIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entrySchema = z.strictObject({
	saved: z.boolean(),
	status: z.enum(['untried', 'practising', 'reliable']),
	note: z.string().max(4000, 'Notes must contain at most 4,000 characters'),
	revision: z.number().int().positive(),
});

const backupSchema = z.strictObject({
	version: z.literal(1),
	entries: z.preprocess(
		(value, context) => {
			// Record parsers may skip __proto__. Check raw own keys before parsing so
			// an invalid imported ID cannot disappear silently from the backup.
			if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
				for (const id of Object.keys(value)) {
					if (!referenceIdPattern.test(id)) {
						context.addIssue({
							code: 'custom',
							path: [id],
							message: 'Reference IDs must be lowercase slugs',
						});
					}
				}
			}
			return value;
		},
		z.record(
			z.string().regex(referenceIdPattern, 'Reference IDs must be lowercase slugs'),
			entrySchema,
		),
	),
});

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;
type LoadResult = {library: PersonalLibrary; error: string | null};
export type LibraryPatches = Record<string, Partial<PersonalEntry>>;
type PersistResult = {
	library: PersonalLibrary;
	pending: LibraryPatches;
	error: string | null;
};

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'An unexpected storage error occurred.';
}

function validateBackup(value: unknown): PersonalLibrary {
	const result = backupSchema.safeParse(value);
	if (result.success) return result.data.entries;
	const issue = result.error.issues[0];
	const path = issue.path.length ? issue.path.join('.') : 'backup';
	if (issue.path[0] === 'version') {
		throw new Error('Unsupported backup version. Choose a Hyper Chamber version 1 backup.');
	}
	throw new Error(`Invalid backup at ${path}: ${issue.message}.`);
}

/** Reads a backup without changing browser storage or the supplied text. */
export function parseBackup(text: string): PersonalLibrary {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		throw new Error('This file is not valid JSON. Choose a Hyper Chamber JSON backup.');
	}
	return validateBackup(value);
}

/** Validates before exporting so a backup can always be imported again. */
export function createBackup(library: PersonalLibrary): string {
	const entries = validateBackup({version: 1, entries: library});
	return JSON.stringify({version: 1, entries}, null, 2);
}

export function blankEntry(reference: Reference): PersonalEntry {
	return {saved: false, status: 'untried', note: '', revision: reference.revision};
}

/** Loading never writes: unreadable or corrupt data stays available for recovery. */
export function loadLibrary(storage?: ReadableStorage | null): LoadResult {
	if (storage === undefined && typeof window === 'undefined') {
		return {library: {}, error: null};
	}
	let text: string | null;
	try {
		const target = storage === undefined ? window.localStorage : storage;
		if (!target) throw new Error('Browser storage is unavailable');
		text = target.getItem(STORAGE_KEY);
	} catch {
		return {
			library: {},
			error:
				'Browser storage is blocked or unavailable. Export a backup to keep any practice changes from this session.',
		};
	}
	if (text === null) return {library: {}, error: null};
	try {
		return {library: parseBackup(text), error: null};
	} catch (error) {
		return {
			library: {},
			error: `Saved practice data could not be loaded. The stored data has been left unchanged. ${errorMessage(error)}`,
		};
	}
}

/** Call only for an explicit edit or import; failure leaves the caller's data intact. */
export function saveLibrary(
	library: PersonalLibrary,
	storage?: WritableStorage | null,
): string | null {
	let text: string;
	try {
		text = createBackup(library);
	} catch (error) {
		return `Practice data could not be saved. ${errorMessage(error)}`;
	}
	try {
		const target =
			storage === undefined && typeof window !== 'undefined' ? window.localStorage : storage;
		if (!target) throw new Error('Browser storage is unavailable');
		target.setItem(STORAGE_KEY, text);
		return null;
	} catch {
		return 'Practice changes are still available in this session, but browser storage could not save them. Export a backup before closing the page.';
	}
}

/** Rebase explicit local fields onto the newest library, without mutating either input. */
export function mergePending(
	latest: PersonalLibrary,
	current: PersonalLibrary,
	pending: LibraryPatches,
): PersonalLibrary {
	const merged = {...latest};
	for (const [id, patch] of Object.entries(pending)) {
		if (!referenceIdPattern.test(id)) {
			throw new Error('Pending reference IDs must be lowercase slugs.');
		}
		// New references get their defaults from the caller's current entry. Full
		// imported entries need no fallback; existing persisted fields stay newest.
		merged[id] = entrySchema.parse({...(latest[id] ?? current[id]), ...patch});
	}
	return merged;
}

/** Read before saving so a stale tab only replaces fields the learner actually edited. */
export function persistChanges(
	current: PersonalLibrary,
	pending: LibraryPatches,
	storage?: (ReadableStorage & WritableStorage) | null,
): PersistResult {
	let inMemory: PersonalLibrary;
	try {
		inMemory = mergePending(current, current, pending);
	} catch (error) {
		return {
			library: current,
			pending,
			error: `Practice changes could not be saved. ${errorMessage(error)}`,
		};
	}
	// loadLibrary is intentionally quiet during SSR, but a save cannot succeed there.
	const loaded = loadLibrary(
		storage === undefined && typeof window === 'undefined' ? null : storage,
	);
	if (loaded.error) return {library: inMemory, pending, error: loaded.error};
	let merged: PersonalLibrary;
	try {
		merged = mergePending(loaded.library, current, pending);
	} catch (error) {
		return {
			library: inMemory,
			pending,
			error: `Practice changes could not be saved. ${errorMessage(error)}`,
		};
	}
	if (Object.keys(pending).length === 0) return {library: merged, pending: {}, error: null};
	const error = saveLibrary(merged, storage);
	return {library: merged, pending: error ? pending : {}, error};
}
