import {describe, expect, it} from 'vitest';
import {
	readLibraryReturn,
	readCharacterLocation,
	readReferenceLocation,
	referenceLocation,
	type LibraryFilters,
} from './navigation';

const ids = new Set(['lights', 'punish']);
const situations = ['Midscreen', 'Punish Counter'];
const outcomes = ['Knockdown', 'Corner carry'];
const empty: LibraryFilters = {
	query: '',
	kind: 'all',
	situation: 'all',
	outcome: 'all',
	goal: 'all',
	savedOnly: false,
	practice: 'all',
};

describe('reference navigation', () => {
	const collections = [
		{id: 'dhalsim', referenceIds: ids, situations, outcomes: ['Knockdown']},
		{id: 'ryu', referenceIds: new Set(['ryu-lights', 'ryu-oki']), situations: ['Oki'], outcomes},
		{id: 'akuma', referenceIds: new Set(['akuma-lights', 'akuma-oki']), situations: ['Corner']},
	];
	it('defaults to Dhalsim and preserves legacy entry links', () => {
		expect(readCharacterLocation('', collections)).toMatchObject({
			characterId: 'dhalsim',
			entryId: null,
			invalidCharacter: false,
		});
		expect(readCharacterLocation('?entry=lights', collections)).toMatchObject({
			characterId: 'dhalsim',
			entryId: 'lights',
			invalidEntry: false,
		});
	});
	it('opens a character-only URL in its library and validates its own situations', () => {
		expect(readCharacterLocation('?character=ryu&situation=Oki', collections)).toMatchObject({
			characterId: 'ryu',
			entryId: null,
			situation: 'Oki',
		});
		expect(readCharacterLocation('?character=ryu&situation=Midscreen', collections).situation).toBe(
			'all',
		);
	});
	it('infers the library from a stable entry even without a character or with a stale one', () => {
		for (const search of ['?entry=ryu-lights', '?character=dhalsim&entry=ryu-lights']) {
			expect(readCharacterLocation(search, collections)).toMatchObject({
				characterId: 'ryu',
				entryId: 'ryu-lights',
				invalidEntry: false,
			});
		}
	});
	it('validates outcomes against the resolved character and restores case-equivalent facets', () => {
		expect(
			readCharacterLocation(
				'?entry=ryu-lights&outcome=CORNER+carry&goal=corner-carry',
				collections,
			),
		).toMatchObject({
			characterId: 'ryu',
			outcome: 'Corner carry',
			goal: 'corner-carry',
		});
		expect(
			readCharacterLocation('?character=dhalsim&outcome=Corner+carry', collections).outcome,
		).toBe('all');
		expect(readCharacterLocation('?situation=punish+counter', collections).situation).toBe(
			'Punish Counter',
		);
	});
	it('reports unavailable characters and entries without opening an unrelated reference', () => {
		expect(
			readCharacterLocation('?character=missing&entry=removed&q=fire', collections),
		).toMatchObject({
			characterId: 'dhalsim',
			entryId: null,
			query: 'fire',
			invalidCharacter: true,
			invalidEntry: true,
		});
		expect(readCharacterLocation('?character=missing&entry=ryu-oki', collections)).toMatchObject({
			characterId: 'ryu',
			entryId: 'ryu-oki',
			invalidCharacter: true,
		});
		expect(readCharacterLocation('?character=ryu&entry=removed', collections)).toMatchObject({
			characterId: 'ryu',
			entryId: null,
			invalidCharacter: false,
			invalidEntry: true,
		});
	});
	it('preserves Ryu context when entering, switching and returning to a filtered set', () => {
		const filters = {...empty, characterId: 'ryu', savedOnly: true, query: 'Tatsu'};
		let url = new URL('https://chamber.test/');
		for (const entry of ['ryu-lights', 'ryu-oki', null]) {
			url = referenceLocation(url.href, filters, entry);
			expect(url.searchParams.get('character')).toBe('ryu');
			expect(readCharacterLocation(url.search, collections)).toMatchObject({
				characterId: 'ryu',
				entryId: entry,
				savedOnly: true,
				query: 'Tatsu',
			});
		}
	});
	it('removes old character context when returning to the default library', () => {
		const url = referenceLocation(
			'https://chamber.test/?character=ryu&entry=ryu-oki',
			{...empty, characterId: 'dhalsim'},
			null,
		);
		expect(url.search).toBe('');
	});
	it('opens a third library and infers it from entry links shared from another character', () => {
		expect(readCharacterLocation('?character=akuma&situation=Corner', collections)).toMatchObject({
			characterId: 'akuma',
			entryId: null,
			situation: 'Corner',
		});
		for (const search of ['?entry=akuma-lights', '?character=ryu&entry=akuma-lights']) {
			expect(readCharacterLocation(search, collections)).toMatchObject({
				characterId: 'akuma',
				entryId: 'akuma-lights',
				invalidEntry: false,
				invalidCharacter: false,
			});
		}
	});
	it('keeps third-library filters when returning from practice without a stale entry', () => {
		const filters = {...empty, characterId: 'akuma', situation: 'Corner', query: 'Flame'};
		const opened = referenceLocation('https://chamber.test/?character=ryu', filters, 'akuma-oki');
		const returned = referenceLocation(opened.href, filters, null);
		expect(readCharacterLocation(returned.search, collections)).toMatchObject({
			characterId: 'akuma',
			entryId: null,
			situation: 'Corner',
			query: 'Flame',
		});
		expect(returned.searchParams.has('entry')).toBe(false);
	});
	it('rejects a history bookmark that belongs to another character library', () => {
		expect(
			readLibraryReturn({key: 'ryu-visit', scrollY: 200, entryId: 'ryu-oki'}, ids),
		).toBeUndefined();
	});
	it('fails explicitly when no character libraries are configured', () => {
		expect(() => readCharacterLocation('', [])).toThrow('At least one character library');
	});
	it('preserves an independent history bookmark without sharing its mutable object', () => {
		const old = {key: 'visit-a', scrollY: 1022, entryId: 'lights'};
		const newer = {key: 'visit-b', scrollY: 0, entryId: 'punish'};
		expect(readLibraryReturn(old, ids)).toEqual(old);
		expect(readLibraryReturn(newer, ids)).toEqual(newer);
		expect(readLibraryReturn(old, ids)).not.toBe(old);
	});

	it('ignores missing or malformed history bookmarks', () => {
		for (const value of [
			undefined,
			null,
			{},
			{key: 'a', scrollY: -1, entryId: null},
			{key: 'a', scrollY: NaN, entryId: null},
			{key: 'a', scrollY: 0, entryId: 'removed'},
		]) {
			expect(readLibraryReturn(value, ids)).toBeUndefined();
		}
	});

	it('keeps an ordinary filtered library URL in the library', () => {
		const url = referenceLocation(
			'https://chamber.test/?entry=lights',
			{...empty, query: 'fire'},
			null,
		);
		expect(url.searchParams.get('entry')).toBeNull();
		expect(readReferenceLocation(url.search, ids, situations).entryId).toBeNull();
		expect(url.searchParams.get('q')).toBe('fire');
	});

	it('opens existing entry links with all filters intact', () => {
		expect(
			readReferenceLocation(
				'?entry=punish&q=Yoga+Fire&kind=combo&situation=Punish+Counter&saved=1&practice=practising',
				ids,
				situations,
			),
		).toEqual({
			query: 'Yoga Fire',
			kind: 'combo',
			situation: 'Punish Counter',
			outcome: 'all',
			goal: 'all',
			savedOnly: true,
			practice: 'practising',
			entryId: 'punish',
			invalidEntry: false,
		});
	});

	it('returns unknown entries to the library without discarding valid filters', () => {
		expect(
			readReferenceLocation('?entry=removed&kind=setup&situation=Midscreen', ids, situations),
		).toEqual({
			...empty,
			kind: 'setup',
			situation: 'Midscreen',
			entryId: null,
			invalidEntry: true,
		});
	});

	it('normalizes unsupported filters and empty entry parameters', () => {
		expect(
			readReferenceLocation(
				'?entry=&kind=other&situation=removed&practice=mastered&saved=yes',
				ids,
				situations,
			),
		).toEqual({
			...empty,
			entryId: null,
			invalidEntry: false,
		});
	});

	it('round-trips every filter while switching references and returning', () => {
		const filters: LibraryFilters = {
			query: 'OD & SA1',
			kind: 'response',
			situation: 'Midscreen',
			outcome: 'Corner carry',
			goal: 'corner-carry',
			savedOnly: true,
			practice: 'reliable',
		};
		const first = referenceLocation(
			'https://chamber.test/?campaign=local#reference',
			filters,
			'lights',
		);
		const next = referenceLocation(first.href, filters, 'punish');
		const back = referenceLocation(next.href, filters, null);
		for (const [url, entryId] of [
			[first, 'lights'],
			[next, 'punish'],
			[back, null],
		] as const) {
			expect(readReferenceLocation(url.search, ids, situations, outcomes)).toEqual({
				...filters,
				entryId,
				invalidEntry: false,
			});
			expect(url.searchParams.get('campaign')).toBe('local');
			expect(url.hash).toBe('');
		}
	});
	it('accepts supported goals and rejects unknown goals or outcomes without dropping valid filters', () => {
		expect(
			readReferenceLocation('?goal=punishes&outcome=knockdown', ids, situations, outcomes),
		).toMatchObject({
			goal: 'punishes',
			outcome: 'Knockdown',
		});
		expect(
			readReferenceLocation('?goal=damage&outcome=missing&kind=combo', ids, situations, outcomes),
		).toMatchObject({
			goal: 'all',
			outcome: 'all',
			kind: 'combo',
		});
		expect(readReferenceLocation('?outcome=Knockdown', ids, situations).outcome).toBe('all');
	});

	it('preserves every authored-tag goal through entry navigation and return to library', () => {
		for (const goal of ['oki', 'anti-air', 'cash-out'] as const) {
			const opened = referenceLocation('https://chamber.test/', {...empty, goal}, 'lights');
			expect(readReferenceLocation(opened.search, ids, situations).goal).toBe(goal);
			const returned = referenceLocation(opened.href, {...empty, goal}, null);
			expect(readReferenceLocation(returned.search, ids, situations)).toMatchObject({
				goal,
				entryId: null,
			});
		}
	});
	it('restores a hyphen-equivalent source tag without equating different gameplay terms', () => {
		expect(readReferenceLocation('?situation=Cash+out', ids, ['Cash-out']).situation).toBe(
			'Cash-out',
		);
		expect(readReferenceLocation('?situation=Command+grab', ids, ['Command throw']).situation).toBe(
			'all',
		);
	});

	it('clears stale filter parameters when reset', () => {
		const url = referenceLocation(
			'https://chamber.test/?entry=lights&q=fire&kind=combo&situation=Midscreen&outcome=Knockdown&goal=punishes&saved=1&practice=untried',
			empty,
			null,
		);
		expect(url.search).toBe('');
	});
});
