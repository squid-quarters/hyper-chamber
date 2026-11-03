import {readFile, stat} from 'node:fs/promises';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCatalog} from '../packages/reference/src/index.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalog = parseCatalog(
	JSON.parse(await readFile(resolve(root, 'content/dhalsim/references.json'), 'utf8')),
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
