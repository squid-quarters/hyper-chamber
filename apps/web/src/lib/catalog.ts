import {gameDefinitionSchema, parseCatalog, referenceTagKey} from '@hyper-chamber/reference';
import profile from '../../../../content/games/sf6/game.json';

const catalogs = import.meta.glob<unknown>('../../../../content/games/sf6/references/*.json', {
	eager: true,
	import: 'default',
});

export const game = gameDefinitionSchema.parse(profile);
export const allReferences = parseCatalog(
	Object.keys(catalogs)
		.sort()
		.flatMap(path => {
			const value = catalogs[path];
			if (!Array.isArray(value)) throw new Error(`${path} must contain a reference array`);
			return value;
		}),
	[game],
);
function distinctTags(tags: string[]): string[] {
	const values = new Map<string, string>();
	for (const tag of tags)
		if (!values.has(referenceTagKey(tag))) values.set(referenceTagKey(tag), tag);
	return [...values.values()].sort((left, right) => left.localeCompare(right));
}
export const collections = game.characters.map(character => {
	const references = allReferences.filter(reference =>
		reference.participants.some(participant => participant.characterId === character.id),
	);
	return {
		id: character.id,
		name: character.name,
		references,
		referenceIds: new Set(references.map(reference => reference.id)),
		situations: distinctTags(references.flatMap(reference => reference.situations)),
		outcomes: distinctTags(references.flatMap(reference => reference.outcomes)),
		game: {
			...game,
			guides: character.guides ?? game.guides,
			notation: {
				...game.notation,
				legend: [...game.notation.legend, ...(character.notationLegend ?? [])],
			},
		},
	};
});
