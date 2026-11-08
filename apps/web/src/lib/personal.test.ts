import {afterEach, describe, expect, it, vi} from 'vitest';
import type {PersonalLibrary, Reference} from '@hyper-chamber/reference';
import {
	blankEntry,
	createBackup,
	loadLibrary,
	mergePending,
	parseBackup,
	persistChanges,
	saveLibrary,
	STORAGE_KEY,
} from './personal';

const library: PersonalLibrary = {
	'yoga-test': {
		saved: true,
		status: 'practising',
		note: 'Check spacing.\nPractice both sides 🦑',
		revision: 2,
	},
};

function memoryStorage(initial: string | null = null) {
	let stored = initial;
	return {
		getItem: vi.fn((_key: string) => stored),
		setItem: vi.fn((_key: string, value: string) => {
			stored = value;
		}),
	};
}

afterEach(() => vi.unstubAllGlobals());

describe('personal backups', () => {
	it('round trips saved state, progress, multiline notes and content revision', () => {
		expect(parseBackup(createBackup(library))).toEqual(library);
		expect(JSON.parse(createBackup(library))).toEqual({version: 1, entries: library});
	});

	it('keeps unknown reference IDs so importing an older catalog loses no progress', () => {
		expect(parseBackup(createBackup(library))['yoga-test']).toEqual(library['yoga-test']);
	});

	it('rejects malformed JSON with a useful error', () => {
		expect(() => parseBackup('{broken')).toThrow(/not valid JSON/);
	});

	it.each([0, 2, '1', null])('rejects unsupported version %j', version => {
		expect(() => parseBackup(JSON.stringify({version, entries: {}}))).toThrow(
			/Unsupported backup version/,
		);
	});

	it.each([null, [], {}, {version: 1, entries: []}, {version: 1, entries: {}, extra: true}])(
		'rejects an invalid envelope %j',
		value => {
			expect(() => parseBackup(JSON.stringify(value))).toThrow(/Invalid backup|Unsupported backup/);
		},
	);

	it.each(['../private', 'Yoga Test', '__proto__', 'two--dashes', ''])(
		'rejects unsafe ID %j',
		id => {
			const entries = Object.fromEntries([[id, library['yoga-test']]]);
			expect(() => parseBackup(JSON.stringify({version: 1, entries}))).toThrow(/Invalid backup/);
		},
	);

	it.each([
		{saved: 'yes'},
		{status: 'mastered'},
		{note: 'x'.repeat(4001)},
		{revision: 0},
		{revision: -1},
		{revision: 1.5},
		{extra: 'unexpected'},
	])('rejects invalid entry fields %j', patch => {
		const entries = {'yoga-test': {...library['yoga-test'], ...patch}};
		expect(() => parseBackup(JSON.stringify({version: 1, entries}))).toThrow(/entries.yoga-test/);
	});

	it('accepts the exact note limit and every supported status', () => {
		for (const status of ['untried', 'practising', 'reliable'] as const) {
			const entries: PersonalLibrary = {
				test: {saved: false, status, note: 'x'.repeat(4000), revision: 1},
			};
			expect(parseBackup(createBackup(entries))).toEqual(entries);
		}
	});

	it('returns independent data when parsing and creating blank entries', () => {
		const imported = parseBackup(createBackup(library));
		imported['yoga-test'].note = 'Changed';
		expect(library['yoga-test'].note).toContain('Check spacing');
		const reference = {revision: 3} as Reference;
		const first = blankEntry(reference);
		first.note = 'Changed';
		expect(blankEntry(reference)).toEqual({saved: false, status: 'untried', note: '', revision: 3});
	});
});

describe('merging edits from multiple tabs', () => {
	it('keeps another tab’s note on a different reference when saving a stale tab', () => {
		const storage = memoryStorage(createBackup(library));
		const staleTab = loadLibrary(storage).library;
		const latest: PersonalLibrary = {
			...library,
			'other-reference': {...library['yoga-test'], note: 'Written in another tab'},
		};
		saveLibrary(latest, storage);
		const result = persistChanges(staleTab, {'yoga-test': {saved: false}}, storage);
		expect(result.error).toBeNull();
		expect(result.pending).toEqual({});
		expect(loadLibrary(storage).library).toEqual({
			...latest,
			'yoga-test': {...latest['yoga-test'], saved: false},
		});
	});

	it('updates only the edited field on a reference changed in another tab', () => {
		const storage = memoryStorage(createBackup(library));
		const staleTab = loadLibrary(storage).library;
		saveLibrary(
			{'yoga-test': {...library['yoga-test'], note: 'New note from another tab'}},
			storage,
		);
		const result = persistChanges(staleTab, {'yoga-test': {status: 'reliable'}}, storage);
		expect(result.library['yoga-test']).toEqual({
			...library['yoga-test'],
			note: 'New note from another tab',
			status: 'reliable',
		});
		expect(loadLibrary(storage).library).toEqual(result.library);
	});

	it('uses current defaults for a newly edited entry while retaining all latest entries', () => {
		const latest = library;
		const current = {
			'new-reference': {saved: false, status: 'untried' as const, note: '', revision: 4},
		};
		const pending = {'new-reference': {note: 'First note'}};
		const merged = mergePending(latest, current, pending);
		expect(merged).toEqual({
			...latest,
			'new-reference': {...current['new-reference'], note: 'First note'},
		});
		expect(current['new-reference'].note).toBe('');
		expect(latest).toEqual(library);
	});

	it('reapplies pending local fields to storage events without resurrecting stale entries', () => {
		const current = {
			...library,
			'removed-reference': {...library['yoga-test'], note: 'Stale entry'},
		};
		const latest = {'yoga-test': {...library['yoga-test'], status: 'reliable' as const}};
		expect(mergePending(latest, current, {'yoga-test': {note: 'Unsaved local note'}})).toEqual({
			'yoga-test': {...latest['yoga-test'], note: 'Unsaved local note'},
		});
	});

	it('retries pending fields after quota failure against the newest stored data', () => {
		const storage = memoryStorage(createBackup(library));
		const write = storage.setItem.getMockImplementation()!;
		storage.setItem.mockImplementationOnce(() => {
			throw new Error('QuotaExceededError');
		});
		const pending = {'yoga-test': {note: 'Keep this unsaved note'}};
		const failed = persistChanges(library, pending, storage);
		expect(failed.error).toMatch(/Export a backup/);
		expect(failed.pending).toEqual(pending);
		expect(failed.library['yoga-test'].note).toBe('Keep this unsaved note');
		expect(loadLibrary(storage).library).toEqual(library);
		write(STORAGE_KEY, createBackup({'yoga-test': {...library['yoga-test'], saved: false}}));
		const retried = persistChanges(failed.library, failed.pending, storage);
		expect(retried.error).toBeNull();
		expect(retried.pending).toEqual({});
		expect(loadLibrary(storage).library['yoga-test']).toEqual({
			...library['yoga-test'],
			saved: false,
			note: 'Keep this unsaved note',
		});
	});

	it.each(['{broken', JSON.stringify({version: 9, entries: {}})])(
		'refuses to overwrite an unreadable backup and retains local edits for export',
		raw => {
			const storage = memoryStorage(raw);
			const pending = {'yoga-test': {note: 'In-memory note'}};
			const result = persistChanges(library, pending, storage);
			expect(result.error).toContain('left unchanged');
			expect(result.library['yoga-test'].note).toBe('In-memory note');
			expect(result.pending).toEqual(pending);
			expect(storage.setItem).not.toHaveBeenCalled();
			expect(storage.getItem(STORAGE_KEY)).toBe(raw);
		},
	);

	it('does not write when reading storage is blocked', () => {
		const storage = {
			getItem: vi.fn(() => {
				throw new Error('SecurityError');
			}),
			setItem: vi.fn(),
		};
		const pending = {'yoga-test': {saved: false}};
		const result = persistChanges(library, pending, storage);
		expect(result.error).toMatch(/blocked or unavailable/);
		expect(result.library['yoga-test'].saved).toBe(false);
		expect(result.pending).toEqual(pending);
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it('merges full imported entries into fresh storage without discarding unrelated progress', () => {
		const storage = memoryStorage(createBackup({'other-reference': library['yoga-test']}));
		const imported = {'yoga-test': {...library['yoga-test'], note: 'Imported note'}};
		const result = persistChanges({}, imported, storage);
		expect(result.error).toBeNull();
		expect(loadLibrary(storage).library).toEqual({
			'other-reference': library['yoga-test'],
			...imported,
		});
	});

	it('reads fresh state without writing when there are no pending edits', () => {
		const storage = memoryStorage(createBackup(library));
		expect(persistChanges({}, {}, storage)).toEqual({library, pending: {}, error: null});
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it('retains pending edits when browser storage is unavailable during SSR', () => {
		vi.stubGlobal('window', undefined);
		const pending = {'yoga-test': {note: 'Keep in memory'}};
		const result = persistChanges(library, pending);
		expect(result.library['yoga-test'].note).toBe('Keep in memory');
		expect(result.pending).toEqual(pending);
		expect(result.error).toMatch(/blocked or unavailable/);
	});

	it('handles the browser storage getter throwing before any read or write', () => {
		vi.stubGlobal(
			'window',
			Object.defineProperty({}, 'localStorage', {
				get() {
					throw new Error('SecurityError');
				},
			}),
		);
		const pending = {'yoga-test': {status: 'reliable' as const}};
		const result = persistChanges(library, pending);
		expect(result.library['yoga-test'].status).toBe('reliable');
		expect(result.pending).toEqual(pending);
		expect(result.error).toMatch(/blocked or unavailable/);
	});

	it('does not save invalid pending state or discard its recovery information', () => {
		const storage = memoryStorage(createBackup(library));
		const pending = {'yoga-test': {note: 'x'.repeat(4001)}};
		const result = persistChanges(library, pending, storage);
		expect(result.error).toMatch(/could not be saved/);
		expect(result.library).toEqual(library);
		expect(result.pending).toEqual(pending);
		expect(storage.setItem).not.toHaveBeenCalled();
	});
});

describe('browser persistence', () => {
	it('loads an empty library without writing', () => {
		const storage = memoryStorage();
		expect(loadLibrary(storage)).toEqual({library: {}, error: null});
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it('persists and reloads the versioned backup under a single key', () => {
		const storage = memoryStorage();
		expect(saveLibrary(library, storage)).toBeNull();
		expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, createBackup(library));
		expect(loadLibrary(storage)).toEqual({library, error: null});
	});

	it.each(['{corrupt', JSON.stringify({version: 99, entries: {}})])(
		'leaves unreadable storage untouched and reports recovery information',
		value => {
			const storage = memoryStorage(value);
			const result = loadLibrary(storage);
			expect(result.library).toEqual({});
			expect(result.error).toContain('left unchanged');
			expect(storage.setItem).not.toHaveBeenCalled();
			expect(storage.getItem(STORAGE_KEY)).toBe(value);
		},
	);

	it('does not partially import or replace a stored backup containing __proto__', () => {
		const entries = Object.fromEntries([
			['yoga-test', library['yoga-test']],
			['__proto__', library['yoga-test']],
		]);
		const text = JSON.stringify({version: 1, entries});
		const storage = memoryStorage(text);
		expect(() => parseBackup(text)).toThrow(/entries.__proto__/);
		expect(() => createBackup(entries)).toThrow(/entries.__proto__/);
		expect(loadLibrary(storage)).toEqual({
			library: {},
			error: expect.stringContaining('left unchanged'),
		});
		expect(storage.setItem).not.toHaveBeenCalled();
		expect(storage.getItem(STORAGE_KEY)).toBe(text);
	});

	it('handles blocked storage access and quota errors without mutating in-memory progress', () => {
		const original = createBackup(library);
		const storage = {
			getItem: vi.fn(() => {
				throw new Error('SecurityError');
			}),
			setItem: vi.fn(() => {
				throw new Error('QuotaExceededError');
			}),
		};
		expect(loadLibrary(storage).error).toMatch(/blocked or unavailable/);
		expect(saveLibrary(library, storage)).toMatch(/Export a backup/);
		expect(createBackup(library)).toBe(original);
	});

	it('handles a blocked localStorage getter', () => {
		vi.stubGlobal(
			'window',
			Object.defineProperty({}, 'localStorage', {
				get() {
					throw new Error('SecurityError');
				},
			}),
		);
		expect(loadLibrary().error).toMatch(/blocked or unavailable/);
		expect(saveLibrary(library)).toMatch(/Export a backup/);
	});

	it('is safe during server rendering and when storage is unavailable', () => {
		vi.stubGlobal('window', undefined);
		expect(loadLibrary()).toEqual({library: {}, error: null});
		expect(saveLibrary(library)).toMatch(/Export a backup/);
		expect(loadLibrary(null).error).toMatch(/unavailable/);
		expect(saveLibrary(library, null)).toMatch(/Export a backup/);
	});

	it('does not write invalid state', () => {
		const storage = memoryStorage('keep this');
		const invalid: PersonalLibrary = {
			test: {saved: true, status: 'untried', note: '', revision: 0},
		};
		expect(saveLibrary(invalid, storage)).toMatch(/could not be saved/);
		expect(storage.setItem).not.toHaveBeenCalled();
		expect(storage.getItem(STORAGE_KEY)).toBe('keep this');
	});
});
