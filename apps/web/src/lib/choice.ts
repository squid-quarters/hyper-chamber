export type ChoiceOption = {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
};

export function initialChoiceIndex(options: readonly ChoiceOption[], value: string): number {
	const selected = options.findIndex(option => option.value === value && !option.disabled);
	return selected >= 0 ? selected : options.findIndex(option => !option.disabled);
}

/** Move through enabled choices without wrapping at either end. */
export function moveChoiceIndex(
	options: readonly ChoiceOption[],
	current: number,
	step: number,
): number {
	const enabled = options.flatMap((option, index) => (option.disabled ? [] : [index]));
	if (!enabled.length) return -1;
	const position = enabled.indexOf(current);
	if (position < 0) return step < 0 ? enabled[enabled.length - 1] : enabled[0];
	return enabled[Math.max(0, Math.min(enabled.length - 1, position + step))];
}

function searchText(value: string): string {
	return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}

/** Repeated characters cycle; a longer prefix continues searching from the active choice. */
export function typeaheadChoiceIndex(
	options: readonly ChoiceOption[],
	query: string,
	current: number,
): number {
	const characters = [...searchText(query)];
	if (!characters.length || !options.length) return -1;
	const repeating = characters.every(character => character === characters[0]);
	const prefix = repeating ? characters[0] : characters.join('');
	const start = repeating ? current + 1 : Math.max(0, current);
	for (let offset = 0; offset < options.length; offset += 1) {
		const index = (Math.max(0, start) + offset) % options.length;
		const option = options[index];
		if (!option.disabled && searchText(option.label).trimStart().startsWith(prefix)) return index;
	}
	return -1;
}
