import {describe, expect, it} from 'vitest';
import {referenceSchema, type Reference} from '@hyper-chamber/reference';
import {
	mediaForClip,
	nextPackEdition,
	participantsForCharacter,
	publicationForSource,
	sameSourceIdentity,
	sourceFieldsForKind,
	sourceForReference,
} from './creator';

describe('editing recorded references', () => {
	const existing = {
		clip: '/media/old/clip.mp4',
		hasAudio: true,
		descriptionTrack: '/media/old/descriptions.vtt',
		poster: '/media/old/poster.jpg',
		frames: [],
	};
	it('retains accessible descriptions when editing the same recording', () => {
		const result = mediaForClip(existing, {
			clip: existing.clip,
			hasAudio: existing.hasAudio,
			poster: existing.poster,
			frames: existing.frames,
		});
		expect(result.descriptionTrack).toBe(existing.descriptionTrack);
	});
	it('clears descriptions from a replaced recording and uses its explicit audio choice', () => {
		const result = mediaForClip(existing, {
			clip: '/media/new/clip.mp4',
			hasAudio: false,
			poster: '/media/new/poster.jpg',
			frames: [],
		});
		expect(result.descriptionTrack).toBeUndefined();
		expect(result.hasAudio).toBe(false);
	});
});

it('advances exported editions without numeric rounding or reusing pre-release editions', () => {
	for (const version of ['1.0.0', '1.0.0-beta.1', '1.0.0+build.1'])
		expect(nextPackEdition(version)).toBe('1.0.1');
	expect(nextPackEdition('1.0.9007199254740993')).toBe('1.0.9007199254740994');
	expect(() => nextPackEdition('invalid')).toThrow();
});

describe('changing an imported reference character', () => {
	function reference(participants: Reference['participants']): Reference {
		return referenceSchema.parse({
			id: 'actor-link-test',
			gameId: 'sf6',
			revision: 1,
			participants,
			title: 'Synthetic actor-link test',
			summary: 'Schema regression, not gameplay.',
			kind: 'combo',
			situations: [],
			outcomes: [],
			notation: '5LP > 5LK',
			inputs: participants.map((actor, index) => ({
				id: `step-${index}`,
				notation: '5LP',
				label: 'Placeholder input',
				actorId: actor.id,
			})),
			conditions: [],
			notes: [],
			resources: {},
			source: {
				id: 'test-recording',
				kind: 'recording',
				title: 'Synthetic test',
				creator: 'Test fixture',
				published: '',
				start: 0,
				end: 1,
			},
			verification: {status: 'draft', gameVersion: null, note: 'Technical fixture only.'},
			media: {
				clip: '/media/test/clip.mp4',
				poster: '/media/test/poster.jpg',
				frames: [
					{
						id: 'start',
						src: '/media/test/poster.jpg',
						alt: 'Synthetic test',
						label: 'Start',
						at: 0,
					},
				],
			},
			relatedIds: [],
		});
	}
	for (const actors of [
		[{id: 'p1', characterId: 'dhalsim'}],
		[
			{id: 'p1', characterId: 'dhalsim'},
			{id: 'p2', characterId: 'ryu'},
		],
	]) {
		it(`preserves step actor links for ${actors.length} participant(s)`, () => {
			const original = reference(actors);
			const result = referenceSchema.parse({
				...original,
				participants: participantsForCharacter(original.participants, 'akuma'),
			});
			expect(result.participants).toEqual(
				actors.map((actor, index) => (index === 0 ? {...actor, characterId: 'akuma'} : actor)),
			);
			expect(result.inputs).toEqual(original.inputs);
			expect(original.participants).toEqual(actors);
		});
	}
	it('uses the main actor for a new reference', () => {
		expect(participantsForCharacter(undefined, 'dhalsim')).toEqual([
			{id: 'main', characterId: 'dhalsim'},
		]);
	});
});

describe('recording and YouTube provenance', () => {
	const context = {
		id: 'source-test',
		title: 'Combo title',
		creator: 'Pack author',
		published: '',
		start: 3,
		end: 7,
	};
	const youtube = {
		sourceKind: 'youtube' as const,
		sourceTitle: 'Original video title',
		sourceCreator: 'Original video creator',
		sourceUrl: 'https://www.youtube.com/watch?v=UW6GlWHKy7o',
	};
	for (const field of ['sourceTitle', 'sourceCreator', 'sourceUrl'] as const) {
		it(`requires explicit YouTube ${field}`, () => {
			expect(() =>
				referenceSchema.shape.source.parse(
					sourceForReference({...youtube, [field]: '   '}, context),
				),
			).toThrow();
		});
	}
	it('keeps explicitly supplied YouTube attribution', () => {
		expect(referenceSchema.shape.source.parse(sourceForReference(youtube, context))).toMatchObject({
			kind: 'youtube',
			title: youtube.sourceTitle,
			creator: youtube.sourceCreator,
			url: youtube.sourceUrl,
			start: 3,
			end: 7,
		});
	});
	it('clears recording defaults before accepting YouTube attribution', () => {
		expect(
			sourceFieldsForKind(
				{
					sourceKind: 'recording',
					sourceTitle: 'My recording',
					sourceCreator: 'Pack author',
					sourceUrl: '',
				},
				'youtube',
				'Pack author',
			),
		).toEqual({sourceKind: 'youtube', sourceTitle: '', sourceCreator: '', sourceUrl: ''});
	});
	it('keeps explicit source fields when the source kind stays the same', () => {
		expect(sourceFieldsForKind(youtube, 'youtube', 'Pack author')).toEqual(youtube);
	});
	it('uses natural defaults only for own recordings', () => {
		const fields = sourceFieldsForKind(youtube, 'recording', 'Pack author');
		expect(fields).toEqual({
			sourceKind: 'recording',
			sourceTitle: '',
			sourceCreator: 'Pack author',
			sourceUrl: '',
		});
		expect(referenceSchema.shape.source.parse(sourceForReference(fields, context))).toMatchObject({
			kind: 'recording',
			title: 'Combo title',
			creator: 'Pack author',
		});
	});
});

describe('inherited source publication dates', () => {
	const fields = {
		sourceKind: 'youtube' as const,
		sourceTitle: 'Original video title',
		sourceCreator: 'Original creator',
		sourceUrl: 'https://www.youtube.com/watch?v=UW6GlWHKy7o',
	};
	const clip = '/media/original/clip.mp4';
	const previous = {
		source: {
			id: 'original-source',
			title: fields.sourceTitle,
			creator: fields.sourceCreator,
			url: fields.sourceUrl,
			published: '2025-11-07',
			start: 3,
			end: 7,
		},
		media: {clip, poster: '/media/original/poster.jpg', frames: []},
	};
	it('keeps a legacy YouTube date for an unchanged recording/source during copy edits', () => {
		expect(
			publicationForSource(previous, {...fields, sourceTitle: 'Corrected video title'}, clip),
		).toBe('2025-11-07');
	});
	it('normalizes optional URLs without treating a changed URL as the same reviewed source', () => {
		expect(
			sameSourceIdentity(previous, {...fields, sourceUrl: `  ${fields.sourceUrl}  `}, clip),
		).toBe(true);
		expect(
			sameSourceIdentity(
				previous,
				{...fields, sourceUrl: 'https://www.youtube.com/watch?v=another-video'},
				clip,
			),
		).toBe(false);
	});
	it('clears a date when source kind changes', () => {
		expect(publicationForSource(previous, {...fields, sourceKind: 'recording'}, clip)).toBe('');
	});
	it('clears a date when source URL changes', () => {
		expect(
			publicationForSource(
				previous,
				{...fields, sourceUrl: 'https://www.youtube.com/watch?v=another-video'},
				clip,
			),
		).toBe('');
	});
	it('clears a date when the recording changes', () => {
		expect(publicationForSource(previous, fields, '/media/replacement/clip.mp4')).toBe('');
	});
});
