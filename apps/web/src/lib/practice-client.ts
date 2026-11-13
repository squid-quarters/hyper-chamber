import {z} from 'zod';
import {
	legacyLibrarySchema,
	personalEntrySchema,
	personalPatchSchema,
	practiceSnapshotSchema,
	referenceIdSchema,
	storedPersonalEntrySchema,
	type PersonalEntry,
	type PersonalLibrary,
	type Reference,
	type StoredPersonalEntry,
} from '@hyper-chamber/reference';
import {STORAGE_KEY, type LibraryPatches} from './personal';

const DRAFT_KEY = 'hyper-chamber.pending-drafts.v1:';
const TRANSFER_KEY = 'hyper-chamber.browser-transfer.v1';
const ACKNOWLEDGED_KEY = 'hyper-chamber.acknowledged-drafts.v1:';
const IDENTITY_ERROR = 'The connected library changed. Reload before editing.';
const draftSchema = z.strictObject({
	patch: personalPatchSchema,
	base: personalEntrySchema,
	baseVersion: z.number().int().nonnegative().safe(),
});
const draftsSchema = z.strictObject({
	version: z.literal(1),
	entries: z.record(referenceIdSchema, draftSchema),
});
type Draft = z.infer<typeof draftSchema>;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> &
	Partial<Pick<Storage, 'key' | 'length'>>;
interface RecoveryCandidate {
	id: string;
	draft: Draft;
	source: string;
}
export interface RecoveryChoice {
	id: string;
	patch: Partial<PersonalEntry>;
}
export interface PracticeClientState {
	libraryId: string | null;
	library: PersonalLibrary;
	pending: LibraryPatches;
	conflicts: Record<string, StoredPersonalEntry>;
	recoveryConflicts: Record<string, RecoveryChoice[]>;
	locked: boolean;
	error: string | null;
	notice: string;
	saving: boolean;
}
function recoveryId(): string {
	// LAN pages use HTTP. getRandomValues is available there; randomUUID is not.
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
		byte.toString(16).padStart(2, '0'),
	).join('');
}
function fields(entry: PersonalEntry): PersonalEntry {
	return {saved: entry.saved, status: entry.status, note: entry.note, revision: entry.revision};
}
function failure(error: unknown): string {
	return error instanceof Error ? error.message : 'Your library could not be reached.';
}
function samePatch(first: Partial<PersonalEntry>, second: Partial<PersonalEntry>): boolean {
	const keys = Object.keys(first) as (keyof PersonalEntry)[];
	return (
		keys.length === Object.keys(second).length && keys.every(key => first[key] === second[key])
	);
}
function parseDrafts(raw: string): Record<string, Draft> {
	const parsed: unknown = JSON.parse(raw);
	if (
		parsed &&
		typeof parsed === 'object' &&
		'entries' in parsed &&
		parsed.entries &&
		typeof parsed.entries === 'object'
	) {
		for (const id of Object.keys(parsed.entries)) {
			if (!referenceIdSchema.safeParse(id).success) throw new Error('Invalid draft ID');
		}
	}
	return draftsSchema.parse(parsed).entries;
}

/** One server library is authoritative. Browser storage holds recovery drafts only. */
export class PracticeClient {
	private libraryId: string | null = null;
	private readonly expectedLibraryId: string | undefined;
	private server: Record<string, StoredPersonalEntry> = {};
	private drafts: Record<string, Draft> = {};
	private blocked = new Set<string>();
	private recovery: Record<string, RecoveryCandidate[]> = {};
	private recoverySources = new Map<string, string>();
	private adoptedSources = new Map<string, Set<string>>();
	private readonly owner = recoveryId();
	private ownedKeys = new Set<string>();
	private listeners = new Set<(state: PracticeClientState) => void>();
	private error: string | null = null;
	private notice = '';
	private locked = false;
	private saving = false;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private running: Promise<void> | null = null;
	private disposed = false;
	private restored = false;
	private readonly request: typeof fetch;
	private readonly storage: DraftStorage | null;
	constructor(
		options: {fetch?: typeof fetch; storage?: DraftStorage | null; expectedLibraryId?: string} = {},
	) {
		this.request = options.fetch ?? fetch;
		this.expectedLibraryId =
			options.expectedLibraryId === undefined
				? undefined
				: z.uuid().parse(options.expectedLibraryId);
		if (options.storage !== undefined) this.storage = options.storage;
		else {
			try {
				this.storage = typeof window === 'undefined' ? null : window.localStorage;
			} catch {
				this.storage = null;
			}
		}
	}
	get snapshot(): PracticeClientState {
		const library: PersonalLibrary = Object.fromEntries(
			Object.entries(this.server).map(([id, entry]) => [id, fields(entry)]),
		);
		const pending: LibraryPatches = {};
		for (const [id, draft] of Object.entries(this.drafts)) {
			library[id] = {...(library[id] ?? draft.base), ...draft.patch};
			pending[id] = {...draft.patch};
		}
		const conflicts = Object.fromEntries(
			[...this.blocked].filter(id => this.server[id]).map(id => [id, this.server[id]]),
		);
		const recoveryConflicts = Object.fromEntries(
			Object.entries(this.recovery).map(([id, choices]) => [
				id,
				choices.map(choice => ({id: choice.id, patch: {...choice.draft.patch}})),
			]),
		);
		return {
			libraryId: this.libraryId,
			library,
			pending,
			conflicts,
			recoveryConflicts,
			locked: this.locked,
			error: this.error,
			notice: this.notice,
			saving: this.saving,
		};
	}
	subscribe(listener: (state: PracticeClientState) => void): () => void {
		this.listeners.add(listener);
		listener(this.snapshot);
		return () => this.listeners.delete(listener);
	}
	private emit() {
		if (!this.disposed) for (const listener of this.listeners) listener(this.snapshot);
	}
	private accept(entryId: string, entry: StoredPersonalEntry) {
		if (!this.server[entryId] || this.server[entryId].rowVersion <= entry.rowVersion)
			this.server[entryId] = entry;
	}
	private lock(): never {
		this.locked = true;
		this.error = IDENTITY_ERROR;
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
		throw new Error(IDENTITY_ERROR);
	}
	private async checkIdentityResponse(response: Response) {
		if (this.locked) throw new Error(IDENTITY_ERROR);
		if (response.status === 412) this.lock();
		if (response.status === 409) {
			const data: unknown = await response.clone().json();
			if (
				z.object({error: z.object({code: z.literal('library_changed')})}).safeParse(data).success ||
				(data && typeof data === 'object' && 'code' in data && data.code === 'library_changed')
			)
				this.lock();
		}
	}
	private headers(): Record<string, string> {
		if (!this.libraryId || this.locked) throw new Error(IDENTITY_ERROR);
		return {'Content-Type': 'application/json', 'X-Hyper-Chamber-Library': this.libraryId};
	}
	private async readSnapshot() {
		const response = await this.request('/api/practice');
		await this.checkIdentityResponse(response);
		if (!response.ok) throw new Error('Your library could not be loaded. Retry the connection.');
		const value = practiceSnapshotSchema.parse(await response.json());
		if (
			(this.expectedLibraryId && this.expectedLibraryId !== value.libraryId) ||
			(this.libraryId && this.libraryId !== value.libraryId)
		)
			this.lock();
		this.libraryId = value.libraryId;
		for (const [id, entry] of Object.entries(value.entries)) this.accept(id, entry);
	}
	async load(): Promise<void> {
		if (this.locked || this.disposed) return;
		try {
			await this.readSnapshot();
			if (!this.restored) {
				this.restored = true;
				await this.transferBrowserData();
				this.restoreDrafts();
			}
			this.error = null;
			this.emit();
			if (Object.keys(this.drafts).length) await this.flush();
		} catch (error) {
			this.error = this.locked ? IDENTITY_ERROR : failure(error);
			this.emit();
		}
	}
	private async transferBrowserData() {
		if (!this.storage || !this.libraryId) return;
		try {
			if (this.storage.getItem(TRANSFER_KEY)) return;
			const text = this.storage.getItem(STORAGE_KEY);
			if (!text) return;
			const data = legacyLibrarySchema.parse(JSON.parse(text));
			const response = await this.request('/api/practice/import', {
				method: 'POST',
				headers: this.headers(),
				body: JSON.stringify(data),
			});
			await this.checkIdentityResponse(response);
			if (!response.ok)
				throw new Error(
					'Existing browser notes could not be transferred. They remain in this browser.',
				);
			const result = z
				.strictObject({
					imported: z.number().int().nonnegative(),
					unchanged: z.number().int().nonnegative(),
					conflicts: z.array(referenceIdSchema),
				})
				.parse(await response.json());
			await this.readSnapshot();
			if (result.conflicts.length)
				this.notice = `${result.conflicts.length} browser ${result.conflicts.length === 1 ? 'entry differs' : 'entries differ'} from the library. Existing library values were kept; the original browser notes remain available.`;
			else {
				this.storage.setItem(TRANSFER_KEY, this.libraryId);
				if (result.imported)
					this.notice = `${result.imported} browser ${result.imported === 1 ? 'entry transferred' : 'entries transferred'} to your library. The originals remain in this browser.`;
			}
		} catch (error) {
			if (this.locked) throw error;
			this.notice =
				'Existing browser notes could not be fully transferred. The originals have been left unchanged.';
		}
	}
	private restoreDrafts() {
		if (!this.storage || !this.libraryId) return;
		const candidates: Record<string, RecoveryCandidate[]> = {};
		let unreadable = false;
		try {
			const legacyKey = DRAFT_KEY + this.libraryId;
			const keys = new Set([legacyKey]);
			if (this.storage.key && this.storage.length !== undefined) {
				for (let index = 0; index < this.storage.length; index++) {
					const key = this.storage.key(index);
					if (key?.startsWith(`${legacyKey}:`)) keys.add(key);
				}
			}
			for (const key of [...keys].sort()) {
				const raw = this.storage.getItem(key);
				if (!raw) continue;
				try {
					const entries = parseDrafts(raw);
					this.recoverySources.set(key, raw);
					for (const [id, draft] of Object.entries(entries)) {
						if (this.storage.getItem(`${ACKNOWLEDGED_KEY}${key}:${id}`) === raw) continue;
						(candidates[id] ??= []).push({id: recoveryId(), draft, source: key});
					}
				} catch {
					unreadable = true;
				}
			}
			for (const [id, choices] of Object.entries(candidates)) {
				const first = choices[0];
				if (
					this.drafts[id] ||
					choices.some(choice => !samePatch(first.draft.patch, choice.draft.patch))
				) {
					this.recovery[id] = choices;
					continue;
				}
				const newest = choices.reduce((latest, choice) =>
					choice.draft.baseVersion > latest.draft.baseVersion ? choice : latest,
				);
				this.drafts[id] = newest.draft;
				this.adoptedSources.set(id, new Set(choices.map(choice => choice.source)));
			}
			if (Object.keys(this.recovery).length)
				this.notice =
					'Different unsaved versions were recovered. Choose which version to keep before editing those references.';
			else if (Object.keys(this.drafts).length)
				this.notice = 'Recovered unsaved edits from this browser.';
			if (unreadable)
				this.notice += `${this.notice ? ' ' : ''}Some browser recovery data could not be read and has been left unchanged.`;
			// Write this client's own copy before submitting any recovered edit. Other
			// clients' slots remain intact; receipts identify exactly what was acknowledged.
			if (Object.keys(this.drafts).length) this.persistDrafts();
		} catch {
			this.notice =
				'Browser draft recovery could not be read. The stored recovery data has been left unchanged.';
		}
	}
	private draftKey(id: string) {
		return `${DRAFT_KEY}${this.libraryId}:${this.owner}:${id}`;
	}
	private persistDrafts() {
		if (!this.storage || !this.libraryId) return;
		try {
			const current = new Set<string>();
			for (const [id, draft] of Object.entries(this.drafts)) {
				const key = this.draftKey(id);
				this.storage.setItem(key, JSON.stringify({version: 1, entries: {[id]: draft}}));
				this.ownedKeys.add(key);
				current.add(key);
			}
			for (const key of this.ownedKeys)
				if (!current.has(key)) {
					this.storage.removeItem(key);
					this.ownedKeys.delete(key);
				}
		} catch {
			this.notice =
				'Browser draft recovery is unavailable. Keep this window open until your edits are saved to the library.';
		}
	}
	private finishRecovery(id: string) {
		const sources = this.adoptedSources.get(id);
		if (!sources || !this.storage) return;
		for (const key of sources) {
			const raw = this.recoverySources.get(key);
			if (!raw) continue;
			try {
				// Only an owner removes its slot. A check-then-remove of another tab's
				// value could race its next edit. This receipt acknowledges exactly the
				// recovered copy; any different value in that slot remains recoverable.
				this.storage.setItem(`${ACKNOWLEDGED_KEY}${key}:${id}`, raw);
			} catch {
				this.notice =
					'Saved edits are in the library. Some recovery copies may appear again if you reopen this browser.';
			}
		}
		this.adoptedSources.delete(id);
	}
	update(reference: Pick<Reference, 'id' | 'revision'>, patch: Partial<PersonalEntry>) {
		if (this.locked || this.disposed) {
			this.emit();
			return;
		}
		if (!this.libraryId) {
			this.error = 'Connect to your library before editing notes or progress.';
			this.emit();
			return;
		}
		if (this.recovery[reference.id]) {
			this.error = 'Choose which recovered edit to keep before changing this reference.';
			this.emit();
			return;
		}
		referenceIdSchema.parse(reference.id);
		const checked = personalPatchSchema.parse(
			patch.status === undefined ? patch : {...patch, revision: reference.revision},
		);
		const existing = this.drafts[reference.id];
		this.drafts[reference.id] = existing
			? {...existing, patch: {...existing.patch, ...checked}}
			: {
					patch: checked,
					base: this.server[reference.id]
						? fields(this.server[reference.id])
						: {saved: false, status: 'untried', note: '', revision: reference.revision},
					baseVersion: this.server[reference.id]?.rowVersion ?? 0,
				};
		this.persistDrafts();
		this.emit();
		if (this.timer) clearTimeout(this.timer);
		this.timer = setTimeout(
			() => {
				void this.flush();
			},
			Object.keys(checked).every(key => key === 'note') ? 350 : 0,
		);
	}
	resolveRecovery(referenceId: string, choice: string) {
		if (this.locked || this.disposed) return;
		const candidates = this.recovery[referenceId];
		if (!candidates) return;
		const selected = candidates.find(candidate => candidate.id === choice);
		if (!selected && choice !== 'server') return;
		this.adoptedSources.set(referenceId, new Set(candidates.map(candidate => candidate.source)));
		if (selected) this.drafts[referenceId] = selected.draft;
		else this.finishRecovery(referenceId);
		delete this.recovery[referenceId];
		this.error = null;
		this.persistDrafts();
		this.emit();
		if (selected) void this.flush();
	}
	resolve(referenceId: string, choice: 'local' | 'server') {
		if (this.locked || this.disposed || !this.blocked.has(referenceId)) return;
		if (choice === 'server') {
			delete this.drafts[referenceId];
			this.finishRecovery(referenceId);
		} else if (this.drafts[referenceId] && this.server[referenceId]) {
			this.drafts[referenceId].base = fields(this.server[referenceId]);
			this.drafts[referenceId].baseVersion = this.server[referenceId].rowVersion;
		}
		this.blocked.delete(referenceId);
		this.persistDrafts();
		this.emit();
		if (choice === 'local') void this.flush();
	}
	flush(): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
		if (this.locked || this.disposed) return Promise.resolve();
		if (this.running) return this.running;
		this.running = this.savePending().finally(() => {
			this.running = null;
		});
		return this.running;
	}
	private async savePending() {
		if (!this.libraryId || this.locked) return;
		this.saving = true;
		this.emit();
		try {
			while (!this.locked && !this.disposed) {
				const id = Object.keys(this.drafts).find(
					key => !this.blocked.has(key) && !this.recovery[key],
				);
				if (!id) break;
				const draft = this.drafts[id];
				const patch = {...draft.patch};
				const response = await this.request(`/api/practice/${encodeURIComponent(id)}`, {
					method: 'PATCH',
					headers: this.headers(),
					body: JSON.stringify({patch, expectedVersion: draft.baseVersion}),
				});
				await this.checkIdentityResponse(response);
				if (response.status === 409) {
					const data = z.object({entry: storedPersonalEntrySchema}).parse(await response.json());
					this.accept(id, data.entry);
					const current = this.drafts[id];
					const changed = (Object.keys(current.patch) as (keyof PersonalEntry)[]).some(
						key => data.entry[key] !== current.base[key] && data.entry[key] !== current.patch[key],
					);
					if (changed) this.blocked.add(id);
					else {
						current.base = fields(data.entry);
						current.baseVersion = data.entry.rowVersion;
					}
					this.persistDrafts();
					this.emit();
					continue;
				}
				if (!response.ok)
					throw new Error('Your edits have not been saved. Retry the library connection.');
				const data = z.object({entry: storedPersonalEntrySchema}).parse(await response.json());
				this.accept(id, data.entry);
				const current = this.drafts[id];
				for (const key of Object.keys(patch) as (keyof PersonalEntry)[])
					if (current.patch[key] === patch[key]) delete current.patch[key];
				if (Object.keys(current.patch).length === 0) {
					delete this.drafts[id];
					this.finishRecovery(id);
				} else {
					current.base = fields(data.entry);
					current.baseVersion = data.entry.rowVersion;
				}
				this.error = null;
				this.persistDrafts();
				this.emit();
			}
		} catch (error) {
			this.error = this.locked
				? IDENTITY_ERROR
				: `Could not save to your library. ${failure(error)}`;
			this.persistDrafts();
		} finally {
			this.saving = false;
			this.emit();
		}
	}

	dispose() {
		this.disposed = true;
		if (this.timer) clearTimeout(this.timer);
		this.listeners.clear();
	}
}
