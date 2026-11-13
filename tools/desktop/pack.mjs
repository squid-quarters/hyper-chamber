import {createHash} from 'node:crypto';
import {constants, createReadStream} from 'node:fs';
import {once} from 'node:events';
import {
	copyFile,
	mkdir,
	open,
	readFile,
	readdir,
	realpath,
	stat,
	unlink,
	writeFile,
} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname, isAbsolute, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {finished} from 'node:stream/promises';

export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../apps/desktop/package.json', import.meta.url));

export function safePackPath(path) {
	if (
		typeof path !== 'string' ||
		!path ||
		path.includes('\\') ||
		path.includes('\0') ||
		path.includes(':') ||
		isAbsolute(path) ||
		path.split('/').some(part => part === '..' || part === '.' || !part)
	) {
		throw new Error(`Unsafe content-pack path: ${path}`);
	}
	return path;
}

async function sourceFile(root, path) {
	const target = await realpath(join(root, safePackPath(path)));
	const boundary = await realpath(root);
	if (!target.startsWith(`${boundary}${sep}`) || !(await stat(target)).isFile()) {
		throw new Error(`Content asset is outside its source directory: ${path}`);
	}
	return target;
}

export function mediaPaths(reference) {
	const media = reference.media ?? {};
	return [
		...new Set(
			[
				media.clip,
				media.poster,
				media.descriptionTrack,
				...(media.frames ?? []).map(frame => frame.src),
			]
				.filter(Boolean)
				.map(path => {
					if (!path.startsWith('/media/')) throw new Error(`Unsupported media URL: ${path}`);
					return safePackPath(path.slice(1));
				}),
		),
	];
}

export async function describeFile(path, source) {
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of typeof source === 'string' ? createReadStream(source) : [source]) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	return {path: safePackPath(path), sha256: hash.digest('hex'), bytes};
}

export async function collectPack({
	sourceRoot = repositoryRoot,
	gameId = 'sf6',
	characterId,
	starter = false,
	version = '1.0.0-beta.1',
} = {}) {
	if (!/^[a-z0-9-]+$/.test(gameId) || (characterId && !/^[a-z0-9-]+$/.test(characterId)))
		throw new Error('Use a game or character ID, for example sf6 or dhalsim.');
	const content = join(sourceRoot, 'content/games', gameId);
	const staticRoot = join(sourceRoot, 'apps/web/static');
	const game = JSON.parse(await readFile(join(content, 'game.json'), 'utf8'));
	if (characterId && !game.characters.some(character => character.id === characterId))
		throw new Error(`Unknown character: ${characterId}`);
	const catalogNames = (await readdir(join(content, 'references')))
		.filter(name => name.endsWith('.json'))
		.sort();
	const selection = starter ? 'dhalsim' : characterId;
	const selected = selection
		? catalogNames.filter(name => name === `${selection}.json`)
		: catalogNames;
	if (!selected.length) throw new Error('No matching reference catalog was found.');
	const sources = new Map();
	const gamePath = `games/${gameId}/game.json`;
	sources.set(gamePath, await sourceFile(content, 'game.json'));
	const catalogs = [];
	let referenceCount = 0;
	let clipCount = 0;
	const selectedCatalogs = await Promise.all(
		selected.map(async name => {
			const original = JSON.parse(
				await readFile(await sourceFile(content, `references/${name}`), 'utf8'),
			);
			return {name, included: starter ? original.slice(0, 3) : original};
		}),
	);
	const ids = new Set(
		selectedCatalogs.flatMap(catalog => catalog.included.map(reference => reference.id)),
	);
	for (const {name, included} of selectedCatalogs) {
		const catalogPath = `catalogs/${gameId}/${name}`;
		// A pack is independently valid; absent related entries reappear when its full catalog is installed.
		const references = included.map(reference => ({
			...reference,
			relatedIds: (reference.relatedIds ?? []).filter(id => ids.has(id)),
		}));
		sources.set(catalogPath, Buffer.from(`${JSON.stringify(references, null, 2)}\n`));
		catalogs.push(catalogPath);
		referenceCount += references.length;
		for (const reference of included) {
			for (const path of mediaPaths(reference))
				sources.set(path, await sourceFile(staticRoot, path));
			if (reference.media?.clip) clipCount++;
		}
	}
	const files = [];
	for (const [path, source] of [...sources].sort(([a], [b]) => a.localeCompare(b, 'en')))
		files.push(await describeFile(path, source));
	const id = starter ? 'hyper-chamber-starter' : `hyper-chamber-${gameId}-${characterId ?? 'all'}`;
	return {
		manifest: {formatVersion: 1, id, version, games: [gamePath], catalogs, files},
		sources,
		referenceCount,
		clipCount,
	};
}

export async function writeUnpackedPack(pack, output) {
	await mkdir(output, {recursive: true});
	for (const {path} of pack.manifest.files) {
		const destination = join(output, safePackPath(path));
		await mkdir(dirname(destination), {recursive: true});
		const source = pack.sources.get(path);
		if (typeof source === 'string') await copyFile(source, destination, constants.COPYFILE_FICLONE);
		else await writeFile(destination, source);
	}
	await writeFile(join(output, 'manifest.json'), `${JSON.stringify(pack.manifest, null, 2)}\n`);
}

export async function writePackArchive(pack, output) {
	const {Zip, ZipPassThrough, strToU8} = require('fflate');
	await mkdir(dirname(resolve(output)), {recursive: true});
	const handle = await open(output, 'wx');
	const destination = handle.createWriteStream();
	const completion = finished(destination);
	completion.catch(() => {});
	let zipError;
	const zip = new Zip((error, data, final) => {
		if (error) {
			zipError = error;
			destination.destroy(error);
			return;
		}
		destination.write(data);
		if (final) destination.end();
	});
	// Fixed timestamps and sorted files produce repeatable archives. Media is already compressed.
	const add = async (path, chunks) => {
		const entry = new ZipPassThrough(safePackPath(path));
		entry.mtime = new Date(2026, 0, 1, 0, 0, 0);
		zip.add(entry);
		for await (const chunk of chunks) {
			if (zipError) throw zipError;
			if (destination.errored) throw destination.errored;
			entry.push(chunk, false);
			if (destination.writableNeedDrain) await once(destination, 'drain');
		}
		entry.push(new Uint8Array(), true);
	};
	try {
		await add('manifest.json', [strToU8(`${JSON.stringify(pack.manifest, null, 2)}\n`)]);
		for (const {path} of pack.manifest.files)
			await add(
				path,
				typeof pack.sources.get(path) === 'string'
					? createReadStream(pack.sources.get(path))
					: [pack.sources.get(path)],
			);
		zip.end();
		await completion;
	} catch (error) {
		destination.destroy();
		await completion.catch(() => {});
		await unlink(output).catch(() => {});
		throw error;
	}
}
