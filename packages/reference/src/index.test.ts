import {describe, expect, it} from 'vitest';
import {
	filterReferences,
	gameDefinitionSchema,
	parseCatalog,
	referenceSchema,
	sourceLink,
	type GameDefinition,
	type Reference,
} from './index';

function game(patch: Partial<GameDefinition> = {}): GameDefinition {
	return {
		id: 'sf6',
		name: 'Street Fighter 6',
		resourceLabels: {drive: 'Drive', super: 'Super'},
		notation: {
			description: 'Directions assume the character faces right.',
			numpad: true,
			legend: [{term: 'LP', meaning: 'Light punch'}],
		},
		guides: [{label: 'Reference guide', url: 'https://example.test/guide'}],
		characters: [{id: 'dhalsim', name: 'Dhalsim'}],
		...patch,
	};
}

function reference(patch: Partial<Reference> = {}): Reference {
	return {
		id: 'yoga-test',
		gameId: 'sf6',
		participants: [{id: 'main', characterId: 'dhalsim'}],
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
		for (const url of ['http://www.youtube.com/watch?v=test', '/video', 'not-a-url']) {
			expect(referenceSchema.safeParse({...valid, source: {...valid.source, url}}).success).toBe(
				false,
			);
		}
	});
});

describe('game definitions and participant context', () => {
	const fictionalGame = game({
		id: 'test-arena',
		name: 'Fictional Pair Arena',
		resourceLabels: {energy: 'Energy', teamwork: 'Teamwork'},
		notation: {
			description: 'Fictional test notation.',
			numpad: false,
			legend: [{term: 'A', meaning: 'Action button A'}],
		},
		guides: [],
		characters: [
			{id: 'alpha', name: 'Alpha'},
			{id: 'beta', name: 'Beta'},
		],
	});
	function teamReference(patch: Partial<Reference> = {}): Reference {
		return reference({
			id: 'team-sequence',
			gameId: 'test-arena',
			participants: [
				{id: 'lead', characterId: 'alpha'},
				{id: 'partner', characterId: 'beta'},
			],
			notation: 'A > B',
			inputs: [
				{id: 'opening', actorId: 'lead', notation: 'A', label: 'Opening action'},
				{id: 'handoff', actorId: 'partner', notation: 'B', label: 'Partner follow-up'},
			],
			resources: {energy: 'Available', teamwork: 'Available'},
			...patch,
		});
	}

	it('accepts a new game identity, custom notation and resources without a global game enum', () => {
		expect(gameDefinitionSchema.parse(fictionalGame)).toEqual(fictionalGame);
		const team = teamReference();
		expect(parseCatalog([team], [fictionalGame])).toEqual([team]);
	});

	it.each(['http://example.test/guide', 'javascript:alert(1)', '/guide'])(
		'rejects a guide URL that is not HTTPS: %s',
		url => {
			expect(gameDefinitionSchema.safeParse(game({guides: [{label: 'Guide', url}]})).success).toBe(
				false,
			);
		},
	);

	it('rejects invalid game, character and resource identifiers', () => {
		expect(gameDefinitionSchema.safeParse(game({id: '../game'})).success).toBe(false);
		expect(
			gameDefinitionSchema.safeParse(game({characters: [{id: 'Invalid Character', name: 'Name'}]}))
				.success,
		).toBe(false);
		for (const key of ['Invalid Resource', '__proto__']) {
			expect(
				gameDefinitionSchema.safeParse(game({resourceLabels: Object.fromEntries([[key, 'Label']])}))
					.success,
			).toBe(false);
		}
	});

	it('rejects duplicate character identities within a game and duplicate game profiles', () => {
		expect(
			gameDefinitionSchema.safeParse(
				game({characters: [game().characters[0], game().characters[0]]}),
			).success,
		).toBe(false);
		expect(() => parseCatalog([reference()], [game(), game()])).toThrow(/Game IDs must be unique/);
	});

	it('keeps the existing single-participant reference and revision intact', () => {
		const single = reference();
		expect(parseCatalog([single], [game()])).toEqual([single]);
		expect(single.inputs[0].actorId).toBeUndefined();
		expect(single.id).toBe('yoga-test');
		expect(single.revision).toBe(1);
	});

	it('requires game and participant identity and rejects duplicate participant IDs', () => {
		const {gameId: _gameId, ...missingGame} = reference();
		expect(referenceSchema.safeParse(missingGame).success).toBe(false);
		expect(referenceSchema.safeParse(reference({gameId: 'Invalid Game'})).success).toBe(false);
		expect(referenceSchema.safeParse(reference({participants: []})).success).toBe(false);
		expect(() =>
			parseCatalog([
				teamReference({
					participants: [
						{id: 'lead', characterId: 'alpha'},
						{id: 'lead', characterId: 'beta'},
					],
				}),
			]),
		).toThrow(/Participant IDs must be unique/);
	});

	it('requires every step in a multi-participant sequence to identify its actor', () => {
		const team = teamReference();
		const {actorId: _actorId, ...unattributed} = team.inputs[1];
		expect(() => parseCatalog([{...team, inputs: [team.inputs[0], unattributed]}])).toThrow(
			/actor/i,
		);
	});

	it('rejects an actor outside the reference participants even for a single participant', () => {
		const single = reference();
		expect(() =>
			parseCatalog([{...single, inputs: [{...single.inputs[0], actorId: 'unknown'}]}]),
		).toThrow(/actor/i);
	});

	it('validates game membership only when profiles are supplied', () => {
		const unknown = reference({gameId: 'another-game'});
		expect(parseCatalog([unknown])).toEqual([unknown]);
		expect(() => parseCatalog([unknown], [game()])).toThrow(/Unknown game/);
		expect(() => parseCatalog([reference()], [])).toThrow(/Unknown game/);
	});

	it('validates each participant’s character against its own game', () => {
		const invalid = reference({participants: [{id: 'main', characterId: 'alpha'}]});
		expect(() => parseCatalog([invalid], [game(), fictionalGame])).toThrow(/character/i);
		expect(parseCatalog([invalid])).toEqual([invalid]);
	});

	it('retains arbitrary resource fields without profiles and rejects unregistered resources with profiles', () => {
		const custom = reference({resources: {unregistered: 'Available'}});
		expect(parseCatalog([custom])[0].resources).toEqual({unregistered: 'Available'});
		expect(() => parseCatalog([custom], [game()])).toThrow(/resource/i);
		const wrongGameResources = teamReference({resources: {drive: 'Available'}});
		expect(() => parseCatalog([wrongGameResources], [fictionalGame])).toThrow(/resource/i);
		const reservedKey = reference({resources: Object.fromEntries([['__proto__', 'Available']])});
		expect(() => parseCatalog([reservedKey], [game()])).toThrow(/resource/i);
	});

	it('rejects related references in another game even without registered profiles', () => {
		const first = reference({relatedIds: ['team-sequence']});
		expect(() => parseCatalog([first, teamReference()])).toThrow(/same game/i);
		expect(() => parseCatalog([first, teamReference()], [game(), fictionalGame])).toThrow(
			/same game/i,
		);
	});

	it('keeps reference IDs globally unique across games', () => {
		expect(() =>
			parseCatalog([reference(), teamReference({id: 'yoga-test'})], [game(), fictionalGame]),
		).toThrow(/Reference IDs must be unique/);
	});

	it('combines a game filter with text, kind, situation and saved filters', () => {
		const first = reference();
		const team = teamReference({title: 'Yoga Team Test'});
		const catalog = [first, team];
		expect(
			filterReferences(catalog, {
				gameId: 'test-arena',
				query: 'Yoga',
				kind: 'combo',
				situation: 'corner',
				savedIds: new Set([first.id, team.id]),
			}),
		).toEqual([team]);
		expect(filterReferences(catalog, {gameId: 'sf6', savedIds: new Set([team.id])})).toEqual([]);
		expect(filterReferences(catalog, {gameId: 'unknown'})).toEqual([]);
		expect(filterReferences(catalog)).toEqual(catalog);
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
