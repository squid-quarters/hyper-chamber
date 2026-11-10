import {readFile, readdir, stat} from 'node:fs/promises';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gameDefinitionSchema, parseCatalog} from '../packages/reference/src/index.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const game = gameDefinitionSchema.parse(
	JSON.parse(await readFile(resolve(root, 'content/games/sf6/game.json'), 'utf8')),
);
const referenceRoot = resolve(root, 'content/games/sf6/references');
const files = (await readdir(referenceRoot)).filter(file => file.endsWith('.json')).sort();
const authored = await Promise.all(
	files.map(
		async file => JSON.parse(await readFile(resolve(referenceRoot, file), 'utf8')) as unknown,
	),
);
// Validate the combined catalog so cross-file
// duplicate identities and broken related-reference links cannot be hidden.
const catalog = parseCatalog(
	authored.flatMap(value => {
		if (!Array.isArray(value)) throw new Error('Reference catalogs must be arrays');
		return value;
	}),
	[game],
);
const mediaRoot = resolve(root, 'apps/web/static/media');
let count = 0;
for (const ref of catalog) {
	if (ref.verification.status === 'source-reviewed' && !ref.media.clip)
		throw new Error(`${ref.id}: reviewed references require a clip`);
	for (const asset of [
		ref.media.poster,
		ref.media.clip,
		ref.media.descriptionTrack,
		...ref.media.frames.map(frame => frame.src),
	].filter((asset): asset is string => Boolean(asset))) {
		const target = resolve(root, 'apps/web/static', asset.slice(1));
		if (relative(mediaRoot, target).startsWith('..'))
			throw new Error(`${ref.id}: invalid media path`);
		const file = await stat(target);
		if (!file.isFile() || !file.size)
			throw new Error(`${ref.id}: media asset missing or empty: ${asset}`);
		count++;
	}
}
console.log(`Validated ${catalog.length} references and ${count} media references.`);
