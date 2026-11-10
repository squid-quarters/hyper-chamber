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
const empty: LibraryFilters = {
	query: '',
	kind: 'all',
	situation: 'all',
	savedOnly: false,
	practice: 'all',
};

describe('reference navigation', () => {
	const collections = [
		{id: 'dhalsim', referenceIds: ids, situations},
		{id: 'ryu', referenceIds: new Set(['ryu-lights', 'ryu-oki']), situations: ['Oki']},
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
			expect(readReferenceLocation(url.search, ids, situations)).toEqual({
				...filters,
				entryId,
				invalidEntry: false,
			});
			expect(url.searchParams.get('campaign')).toBe('local');
			expect(url.hash).toBe('');
		}
	});

	it('clears stale filter parameters when reset', () => {
		const url = referenceLocation(
			'https://chamber.test/?entry=lights&q=fire&kind=combo&situation=Midscreen&saved=1&practice=untried',
			empty,
			null,
		);
		expect(url.search).toBe('');
	});
});
