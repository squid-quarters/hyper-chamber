import {describe, expect, it} from 'vitest';
import {filterReferences, parseCatalog, referenceSchema, sourceLink, type Reference} from './index';

function reference(patch: Partial<Reference> = {}): Reference {
	return {
		id: 'yoga-test',
		revision: 1,
		title: 'Yoga Test',
		summary: 'A practice reference for timing.',
		kind: 'combo',
		situations: ['corner'],
		outcomes: ['position'],
		notation: 'cr.MP > special',
		inputs: [{id: 'first-input', notation: 'cr.MP', label: 'Crouching medium punch'}],
		conditions: ['Start close'],
		notes: ['Example content for schema tests.'],
		resources: {drive: 'None', super: 'None'},
		source: {
			id: 'tutorial',
			title: 'Source',
			creator: 'Creator',
			url: 'https://www.youtube.com/watch?v=test',
			published: '2026-11-03',
			start: 10,
			end: 20,
		},
		verification: {status: 'draft', gameVersion: null, note: 'Not verified in game.'},
		media: {
			poster: '/media/yoga-test/poster.webp',
			frames: [
				{
					id: 'first-frame',
					src: '/media/yoga-test/first.webp',
					alt: 'Starting position',
					label: 'Start',
					at: 0,
				},
			],
		},
		relatedIds: [],
		...patch,
	};
}

describe('catalog boundaries', () => {
	it('accepts references with valid relationships regardless of list order', () => {
		const first = reference({relatedIds: ['follow-up']});
		const second = reference({id: 'follow-up'});
		expect(parseCatalog([first, second])).toEqual([first, second]);
		expect(parseCatalog([second, first])).toEqual([second, first]);
	});

	it('rejects duplicate reference IDs instead of making progress ambiguous', () => {
		expect(() => parseCatalog([reference(), reference()])).toThrow(/IDs must be unique/);
	});

	it.each(['unknown', 'yoga-test'])('rejects unresolved or self-related ID %s', id => {
		expect(() => parseCatalog([reference({relatedIds: [id]})])).toThrow(
			/Invalid related reference/,
		);
	});

	it.each(['../secret', 'Yoga Test', 'two--dashes', 'under_score', ''])(
		'rejects invalid reference ID %j',
		id => {
			expect(referenceSchema.safeParse(reference({id})).success).toBe(false);
		},
	);

	it.each([0, -1, 1.5])('rejects invalid revision %s', revision => {
		expect(referenceSchema.safeParse(reference({revision})).success).toBe(false);
	});

	it('rejects repeated step IDs used to attach media and cues', () => {
		const valid = reference();
		expect(() => parseCatalog([{...valid, inputs: [...valid.inputs, ...valid.inputs]}])).toThrow(
			/Step IDs must be unique/,
		);
	});

	it('requires a positive source segment and frames inside its duration', () => {
		const valid = reference();
		for (const end of [9, 10]) {
			expect(referenceSchema.safeParse({...valid, source: {...valid.source, end}}).success).toBe(
				false,
			);
		}
		for (const at of [-0.01, 10, 10.01]) {
			expect(
				referenceSchema.safeParse({
					...valid,
					media: {...valid.media, frames: [{...valid.media.frames[0], at}]},
				}).success,
			).toBe(false);
		}
	});

	it('allows the opening frame and the last available moment of a later source segment', () => {
		const valid = reference();
		for (const at of [0, 9.99]) {
			expect(
				referenceSchema.safeParse({
					...valid,
					media: {...valid.media, frames: [{...valid.media.frames[0], at}]},
				}).success,
			).toBe(true);
		}
	});

	it('requires local media and an allowed tutorial source host', () => {
		const valid = reference();
		expect(
			referenceSchema.safeParse({
				...valid,
				media: {...valid.media, poster: 'https://example.com/image.webp'},
			}).success,
		).toBe(false);
		expect(
			referenceSchema.safeParse({
				...valid,
				source: {...valid.source, url: 'https://www.youtube.com.example.com/watch?v=test'},
			}).success,
		).toBe(false);
	});

	it.each(['/media/../private.txt', '/media/./frame.jpg'])(
		'rejects media directory traversal %s',
		poster => {
			const valid = reference();
			expect(referenceSchema.safeParse({...valid, media: {...valid.media, poster}}).success).toBe(
				false,
			);
		},
	);

	it('requires an HTTPS source', () => {
		const valid = reference();
		expect(
			referenceSchema.safeParse({
				...valid,
				source: {...valid.source, url: 'http://www.youtube.com/watch?v=test'},
			}).success,
		).toBe(false);
	});
});

describe('reference discovery', () => {
	const catalog = [
		reference(),
		reference({
			id: 'anti-air',
			title: 'Air Response',
			summary: 'React to a jump.',
			kind: 'response',
			situations: ['midscreen'],
			notation: 'HP',
			inputs: [{id: 'intercept', notation: 'HP', label: 'Standing heavy punch'}],
		}),
		reference({id: 'corner-setup', title: 'Corner Setup', kind: 'setup'}),
	];

	it('combines search tokens across fields and normalizes punctuation and case', () => {
		expect(filterReferences(catalog, {query: 'YOGA cr.mp'}).map(r => r.id)).toEqual(['yoga-test']);
		expect(filterReferences(catalog, {query: 'standing HEAVY'}).map(r => r.id)).toEqual([
			'anti-air',
		]);
		expect(filterReferences(catalog, {query: 'YOGA missing'})).toEqual([]);
	});

	it('normalizes fullwidth input and treats whitespace-only searches as empty', () => {
		expect(filterReferences(catalog, {query: 'ＹＯＧＡ'}).map(r => r.id)).toEqual(['yoga-test']);
		expect(filterReferences(catalog, {query: '  \n  '})).toEqual(catalog);
	});

	it('intersects saved references with kind and situation', () => {
		const savedIds = new Set(['yoga-test', 'anti-air']);
		expect(
			filterReferences(catalog, {savedIds, kind: 'combo', situation: 'corner'}).map(r => r.id),
		).toEqual(['yoga-test']);
		expect(filterReferences(catalog, {savedIds, kind: 'response', situation: 'corner'})).toEqual(
			[],
		);
		expect(filterReferences(catalog, {savedIds: new Set()})).toEqual([]);
	});

	it('returns all references for the all filters and never reorders the input', () => {
		const before = structuredClone(catalog);
		expect(filterReferences(catalog, {kind: 'all', situation: 'all'})).toEqual(catalog);
		filterReferences(catalog, {kind: 'response'});
		expect(catalog).toEqual(before);
	});

	it('links to the source start without discarding the video ID or mutating the reference', () => {
		const valid = reference();
		valid.source.start = 12.9;
		valid.source.url = 'https://www.youtube.com/watch?v=test&t=99&list=playlist';
		const link = new URL(sourceLink(valid));
		expect(link.searchParams.get('v')).toBe('test');
		expect(link.searchParams.get('t')).toBe('12');
		expect(link.searchParams.get('list')).toBe('playlist');
		expect(valid.source.url).toContain('t=99');
	});
});
