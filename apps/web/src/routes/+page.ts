import {error} from '@sveltejs/kit';
import {catalogSnapshotSchema} from '@hyper-chamber/reference';
import {buildCollections} from '#lib/catalog';
import type {PageLoad} from './$types';
export const load: PageLoad = async ({fetch}) => {
	const response = await fetch('/api/catalog');
	if (!response.ok) error(503, 'Your Hyper Chamber library is unavailable.');
	const parsed = catalogSnapshotSchema.safeParse(await response.json());
	if (!parsed.success || !parsed.data.libraryId)
		error(503, 'The installed library could not be read.');
	const collections = buildCollections(parsed.data.games, parsed.data.references);
	if (!collections.length)
		error(
			503,
			'No reference content is installed yet. Open the desktop app to import a content pack.',
		);
	return {collections, libraryId: parsed.data.libraryId};
};
