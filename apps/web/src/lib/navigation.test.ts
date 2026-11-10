import {describe, expect, it} from 'vitest';
import {
	readLibraryReturn,
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
