import {gameDefinitionSchema, parseCatalog} from '@hyper-chamber/reference';
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
export const collections = game.characters.map(character => {
	const references = allReferences.filter(reference =>
		reference.participants.some(participant => participant.characterId === character.id),
	);
	return {
		id: character.id,
		name: character.name,
		references,
		referenceIds: new Set(references.map(reference => reference.id)),
		situations: [...new Set(references.flatMap(reference => reference.situations))].sort(),
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
