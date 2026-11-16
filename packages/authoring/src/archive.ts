import {createReadStream, closeSync, mkdirSync, openSync, writeSync} from 'node:fs';
import {stat, readFile, open, mkdir, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {crc32} from 'node:zlib';
import {Unzip, UnzipInflate} from 'fflate';
import {
	packManifestSchema,
	packPathSchema,
	MAX_FILE_BYTES,
	MAX_PACK_BYTES,
	MAX_PACK_FILES,
	type PackManifest,
} from '@hyper-chamber/reference';

async function jsonFile(path: string): Promise<unknown> {
	if ((await stat(path)).size > 32 * 1024 ** 2) throw new Error('Catalog JSON is too large.');
	return JSON.parse(await readFile(path, 'utf8'));
}

/** ZIP extraction writes regular files only, with bounded actual decompression and no path traversal. */
export async function unpackPackArchive(
	archive: string,
	target: string,
	options: {maxUnpackedBytes?: number} = {},
): Promise<void> {
	const budget = options.maxUnpackedBytes ?? MAX_PACK_BYTES;
	if (!Number.isSafeInteger(budget) || budget < 0)
		throw new Error('The archive disk budget must be a nonnegative safe integer.');
	const maxBytes = Math.min(MAX_PACK_BYTES, budget);
	const archiveStat = await stat(archive);
	if (!archiveStat.isFile() || archiveStat.size > MAX_FILE_BYTES)
		throw new Error('Choose a content pack file under 2 GiB.');
	const seen = new Set<string>();
	const openFiles = new Set<number>();
	let entryCount = 0;
	let totalBytes = 0;
	let failure: Error | null = null;
	const fail = (error: unknown) => {
		failure = error instanceof Error ? error : new Error('Could not extract the content pack.');
	};
	const unzip = new Unzip(file => {
		if (failure) return;
		try {
			if (++entryCount > MAX_PACK_FILES + 1)
				throw new Error('Duplicate or excessive archive files.');
			for (const size of [file.size, file.originalSize]) {
				if (
					size !== undefined &&
					(!Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES)
				)
					throw new Error('An archive entry exceeds the size limit.');
			}
			if (file.name.endsWith('/')) {
				packPathSchema.parse(file.name.slice(0, -1));
				if (file.originalSize !== undefined && file.originalSize !== 0)
					throw new Error('Archive directory entries must be empty.');
				file.ondata = (error, chunk) => {
					if (error) fail(error);
					else if (chunk.byteLength) fail(new Error('Archive directory entries must be empty.'));
				};
				// Unstarted entries retain compressed chunks inside the decoder.
				file.start();
				return;
			}
			const name = packPathSchema.parse(file.name);
			if (seen.has(name)) throw new Error('Duplicate archive files.');
			seen.add(name);
			const path = join(target, name);
			mkdirSync(dirname(path), {recursive: true});
			const fd = openSync(path, 'wx', 0o600);
			openFiles.add(fd);
			let bytes = 0;
			file.ondata = (error, chunk, final) => {
				if (failure) return;
				try {
					if (error) throw error;
					bytes += chunk.byteLength;
					totalBytes += chunk.byteLength;
					if (bytes > MAX_FILE_BYTES || totalBytes > maxBytes)
						throw new Error('The unpacked content pack exceeds the size limit.');
					let written = 0;
					while (written < chunk.byteLength) written += writeSync(fd, chunk, written);
					if (final) {
						closeSync(fd);
						openFiles.delete(fd);
					}
				} catch (error) {
					fail(error);
				}
			};
			file.start();
		} catch (error) {
			fail(error);
		}
	});
	unzip.register(UnzipInflate);
	try {
		for await (const chunk of createReadStream(archive, {highWaterMark: 64 * 1024})) {
			unzip.push(new Uint8Array(chunk));
			if (failure) throw failure;
		}
		unzip.push(new Uint8Array(), true);
		if (failure) throw failure;
		if (openFiles.size) throw new Error('The content pack is truncated.');
		const manifest = packManifestSchema.parse(await jsonFile(join(target, 'manifest.json')));
		const expected = new Set(['manifest.json', ...manifest.files.map(file => file.path)]);
		if (seen.size !== expected.size || [...seen].some(path => !expected.has(path)))
			throw new Error('The archive contains files outside its manifest.');
	} finally {
		for (const fd of openFiles) closeSync(fd);
	}
}

export interface ArchivePack {
	manifest: PackManifest;
	sources: ReadonlyMap<string, string | Uint8Array>;
}
/** Stored ZIP entries keep video export bounded to one file chunk, not the archive size. */
export async function writePackArchive(pack: ArchivePack, output: string): Promise<void> {
	const manifest = Buffer.from(
		`${JSON.stringify(packManifestSchema.parse(pack.manifest), null, 2)}\n`,
	);
	const entries: {
		path: string;
		bytes: number;
		source: string | Uint8Array | undefined;
		sha256?: string;
		name?: Buffer;
	}[] = [
		{path: 'manifest.json', bytes: manifest.length, source: manifest},
		...[...pack.manifest.files]
			.sort((a, b) => a.path.localeCompare(b.path, 'en'))
			.map(file => ({...file, source: pack.sources.get(file.path)})),
	];
	let archiveBytes = 22;
	const paths = new Set<string>();
	for (const entry of entries) {
		packPathSchema.parse(entry.path);
		entry.name = Buffer.from(entry.path);
		if (paths.has(entry.path) || !entry.source || entry.name.length > 65535)
			throw new Error(`Duplicate or missing content-pack source: ${entry.path}`);
		paths.add(entry.path);
		if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes >= MAX_FILE_BYTES)
			throw new Error(`Invalid content-pack file size: ${entry.path}`);
		archiveBytes += 30 + 46 + entry.name.length * 2 + entry.bytes;
		if (archiveBytes >= MAX_FILE_BYTES)
			throw new Error('Content packs must be smaller than 2 GiB.');
	}
	await mkdir(dirname(resolve(output)), {recursive: true});
	const handle = await open(output, 'wx', 0o600);
	let position = 0;
	const central: Buffer[] = [];
	const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
	const writeAt = async (chunk: Uint8Array, offset: number) => {
		let written = 0;
		while (written < chunk.length) {
			const result = await handle.write(chunk, written, chunk.length - written, offset + written);
			if (!result.bytesWritten) throw new Error('The content-pack write made no progress.');
			written += result.bytesWritten;
		}
	};
	const append = async (chunk: Uint8Array) => {
		await writeAt(chunk, position);
		position += chunk.length;
	};
	try {
		for (const entry of entries) {
			const name = entry.name!;
			const offset = position;
			const header = Buffer.alloc(30 + name.length);
			header.writeUInt32LE(0x04034b50, 0);
			header.writeUInt16LE(20, 4);
			header.writeUInt16LE(0x0800, 6);
			header.writeUInt16LE(date, 12);
			header.writeUInt32LE(entry.bytes, 18);
			header.writeUInt32LE(entry.bytes, 22);
			header.writeUInt16LE(name.length, 26);
			name.copy(header, 30);
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
			const directory = Buffer.alloc(46 + name.length);
			directory.writeUInt32LE(0x02014b50, 0);
			directory.writeUInt16LE(20, 4);
			directory.writeUInt16LE(20, 6);
			directory.writeUInt16LE(0x0800, 8);
			directory.writeUInt16LE(date, 14);
			directory.writeUInt32LE(checksum, 16);
			directory.writeUInt32LE(bytes, 20);
			directory.writeUInt32LE(bytes, 24);
			directory.writeUInt16LE(name.length, 28);
			directory.writeUInt32LE(offset, 42);
			name.copy(directory, 46);
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
		await handle.sync();
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
