import {
	parseCatalog,
	referenceTagKey,
	type GameDefinition,
	type Reference,
} from '@hyper-chamber/reference';

function distinctTags(tags: string[]): string[] {
	const values = new Map<string, string>();
	for (const tag of tags)
		if (!values.has(referenceTagKey(tag))) values.set(referenceTagKey(tag), tag);
	return [...values.values()].sort((left, right) => left.localeCompare(right));
}
/** Catalogs are loaded from installed packs, independently of the UI build. */
export function buildCollections(games: GameDefinition[], input: unknown) {
	const references = parseCatalog(input, games);
	return games
		.flatMap(game =>
			game.characters.map(character => {
				const entries = references.filter(
					reference =>
						reference.gameId === game.id &&
						reference.participants.some(participant => participant.characterId === character.id),
				);
				return {
					id: game.id === 'sf6' ? character.id : `${game.id}:${character.id}`,
					characterId: character.id,
					name: character.name,
					references: entries,
					referenceIds: new Set(entries.map(reference => reference.id)),
					situations: distinctTags(entries.flatMap(reference => reference.situations)),
					outcomes: distinctTags(entries.flatMap(reference => reference.outcomes)),
					game: {
						...game,
						guides: character.guides ?? game.guides,
						notation: {
							...game.notation,
							legend: [...game.notation.legend, ...(character.notationLegend ?? [])],
						},
					},
				};
			}),
		)
		.filter(collection => collection.references.length > 0);
}
export type CharacterCollection = ReturnType<typeof buildCollections>[number];
export type CatalogReference = Reference;
