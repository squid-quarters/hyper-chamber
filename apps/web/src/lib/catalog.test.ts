import {readFileSync, readdirSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {allReferences, collections} from './catalog';
import {readCharacterLocation, referenceLocation} from './navigation';

describe('authored character libraries', () => {
	it('offers every authored situation and outcome once regardless of case', () => {
		for (const collection of collections) {
			for (const field of ['situations', 'outcomes'] as const) {
				const options = collection[field].map(value => value.toLowerCase());
				const authored = collection.references.flatMap(reference => reference[field]);
				expect(new Set(options).size, `${collection.name} ${field}`).toBe(options.length);
				expect(new Set(options)).toEqual(new Set(authored.map(value => value.toLowerCase())));
				for (const option of collection[field]) expect(authored).toContain(option);
			}
		}
	});
	it('includes every authored reference file in the reader', () => {
		const directory = new URL('../../../../content/games/sf6/references/', import.meta.url);
		const authoredIds = readdirSync(directory)
			.filter(file => file.endsWith('.json'))
			.flatMap(file => {
				const value: unknown = JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
				if (!Array.isArray(value)) throw new Error(`${file} must contain a reference array`);
				return value.map(reference => reference.id);
			});
		expect(allReferences.map(reference => reference.id).sort()).toEqual(authoredIds.sort());
	});

	it('keeps the default library and opens stable links for every populated character', () => {
		expect(readCharacterLocation('', collections).characterId).toBe('dhalsim');
		for (const collection of collections) {
			expect(collection.references.length, collection.name).toBeGreaterThan(0);
			for (const reference of [collection.references[0], collection.references.at(-1)!]) {
				const url = referenceLocation(
					'https://chamber.test/',
					{
						characterId: collection.id,
						query: '',
						kind: 'all',
						situation: 'all',
						savedOnly: false,
						practice: 'all',
					},
					reference.id,
				);
				url.searchParams.set('character', 'dhalsim');
				expect(readCharacterLocation(url.search, collections)).toMatchObject({
					characterId: collection.id,
					entryId: reference.id,
					invalidCharacter: false,
					invalidEntry: false,
				});
			}
		}
	});
});
