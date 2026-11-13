#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {collectPack, repositoryRoot, writePackArchive} from './pack.mjs';

const {values} = parseArgs({
	options: {
		character: {type: 'string'},
		game: {type: 'string', default: 'sf6'},
		output: {type: 'string'},
		starter: {type: 'boolean', default: false},
	},
});
if ((!values.character && !values.starter) || !values.output) {
	console.error(
		'Usage: pnpm desktop:pack --character dhalsim --output /path/dhalsim.hcpack\n       pnpm desktop:pack --starter --output /path/starter.hcpack',
	);
	process.exitCode = 1;
} else {
	if (!values.output.endsWith('.hcpack'))
		throw new Error('Choose an output filename ending in .hcpack.');
	const version = JSON.parse(
		await readFile(resolve(repositoryRoot, 'apps/desktop/package.json'), 'utf8'),
	).version;
	const pack = await collectPack({
		gameId: values.game,
		characterId: values.character,
		starter: values.starter,
		version,
	});
	await writePackArchive(pack, resolve(values.output));
	console.log(
		`Created ${resolve(values.output)}: ${pack.referenceCount} references, ${pack.clipCount} demonstrations.`,
	);
}
