import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {applicationVersion} from './model.mjs';

/** Content editions advance only when that character pack changes. */
export async function packEdition(root, game, character) {
	const data = JSON.parse(await readFile(join(root, 'content/pack-editions.json'), 'utf8'));
	if (data.formatVersion !== 1) throw new Error('Unsupported official pack-edition index.');
	const version = data.editions?.[game]?.[character];
	if (typeof version !== 'string')
		throw new Error(`No content edition is recorded for ${game}/${character}.`);
	return applicationVersion(version);
}
