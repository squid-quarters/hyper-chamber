import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {allReferences, collections} from './catalog';
import {filterReferences, referenceTagKey} from '@hyper-chamber/reference';
import {readCharacterLocation, referenceLocation} from './navigation';

describe('authored character libraries', () => {
	it('provides a high-resolution generated portrait with identity provenance for every character', () => {
		const value: unknown = JSON.parse(
			readFileSync(new URL('../../../../docs/character-portraits.json', import.meta.url), 'utf8'),
		);
		if (!Array.isArray(value)) throw new Error('Portrait manifest must be an array');
		expect(value.map(entry => entry.id).sort()).toEqual(collections.map(entry => entry.id).sort());
		const files = readdirSync(new URL('../../static/portraits/', import.meta.url))
			.filter(file => file.endsWith('.webp'))
			.sort();
		expect(files).toEqual(collections.map(entry => entry.id + '.webp').sort());
		for (const entry of value) {
			expect(entry.kind).toBe('generated-illustration');
			expect(new URL(entry.sourcePage).protocol).toBe('https:');
			expect(new URL(entry.sourceImageUrl).protocol).toBe('https:');
			expect(entry.reference.width).toBeGreaterThanOrEqual(512);
			expect(entry.reference.height).toBeGreaterThanOrEqual(512);
			expect(entry.reference.sha256).toMatch(/^[a-f0-9]{64}$/);
			expect(entry.generated.tool).toBe('built-in image_gen');
			expect(entry.generated.styleMaster).toBe('dhalsim');
			expect(entry.generated.prompt.length).toBeGreaterThan(100);
			expect(entry.outputPath).toBe('/portraits/' + entry.id + '.webp');
			const output = readFileSync(new URL('../../static' + entry.outputPath, import.meta.url));
			expect(output.toString('ascii', 0, 4)).toBe('RIFF');
			expect(output.toString('ascii', 8, 16)).toBe('WEBPVP8 ');
			// Lossy WebP frame dimensions verify the actual asset, not just manifest claims.
			expect(output.readUInt16LE(26) & 0x3fff, entry.id).toBe(512);
			expect(output.readUInt16LE(28) & 0x3fff, entry.id).toBe(512);
			expect(entry.outputDimensions).toEqual({width: 512, height: 512});
			expect(createHash('sha256').update(output).digest('hex'), entry.id).toBe(entry.outputSha256);
		}
	});

	it('finds Dhalsim’s full-Drive conversions under Cash-out without treating every Super as cash-out', () => {
		const dhalsim = collections.find(collection => collection.id === 'dhalsim')!;
		const cashOut = filterReferences(dhalsim.references, {goal: 'cash-out'}).map(
			reference => reference.id,
		);
		expect(cashOut).toEqual(
			expect.arrayContaining([
				'dhalsim-full-early-light-cash-out',
				'dhalsim-full-early-float-cash-out',
				'dhalsim-full-early-punish-heavy-cash-out',
				'dhalsim-full-early-ball-punish-cash-out',
				'dhalsim-full-early-manual-float-punish',
				'dhalsim-full-late-stun-drive-super-three',
				'dhalsim-full-late-stun-super-two-tail',
				'dhalsim-full-late-held-super-cash-out',
			]),
		);
		expect(cashOut).not.toContain('dhalsim-low-sa3');
		expect(cashOut).not.toContain('dhalsim-full-late-heavy-kick-super-three');
		expect(cashOut).not.toContain('dhalsim-full-late-arch-counter-cash-out');
		expect(
			filterReferences(dhalsim.references, {
				goal: 'cash-out',
				situation: 'Punish Counter',
			}).map(reference => reference.id),
		).toEqual([
			'dhalsim-full-early-punish-heavy-cash-out',
			'dhalsim-full-early-ball-punish-cash-out',
			'dhalsim-full-early-manual-float-punish',
		]);
	});
	it('offers every authored situation and outcome once across case and hyphen spelling variants', () => {
		for (const collection of collections) {
			for (const field of ['situations', 'outcomes'] as const) {
				const options = collection[field].map(referenceTagKey);
				const authored = collection.references.flatMap(reference => reference[field]);
				expect(new Set(options).size, `${collection.name} ${field}`).toBe(options.length);
				expect(new Set(options)).toEqual(new Set(authored.map(referenceTagKey)));
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
