import {gameDefinitionSchema, parseCatalog} from '@hyper-chamber/reference';
import profile from '../../../../content/games/sf6/game.json';
import dhalsim from '../../../../content/games/sf6/references/dhalsim.json';
import ryu from '../../../../content/games/sf6/references/ryu.json';
import akuma from '../../../../content/games/sf6/references/akuma.json';
import manon from '../../../../content/games/sf6/references/manon.json';
import chunli from '../../../../content/games/sf6/references/chunli.json';
import guile from '../../../../content/games/sf6/references/guile.json';

export const game = gameDefinitionSchema.parse(profile);
export const allReferences = parseCatalog(
	[...dhalsim, ...ryu, ...akuma, ...manon, ...chunli, ...guile],
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
