import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
	practicePatchRequestSchema,
	type PersonalEntry,
	type StoredPersonalEntry,
} from '@hyper-chamber/reference';
import {PracticeClient} from './practice-client';
import {STORAGE_KEY} from './personal';

const LIBRARY_A = '00000000-0000-4000-8000-000000000001';
const LIBRARY_B = '00000000-0000-4000-8000-000000000002';
const reference = {id: 'ryu-corner-light', revision: 3};
const otherReference = {id: 'dhalsim-unknown-route', revision: 1};
const original: PersonalEntry = {
	saved: false,
	status: 'practising',
	note: 'Check spacing.\nPractise both sides 🦑',
	revision: 2,
};
const clients: PracticeClient[] = [];

function row(patch: Partial<StoredPersonalEntry> = {}): StoredPersonalEntry {
	return {
		...original,
		rowVersion: 3,
		updatedAt: '2026-11-13T08:00:00.000Z',
		...patch,
	};
}

function snapshot(
	entries: Record<string, StoredPersonalEntry> = {[reference.id]: row()},
	libraryId = LIBRARY_A,
) {
	return Response.json({libraryId, entries});
}

function memoryStorage(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	return {
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			values.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			values.delete(key);
		}),
		get length() {
			return values.size;
		},
		key(index: number) {
			return [...values.keys()][index] ?? null;
		},
		values,
	};
}

function client(request: typeof fetch, storage = memoryStorage(), expectedLibraryId?: string) {
	const value = new PracticeClient({fetch: request, storage, expectedLibraryId});
	clients.push(value);
	return value;
}

function deferred<T>() {
	let resolve = (_value: T): void => {
		throw new Error('Deferred promise was not initialised');
	};
	const promise = new Promise<T>(settle => {
		resolve = settle;
	});
	return {promise, resolve};
}

function patchRequests(request: ReturnType<typeof vi.fn<typeof fetch>>) {
	return request.mock.calls
		.filter(([, init]) => init?.method === 'PATCH')
		.map(([url, init]) => {
			if (typeof init?.body !== 'string') throw new Error('Expected a JSON practice patch');
			return {
				url,
				body: practicePatchRequestSchema.parse(JSON.parse(init.body)),
				headers: new Headers(init.headers),
			};
		});
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	for (const value of clients.splice(0)) value.dispose();
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('SQLite practice client', () => {
	it('loads the server snapshot and transfers unknown legacy IDs without changing the browser originals', async () => {
		const unknown = {
			...original,
			note: 'An older content pack is not installed here.',
			revision: 7,
		};
		const legacy = JSON.stringify({version: 1, entries: {[otherReference.id]: unknown}});
		const storage = memoryStorage({[STORAGE_KEY]: legacy});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({imported: 1, unchanged: 0, conflicts: []}))
			.mockResolvedValueOnce(snapshot({[reference.id]: row(), [otherReference.id]: row(unknown)}));
		const value = client(request, storage);

		await value.load();

		expect(value.snapshot.libraryId).toBe(LIBRARY_A);
		expect(value.snapshot.library).toEqual({
			[reference.id]: original,
			[otherReference.id]: unknown,
		});
		expect(value.snapshot.notice).toMatch(/1 browser entry transferred/);
		expect(storage.getItem(STORAGE_KEY)).toBe(legacy);
		expect(storage.removeItem).not.toHaveBeenCalledWith(STORAGE_KEY);
		const [url, init] = request.mock.calls[1];
		expect(url).toBe('/api/practice/import');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(String(init?.body))).toEqual({
			version: 1,
			entries: {[otherReference.id]: unknown},
		});
		expect(new Headers(init?.headers).get('X-Hyper-Chamber-Library')).toBe(LIBRARY_A);
	});

	it('keeps legacy originals and server values when their notes differ', async () => {
		const legacy = JSON.stringify({
			version: 1,
			entries: {[reference.id]: {...original, note: 'Browser note'}},
		});
		const storage = memoryStorage({[STORAGE_KEY]: legacy});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({imported: 0, unchanged: 0, conflicts: [reference.id]}))
			.mockResolvedValueOnce(snapshot());
		const value = client(request, storage);

		await value.load();

		expect(value.snapshot.library[reference.id]).toEqual(original);
		expect(value.snapshot.notice).toMatch(/Existing library values were kept/);
		expect(storage.getItem(STORAGE_KEY)).toBe(legacy);
		expect(patchRequests(request)).toEqual([]);
	});

	it('keeps legacy originals when the transfer cannot reach the library', async () => {
		const legacy = JSON.stringify({version: 1, entries: {[reference.id]: original}});
		const storage = memoryStorage({[STORAGE_KEY]: legacy});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValueOnce(new TypeError('Network unavailable'));
		const value = client(request, storage);

		await value.load();

		expect(value.snapshot.library[reference.id]).toEqual(original);
		expect(value.snapshot.notice).toMatch(/originals have been left unchanged/);
		expect(storage.getItem(STORAGE_KEY)).toBe(legacy);
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it('sends only edited fields, the assessed content revision for status, and the expected row version', async () => {
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({entry: row({saved: true, rowVersion: 4})}))
			.mockResolvedValueOnce(
				Response.json({entry: row({saved: true, status: 'reliable', revision: 3, rowVersion: 5})}),
			);
		const value = client(request);
		await value.load();

		value.update(reference, {saved: true});
		await value.flush();
		value.update(reference, {status: 'reliable'});
		await value.flush();

		const requests = patchRequests(request);
		expect(requests.map(({url, body}) => ({url, body}))).toEqual([
			{url: `/api/practice/${reference.id}`, body: {patch: {saved: true}, expectedVersion: 3}},
			{
				url: `/api/practice/${reference.id}`,
				body: {patch: {status: 'reliable', revision: 3}, expectedVersion: 4},
			},
		]);
		expect(
			requests.every(({headers}) => headers.get('X-Hyper-Chamber-Library') === LIBRARY_A),
		).toBe(true);
		expect(value.snapshot.library[reference.id]).toEqual({
			...original,
			saved: true,
			status: 'reliable',
			revision: 3,
		});
		expect(value.snapshot.pending).toEqual({});
	});

	it('preserves newer typing while an earlier note is still being saved', async () => {
		const firstWrite = deferred<Response>();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockReturnValueOnce(firstWrite.promise)
			.mockResolvedValueOnce(
				Response.json({entry: row({note: 'First note, plus more timing detail', rowVersion: 5})}),
			);
		const value = client(request);
		await value.load();
		value.update(reference, {note: 'First note'});
		const saving = value.flush();
		expect(value.snapshot.saving).toBe(true);

		value.update(reference, {note: 'First note, plus more timing detail'});
		firstWrite.resolve(Response.json({entry: row({note: 'First note', rowVersion: 4})}));
		await saving;

		expect(patchRequests(request).map(({body}) => body)).toEqual([
			{patch: {note: 'First note'}, expectedVersion: 3},
			{patch: {note: 'First note, plus more timing detail'}, expectedVersion: 4},
		]);
		expect(value.snapshot.library[reference.id].note).toBe('First note, plus more timing detail');
		expect(value.snapshot.pending).toEqual({});
		expect(value.snapshot.saving).toBe(false);
	});

	it('keeps a same-note conflict as a draft until the learner explicitly keeps their version', async () => {
		const remote = row({note: 'Another device wrote this note', saved: true, rowVersion: 4});
		const storage = memoryStorage();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({entry: remote}, {status: 409}))
			.mockResolvedValueOnce(
				Response.json({entry: {...remote, note: 'My local timing cue', rowVersion: 5}}),
			);
		const value = client(request, storage);
		await value.load();
		value.update(reference, {note: 'My local timing cue'});

		await value.flush();
		await value.flush();

		expect(patchRequests(request)).toHaveLength(1);
		expect(value.snapshot.pending).toEqual({[reference.id]: {note: 'My local timing cue'}});
		expect(value.snapshot.conflicts[reference.id]).toEqual(remote);
		expect(value.snapshot.library[reference.id]).toEqual({
			...original,
			saved: true,
			note: 'My local timing cue',
		});
		expect([...storage.values.values()].some(raw => raw.includes('My local timing cue'))).toBe(
			true,
		);

		value.resolve(reference.id, 'local');
		await value.flush();

		expect(patchRequests(request).map(({body}) => body)).toEqual([
			{patch: {note: 'My local timing cue'}, expectedVersion: 3},
			{patch: {note: 'My local timing cue'}, expectedVersion: 4},
		]);
		expect(value.snapshot.conflicts).toEqual({});
		expect(value.snapshot.pending).toEqual({});
		expect(value.snapshot.library[reference.id].note).toBe('My local timing cue');
	});

	it('discards a conflicting draft only when the learner chooses the server version', async () => {
		const remote = row({note: 'Keep this server note', rowVersion: 4});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({entry: remote}, {status: 409}));
		const value = client(request);
		await value.load();
		value.update(reference, {note: 'A conflicting browser note'});
		await value.flush();

		value.resolve(reference.id, 'server');
		await value.flush();

		expect(value.snapshot.library[reference.id].note).toBe('Keep this server note');
		expect(value.snapshot.pending).toEqual({});
		expect(value.snapshot.conflicts).toEqual({});
		expect(patchRequests(request)).toHaveLength(1);
	});

	it('rebases a disjoint-field conflict without overwriting the other device’s progress', async () => {
		const remote = row({status: 'reliable', revision: 3, rowVersion: 4});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(Response.json({entry: remote}, {status: 409}))
			.mockResolvedValueOnce(
				Response.json({entry: {...remote, note: 'My new note', rowVersion: 5}}),
			);
		const value = client(request);
		await value.load();
		value.update(reference, {note: 'My new note'});

		await value.flush();

		expect(patchRequests(request).map(({body}) => body)).toEqual([
			{patch: {note: 'My new note'}, expectedVersion: 3},
			{patch: {note: 'My new note'}, expectedVersion: 4},
		]);
		expect(value.snapshot.library[reference.id]).toEqual({
			...original,
			note: 'My new note',
			status: 'reliable',
			revision: 3,
		});
		expect(value.snapshot.conflicts).toEqual({});
		expect(value.snapshot.pending).toEqual({});
	});

	it('keeps a failed write visible and retries it against refreshed server state', async () => {
		const remote = row({saved: true, rowVersion: 4});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValueOnce(new TypeError('Network unavailable'))
			.mockResolvedValueOnce(snapshot({[reference.id]: remote}))
			.mockResolvedValueOnce(Response.json({entry: remote}, {status: 409}))
			.mockResolvedValueOnce(
				Response.json({entry: {...remote, note: 'Do not lose this note', rowVersion: 5}}),
			);
		const value = client(request);
		await value.load();
		value.update(reference, {note: 'Do not lose this note'});
		await value.flush();

		expect(value.snapshot.error).toMatch(/Could not save/);
		expect(value.snapshot.library[reference.id].note).toBe('Do not lose this note');
		expect(value.snapshot.pending).toEqual({[reference.id]: {note: 'Do not lose this note'}});

		await value.load();

		expect(value.snapshot.error).toBeNull();
		expect(value.snapshot.library[reference.id]).toEqual({
			...original,
			saved: true,
			note: 'Do not lose this note',
		});
		expect(value.snapshot.pending).toEqual({});
		expect(patchRequests(request).map(({body}) => body.expectedVersion)).toEqual([3, 3, 4]);
	});

	it('recovers unsaved notes after closing and reopening the browser client', async () => {
		const storage = memoryStorage();
		const failedRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValueOnce(new TypeError('Offline'));
		const first = client(failedRequest, storage);
		await first.load();
		first.update(reference, {note: 'Recovered timing cue'});
		await first.flush();
		first.dispose();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(
				Response.json({entry: row({note: 'Recovered timing cue', rowVersion: 4})}),
			);
		const reopened = client(request, storage);

		await reopened.load();

		expect(patchRequests(request).map(({body}) => body)).toEqual([
			{patch: {note: 'Recovered timing cue'}, expectedVersion: 3},
		]);
		expect(reopened.snapshot.library[reference.id].note).toBe('Recovered timing cue');
		expect(reopened.snapshot.notice).toMatch(/Recovered unsaved edits/);
		expect(reopened.snapshot.pending).toEqual({});
	});

	it('does not let an older in-flight snapshot roll back an acknowledged write', async () => {
		const refresh = deferred<Response>();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockReturnValueOnce(refresh.promise)
			.mockResolvedValueOnce(
				Response.json({entry: row({note: 'Acknowledged new note', rowVersion: 4})}),
			);
		const value = client(request);
		await value.load();
		const loading = value.load();
		value.update(reference, {note: 'Acknowledged new note'});
		await value.flush();

		refresh.resolve(snapshot());
		await loading;

		expect(value.snapshot.library[reference.id].note).toBe('Acknowledged new note');
		expect(value.snapshot.pending).toEqual({});
		value.update(reference, {saved: true});
		request.mockResolvedValueOnce(
			Response.json({entry: row({note: 'Acknowledged new note', saved: true, rowVersion: 5})}),
		);
		await value.flush();
		expect(patchRequests(request).at(-1)?.body).toEqual({patch: {saved: true}, expectedVersion: 4});
	});

	it('does not restore one library’s drafts into another library', async () => {
		const storage = memoryStorage();
		const failedRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValueOnce(new TypeError('Offline'));
		const first = client(failedRequest, storage);
		await first.load();
		first.update(reference, {note: 'Belongs to library A'});
		await first.flush();
		first.dispose();
		const originalRecovery = new Map(storage.values);
		const request = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot({}, LIBRARY_B));
		const second = client(request, storage);

		await second.load();

		expect(second.snapshot.libraryId).toBe(LIBRARY_B);
		expect(second.snapshot.library).toEqual({});
		expect(second.snapshot.pending).toEqual({});
		expect(request).toHaveBeenCalledTimes(1);
		expect(storage.values).toEqual(originalRecovery);
	});

	it('locks writes after the connected library changes, preserving the original drafts for recovery', async () => {
		const storage = memoryStorage();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot({}, LIBRARY_A))
			.mockResolvedValueOnce(snapshot({}, LIBRARY_B))
			.mockResolvedValue(Response.json({entry: row({note: 'Only for A', rowVersion: 1})}));
		const value = client(request, storage);
		await value.load();
		value.update(reference, {note: 'Only for A'});
		const originalRecovery = new Map(storage.values);

		await value.load();
		expect(value.snapshot.error).toMatch(/library changed/i);
		value.update(otherReference, {note: 'Must not start a new edit against B'});
		await value.flush();

		expect(patchRequests(request)).toEqual([]);
		expect(value.snapshot.pending).toEqual({[reference.id]: {note: 'Only for A'}});
		expect(storage.values).toEqual(originalRecovery);
		expect(value.snapshot.error).toMatch(/library changed/i);
	});

	it('does not erase another tab’s unsaved recovery data when this tab finishes saving', async () => {
		const storage = memoryStorage();
		const initial = {[reference.id]: row(), [otherReference.id]: row()};
		const firstRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot(initial))
			.mockRejectedValueOnce(new TypeError('Offline'))
			.mockResolvedValueOnce(Response.json({entry: row({note: 'First tab note', rowVersion: 4})}));
		const secondRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot(initial))
			.mockRejectedValueOnce(new TypeError('Offline'));
		const first = client(firstRequest, storage);
		const second = client(secondRequest, storage);
		await first.load();
		await second.load();
		first.update(reference, {note: 'First tab note'});
		await first.flush();
		second.update(otherReference, {note: 'Second tab note must survive'});
		await second.flush();

		await first.flush();
		first.dispose();
		second.dispose();
		const reopenedRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				snapshot({...initial, [reference.id]: row({note: 'First tab note', rowVersion: 4})}),
			)
			.mockRejectedValue(new TypeError('Still offline'));
		const reopened = client(reopenedRequest, storage);
		await reopened.load();

		expect(reopened.snapshot.library[otherReference.id].note).toBe('Second tab note must survive');
		expect(reopened.snapshot.pending[otherReference.id]).toEqual({
			note: 'Second tab note must survive',
		});
	});
	it('refuses a practice library that differs from the catalog loaded by the app', async () => {
		const storage = memoryStorage({
			[STORAGE_KEY]: JSON.stringify({version: 1, entries: {[reference.id]: original}}),
		});
		const before = new Map(storage.values);
		const request = vi.fn<typeof fetch>().mockResolvedValueOnce(snapshot({}, LIBRARY_B));
		const value = client(request, storage, LIBRARY_A);

		await value.load();
		value.update(reference, {note: 'Must not be written to the wrong catalog'});
		await value.flush();

		expect(value.snapshot.locked).toBe(true);
		expect(value.snapshot.error).toMatch(/library changed/i);
		expect(value.snapshot.libraryId).toBeNull();
		expect(value.snapshot.pending).toEqual({});
		expect(request).toHaveBeenCalledTimes(1);
		expect(storage.values).toEqual(before);
	});

	it.each([412, 409])(
		'preserves drafts and permanently locks after a %s library_changed mutation response',
		async status => {
			const storage = memoryStorage();
			const request = vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(snapshot())
				.mockResolvedValueOnce(
					Response.json(
						{error: {code: 'library_changed', message: 'Connected library changed'}},
						{status},
					),
				);
			const value = client(request, storage);
			await value.load();
			value.update(reference, {note: 'Keep this draft in the original library'});
			const before = new Map(storage.values);

			await value.flush();
			value.update(otherReference, {saved: true});
			await value.load();
			await value.flush();

			expect(value.snapshot.locked).toBe(true);
			expect(value.snapshot.error).toMatch(/library changed/i);
			expect(value.snapshot.pending).toEqual({
				[reference.id]: {note: 'Keep this draft in the original library'},
			});
			expect(request).toHaveBeenCalledTimes(2);
			expect(storage.values).toEqual(before);
		},
	);

	it('does not swallow an identity change during legacy import or write the browser originals into it', async () => {
		const legacy = JSON.stringify({version: 1, entries: {[reference.id]: original}});
		const storage = memoryStorage({[STORAGE_KEY]: legacy});
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(
				Response.json(
					{error: {code: 'library_changed', message: 'Connected library changed'}},
					{status: 412},
				),
			);
		const value = client(request, storage);

		await value.load();
		value.update(reference, {note: 'Must not continue after the failed import'});
		await value.flush();

		expect(value.snapshot.locked).toBe(true);
		expect(value.snapshot.error).toMatch(/library changed/i);
		expect(value.snapshot.pending).toEqual({});
		expect(storage.getItem(STORAGE_KEY)).toBe(legacy);
		expect(storage.setItem).not.toHaveBeenCalled();
		expect(request).toHaveBeenCalledTimes(2);
	});

	it.each(['local', 'server'])(
		'requires an explicit choice between divergent recovered notes and keeps the chosen %s version',
		async choice => {
			const storage = memoryStorage();
			const firstRequest = vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(snapshot())
				.mockRejectedValue(new TypeError('Offline'));
			const secondRequest = vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(snapshot())
				.mockRejectedValue(new TypeError('Offline'));
			const first = client(firstRequest, storage);
			const second = client(secondRequest, storage);
			await first.load();
			await second.load();
			first.update(reference, {note: 'First recovered version'});
			await first.flush();
			second.update(reference, {note: 'Second recovered version'});
			await second.flush();
			first.dispose();
			second.dispose();
			const recoveryBefore = new Map(storage.values);
			const request = vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(snapshot())
				.mockResolvedValueOnce(
					Response.json({entry: row({note: 'Second recovered version', rowVersion: 4})}),
				);
			const reopened = client(request, storage);

			await reopened.load();

			expect(request).toHaveBeenCalledTimes(1);
			expect(reopened.snapshot.pending).toEqual({});
			expect(reopened.snapshot.library[reference.id].note).toBe(original.note);
			expect(
				reopened.snapshot.recoveryConflicts[reference.id].map(option => option.patch.note).sort(),
			).toEqual(['First recovered version', 'Second recovered version']);
			expect(reopened.snapshot.notice).toMatch(/Choose which version/);
			reopened.update(reference, {note: 'Do not overwrite either recovered version'});
			expect(storage.values).toEqual(recoveryBefore);
			const selected = reopened.snapshot.recoveryConflicts[reference.id].find(
				option => option.patch.note === 'Second recovered version',
			);
			if (!selected) throw new Error('Missing recovered version');

			reopened.resolveRecovery(reference.id, choice === 'server' ? 'server' : selected.id);
			await reopened.flush();

			expect(reopened.snapshot.recoveryConflicts).toEqual({});
			expect(reopened.snapshot.pending).toEqual({});
			const expected = choice === 'local' ? 'Second recovered version' : original.note;
			expect(reopened.snapshot.library[reference.id].note).toBe(expected);
			expect(patchRequests(request)).toHaveLength(choice === 'local' ? 1 : 0);
			reopened.dispose();
			const finalRequest = vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(
					snapshot({[reference.id]: row({note: expected, rowVersion: choice === 'local' ? 4 : 3})}),
				);
			const again = client(finalRequest, storage);
			await again.load();
			expect(again.snapshot.recoveryConflicts).toEqual({});
			expect(again.snapshot.pending).toEqual({});
			expect(finalRequest).toHaveBeenCalledTimes(1);
		},
	);

	it('never deletes a live tab’s newer edit when acknowledging a recovered older copy', async () => {
		const storage = memoryStorage();
		const firstRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValue(new TypeError('Offline'));
		const first = client(firstRequest, storage);
		await first.load();
		first.update(reference, {note: 'Older recovery copy'});
		await first.flush();
		const sourceKey = [...storage.values.keys()][0];
		const write = deferred<Response>();
		const recoveringRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockReturnValueOnce(write.promise);
		const recovering = client(recoveringRequest, storage);
		const loading = recovering.load();
		// Let recovery read the original slot and begin its HTTP write.
		await vi.waitFor(() => expect(patchRequests(recoveringRequest)).toHaveLength(1));
		let racePending = true;
		storage.getItem.mockImplementation(key => {
			const raw = storage.values.get(key) ?? null;
			// Simulate a second window writing after a cleanup read but before a
			// subsequent removeItem. Comparing the old string is not an atomic CAS.
			if (racePending && key === sourceKey) {
				racePending = false;
				first.update(reference, {note: 'Newer live-tab edit'});
			}
			return raw;
		});
		write.resolve(Response.json({entry: row({note: 'Older recovery copy', rowVersion: 4})}));
		await loading;
		if (racePending) {
			racePending = false;
			first.update(reference, {note: 'Newer live-tab edit'});
		}

		expect(storage.values.get(sourceKey)).toContain('Newer live-tab edit');
		expect(storage.removeItem).not.toHaveBeenCalledWith(sourceKey);
		first.dispose();
		recovering.dispose();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				snapshot({[reference.id]: row({note: 'Older recovery copy', rowVersion: 4})}),
			)
			.mockRejectedValue(new TypeError('Offline'));
		const again = client(request, storage);
		await again.load();
		expect(again.snapshot.library[reference.id].note).toBe('Newer live-tab edit');
		expect(again.snapshot.pending[reference.id]).toEqual({note: 'Newer live-tab edit'});
	});
	it('creates and recovers drafts on LAN HTTP where crypto.randomUUID is unavailable', async () => {
		const getRandomValues = crypto.getRandomValues.bind(crypto);
		vi.stubGlobal('crypto', {getRandomValues});
		const storage = memoryStorage();
		const firstRequest = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockRejectedValue(new TypeError('Offline'));
		const first = client(firstRequest, storage);
		await first.load();
		first.update(reference, {note: 'Written from a phone browser'});
		await first.flush();
		first.dispose();
		const request = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(snapshot())
			.mockResolvedValueOnce(
				Response.json({entry: row({note: 'Written from a phone browser', rowVersion: 4})}),
			);
		const reopened = client(request, storage);

		await reopened.load();

		expect(reopened.snapshot.error).toBeNull();
		expect(reopened.snapshot.library[reference.id].note).toBe('Written from a phone browser');
		expect(patchRequests(request)).toHaveLength(1);
	});
});
