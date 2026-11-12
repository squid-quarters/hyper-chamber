import {describe, expect, it} from 'vitest';
import {initialChoiceIndex, moveChoiceIndex, typeaheadChoiceIndex} from './choice';

const options = [
	{value: 'apple', label: 'Apple'},
	{value: 'apricot', label: 'Apricot', disabled: true},
	{value: 'banana', label: 'Banana'},
	{value: 'blueberry', label: 'Blueberry'},
	{value: 'eclair', label: 'Éclair'},
];

describe('choice navigation', () => {
	it('starts at the committed enabled choice and recovers a missing or disabled value', () => {
		expect(initialChoiceIndex(options, 'blueberry')).toBe(3);
		expect(initialChoiceIndex(options, 'apricot')).toBe(0);
		expect(initialChoiceIndex(options, 'missing')).toBe(0);
	});

	it('skips disabled choices and clamps arrows and page-sized movement at the ends', () => {
		expect(moveChoiceIndex(options, 0, 1)).toBe(2);
		expect(moveChoiceIndex(options, 2, -1)).toBe(0);
		expect(moveChoiceIndex(options, 0, -1)).toBe(0);
		expect(moveChoiceIndex(options, 4, 1)).toBe(4);
		expect(moveChoiceIndex(options, 0, 10)).toBe(4);
		expect(moveChoiceIndex(options, 4, -10)).toBe(0);
	});

	it('has no active choice for empty or entirely disabled lists', () => {
		const unavailable = [{value: 'a', label: 'A', disabled: true}];
		for (const choices of [[], unavailable]) {
			expect(initialChoiceIndex(choices, 'a')).toBe(-1);
			expect(moveChoiceIndex(choices, -1, 1)).toBe(-1);
			expect(typeaheadChoiceIndex(choices, 'a', -1)).toBe(-1);
		}
	});
});

describe('choice typeahead', () => {
	it('cycles repeated letters through enabled matches, including across the list boundary', () => {
		expect(typeaheadChoiceIndex(options, 'b', 0)).toBe(2);
		expect(typeaheadChoiceIndex(options, 'bb', 2)).toBe(3);
		expect(typeaheadChoiceIndex(options, 'bbb', 3)).toBe(2);
		expect(typeaheadChoiceIndex(options, 'a', 0)).toBe(0);
	});

	it('keeps a prefix on the active match and searches longer prefixes without committing', () => {
		expect(typeaheadChoiceIndex(options, 'ba', 2)).toBe(2);
		expect(typeaheadChoiceIndex(options, 'bl', 2)).toBe(3);
		expect(typeaheadChoiceIndex(options, 'apri', 0)).toBe(-1);
		expect(typeaheadChoiceIndex(options, 'missing', 0)).toBe(-1);
	});

	it('matches case and accented labels without requiring accented keyboard input', () => {
		expect(typeaheadChoiceIndex(options, 'ECL', 0)).toBe(4);
	});
});
