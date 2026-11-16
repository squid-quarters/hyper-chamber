import {error} from '@sveltejs/kit';
import {
	catalogSnapshotSchema,
	gameDefinitionSchema,
	libraryProtocolVersion,
} from '@hyper-chamber/reference';
import {buildCollections} from '#lib/catalog';
import sf6 from '../../../../content/games/sf6/game.json';
import type {PageLoad} from './$types';
export const load: PageLoad = async ({fetch}) => {
	const response = await fetch('/api/catalog');
	if (!response.ok) error(503, 'Your Hyper Chamber library is unavailable.');
	const parsed = catalogSnapshotSchema.safeParse(await response.json());
	if (!parsed.success || !parsed.data.libraryId)
		error(503, 'The installed library could not be read.');
	if (
		parsed.data.protocolVersion !== undefined &&
		parsed.data.protocolVersion !== libraryProtocolVersion
	)
		error(
			503,
			'This library uses a different application version. Reload or update Hyper Chamber.',
		);
	const generation = parsed.data.generation;
	const references = parsed.data.references.map(reference => ({
		...reference,
		media: {
			...reference.media,
			...(reference.media.clip ? {clip: `${reference.media.clip}?generation=${generation}`} : {}),
			poster: `${reference.media.poster}?generation=${generation}`,
			...(reference.media.descriptionTrack
				? {descriptionTrack: `${reference.media.descriptionTrack}?generation=${generation}`}
				: {}),
			frames: reference.media.frames.map(frame => ({
				...frame,
				src: `${frame.src}?generation=${generation}`,
			})),
		},
	}));
	const byId = new Map(references.map(reference => [reference.id, reference]));
	// Validate authored paths before adding reader-only generation URLs.
	const collections = buildCollections(parsed.data.games, parsed.data.references).map(
		collection => ({
			...collection,
			references: collection.references.map(reference => byId.get(reference.id)!),
		}),
	);
	return {
		collections,
		libraryId: parsed.data.libraryId,
		generation,
		fallbackGame: parsed.data.games[0] ?? gameDefinitionSchema.parse(sf6),
	};
};
