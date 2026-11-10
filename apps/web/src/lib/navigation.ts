export interface LibraryFilters {
	query: string;
	kind: string;
	situation: string;
	savedOnly: boolean;
	practice: string;
	characterId?: string;
}

export interface CharacterLocation {
	id: string;
	referenceIds: ReadonlySet<string>;
	situations: readonly string[];
}

export function readCharacterLocation(search: string, collections: readonly CharacterLocation[]) {
	const first = collections[0];
	if (!first) throw new Error('At least one character library is required');
	const params = new URLSearchParams(search);
	const requested = params.get('character');
	const entry = params.get('entry');
	const explicit = collections.find(collection => collection.id === requested);
	// Stable entry links identify their library even when shared without a
	// character parameter, or with an outdated character selection.
	const linked = entry
		? collections.find(collection => collection.referenceIds.has(entry))
		: undefined;
	const collection = linked ?? explicit ?? first;
	return {
		...readReferenceLocation(search, collection.referenceIds, collection.situations),
		characterId: collection.id,
		invalidCharacter: !!requested && !explicit,
	};
}

export interface LibraryReturn {
	key: string;
	scrollY: number;
	entryId: string | null;
}

export function readLibraryReturn(
	value: unknown,
	referenceIds: ReadonlySet<string>,
): LibraryReturn | undefined {
	if (
		!value ||
		typeof value !== 'object' ||
		!('key' in value) ||
		typeof value.key !== 'string' ||
		!('scrollY' in value) ||
		typeof value.scrollY !== 'number' ||
		!Number.isFinite(value.scrollY) ||
		value.scrollY < 0 ||
		!('entryId' in value) ||
		(value.entryId !== null &&
			(typeof value.entryId !== 'string' || !referenceIds.has(value.entryId)))
	)
		return undefined;
	return {key: value.key, scrollY: value.scrollY, entryId: value.entryId};
}

export function readReferenceLocation(
	search: string,
	referenceIds: ReadonlySet<string>,
	situations: readonly string[],
): LibraryFilters & {entryId: string | null; invalidEntry: boolean} {
	const params = new URLSearchParams(search);
	const entry = params.get('entry');
	return {
		query: params.get('q') ?? '',
		kind: ['combo', 'setup', 'response'].includes(params.get('kind') ?? '')
			? params.get('kind')!
			: 'all',
		situation: situations.includes(params.get('situation') ?? '')
			? params.get('situation')!
			: 'all',
		savedOnly: params.get('saved') === '1',
		practice: ['untried', 'practising', 'reliable'].includes(params.get('practice') ?? '')
			? params.get('practice')!
			: 'all',
		entryId: entry && referenceIds.has(entry) ? entry : null,
		invalidEntry: !!entry && !referenceIds.has(entry),
	};
}

export function referenceLocation(
	href: string,
	filters: LibraryFilters,
	entryId: string | null,
): URL {
	const url = new URL(href);
	for (const key of ['q', 'kind', 'situation', 'saved', 'entry', 'practice'])
		url.searchParams.delete(key);
	url.hash = '';
	if (filters.characterId !== undefined) {
		url.searchParams.delete('character');
		if (filters.characterId !== 'dhalsim') url.searchParams.set('character', filters.characterId);
	}
	if (filters.query) url.searchParams.set('q', filters.query);
	if (filters.kind !== 'all') url.searchParams.set('kind', filters.kind);
	if (filters.situation !== 'all') url.searchParams.set('situation', filters.situation);
	if (filters.savedOnly) url.searchParams.set('saved', '1');
	if (filters.practice !== 'all') url.searchParams.set('practice', filters.practice);
	if (entryId) url.searchParams.set('entry', entryId);
	return url;
}
