#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {collectPack, repositoryRoot, writePackArchive} from '../desktop/pack.mjs';
import {releaseVersion, describeAsset} from './model.mjs';

const {values} = parseArgs({options: {output: {type: 'string'}, character: {type: 'string'}}});
if (!values.output) throw new Error('Provide a dedicated --output directory for character packs.');
const directory = resolve(values.output);
const version = await releaseVersion(repositoryRoot);
await mkdir(directory, {recursive: true});
const indexPath = join(directory, 'content-packs.json');
let index;
try {
	index = JSON.parse(await readFile(indexPath, 'utf8'));
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
if (index && index.version !== version)
	throw new Error('Do not reuse another release’s pack directory.');
index ??= {formatVersion: 1, version, game: 'sf6', packs: []};
const catalogs = (await readdir(join(repositoryRoot, 'content/games/sf6/references')))
	.filter(name => name.endsWith('.json'))
	.map(name => name.slice(0, -5))
	.sort();
if (values.character && !catalogs.includes(values.character)) throw new Error('Unknown character.');
for (const character of values.character ? [values.character] : catalogs) {
	const pack = await collectPack({gameId: 'sf6', characterId: character, version});
	if (pack.clipCount !== pack.referenceCount || pack.referenceCount === 0)
		throw new Error(`Character pack has incomplete demonstrations: ${character}`);
	if (pack.manifest.files.reduce((sum, file) => sum + file.bytes, 0) >= 2 ** 31)
		throw new Error(`Character needs smaller packs to meet the 2 GiB limit: ${character}`);
	const manifestSha256 = createHash('sha256').update(JSON.stringify(pack.manifest)).digest('hex');
	const name = `sf6-${character}_${version}.hcpack`;
	const previous = index.packs.find(entry => entry.character === character);
	if (previous) {
		const current = await describeAsset(join(directory, previous.name));
		if (previous.manifestSha256 !== manifestSha256 || current.sha256 !== previous.sha256)
			throw new Error(
				`Existing pack differs; use a new version rather than replacing ${character}.`,
			);
		console.log(`Verified existing ${name}.`);
		continue;
	}
	await writePackArchive(pack, join(directory, name));
	const asset = await describeAsset(join(directory, name));
	index.packs.push({
		...asset,
		character,
		packId: pack.manifest.id,
		references: pack.referenceCount,
		demonstrations: pack.clipCount,
		manifestSha256,
	});
	index.packs.sort((a, b) => a.character.localeCompare(b.character, 'en'));
	await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
	console.log(`Prepared ${name}: ${pack.referenceCount} references, ${asset.bytes} bytes.`);
}
console.log(
	`Pack index: ${index.packs.length} characters; ${index.packs.reduce((sum, entry) => sum + entry.references, 0)} references.`,
);
