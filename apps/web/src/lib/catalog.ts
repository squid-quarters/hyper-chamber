import {gameDefinitionSchema, parseCatalog} from '@hyper-chamber/reference';
import profile from '../../../../content/games/sf6/game.json';
import raw from '../../../../content/games/sf6/references/dhalsim.json';

export const game = gameDefinitionSchema.parse(profile);
export const references = parseCatalog(raw, [game]);
const characterIds = [
	...new Set(
		references.flatMap(reference =>
			reference.participants.map(participant => participant.characterId),
		),
	),
];
export const subjectName = characterIds
	.map(id => game.characters.find(character => character.id === id)!.name)
	.join(' + ');
