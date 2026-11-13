// Authored data is a test fixture, never part of the application client bundle.
import {gameDefinitionSchema, parseCatalog} from '@hyper-chamber/reference';
import profile from '../../../../content/games/sf6/game.json';
import {buildCollections} from './catalog';
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
export const collections = buildCollections([game], allReferences);
