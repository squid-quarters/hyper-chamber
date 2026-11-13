import {createHash} from 'node:crypto';
import {constants, createReadStream} from 'node:fs';
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
import {dirname, isAbsolute, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {crc32} from 'node:zlib';

export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));

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
	const limit = 2 ** 31;
	const manifest = Buffer.from(`${JSON.stringify(pack.manifest, null, 2)}\n`);
	const entries = [
		{path: 'manifest.json', bytes: manifest.length, source: manifest},
		...[...pack.manifest.files]
			.sort((a, b) => a.path.localeCompare(b.path, 'en'))
			.map(file => ({...file, source: pack.sources.get(file.path)})),
	];
	if (entries.length > 30000) throw new Error('Content packs support at most 30000 ZIP entries.');
	const paths = new Set();
	let archiveBytes = 22;
	for (const entry of entries) {
		const path = safePackPath(entry.path);
		entry.name = Buffer.from(path);
		if (paths.has(path) || entry.name.length > 65535)
			throw new Error('Duplicate or oversized content-pack filename.');
		paths.add(path);
		if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes >= limit)
			throw new Error(`Invalid content-pack file size: ${path}`);
		archiveBytes += 30 + 46 + entry.name.length * 2 + entry.bytes;
		if (archiveBytes >= limit) throw new Error('Content packs must be smaller than 2 GiB.');
	}
	await mkdir(dirname(resolve(output)), {recursive: true});
	const handle = await open(output, 'wx');
	let position = 0;
	const central = [];
	const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
	const writeAt = async (chunk, offset) => {
		let written = 0;
		while (written < chunk.length) {
			const {bytesWritten} = await handle.write(
				chunk,
				written,
				chunk.length - written,
				offset + written,
			);
			if (!bytesWritten) throw new Error('The content-pack write made no progress.');
			written += bytesWritten;
		}
	};
	const append = async chunk => {
		await writeAt(chunk, position);
		position += chunk.length;
	};
	try {
		for (const entry of entries) {
			const offset = position;
			const header = Buffer.alloc(30 + entry.name.length);
			header.writeUInt32LE(0x04034b50, 0);
			header.writeUInt16LE(20, 4);
			header.writeUInt16LE(0x0800, 6); // UTF-8 names; known sizes, no data descriptor.
			header.writeUInt16LE(date, 12);
			header.writeUInt32LE(entry.bytes, 18);
			header.writeUInt32LE(entry.bytes, 22);
			header.writeUInt16LE(entry.name.length, 26);
			entry.name.copy(header, 30);
			await append(header);
			let bytes = 0,
				checksum = 0;
			const hash = createHash('sha256');
			const chunks =
				typeof entry.source === 'string'
					? createReadStream(entry.source, {highWaterMark: 64 * 1024})
					: [entry.source];
			for await (const chunk of chunks) {
				if (!(chunk instanceof Uint8Array))
					throw new Error(`Missing content-pack source: ${entry.path}`);
				bytes += chunk.length;
				if (bytes > entry.bytes) throw new Error(`Content-pack source size changed: ${entry.path}`);
				checksum = crc32(chunk, checksum);
				hash.update(chunk);
				await append(chunk);
			}
			if (bytes !== entry.bytes) throw new Error(`Content-pack source size changed: ${entry.path}`);
			if (entry.sha256 && hash.digest('hex') !== entry.sha256)
				throw new Error(`Content-pack source hash changed: ${entry.path}`);
			const crc = Buffer.alloc(4);
			crc.writeUInt32LE(checksum);
			await writeAt(crc, offset + 14);
			const directory = Buffer.alloc(46 + entry.name.length);
			directory.writeUInt32LE(0x02014b50, 0);
			directory.writeUInt16LE(20, 4);
			directory.writeUInt16LE(20, 6);
			directory.writeUInt16LE(0x0800, 8);
			directory.writeUInt16LE(date, 14);
			directory.writeUInt32LE(checksum, 16);
			directory.writeUInt32LE(bytes, 20);
			directory.writeUInt32LE(bytes, 24);
			directory.writeUInt16LE(entry.name.length, 28);
			directory.writeUInt32LE(offset, 42);
			entry.name.copy(directory, 46);
			central.push(directory);
		}
		const start = position;
		for (const header of central) await append(header);
		const end = Buffer.alloc(22);
		end.writeUInt32LE(0x06054b50, 0);
		end.writeUInt16LE(entries.length, 8);
		end.writeUInt16LE(entries.length, 10);
		end.writeUInt32LE(position - start, 12);
		end.writeUInt32LE(start, 16);
		await append(end);
		await handle.close();
	} catch (error) {
		await handle.close().catch(() => {});
		await unlink(output).catch(cleanup => {
			if (cleanup.code !== 'ENOENT')
				throw new AggregateError([error, cleanup], 'Could not remove the incomplete content pack.');
		});
		throw error;
	}
}
