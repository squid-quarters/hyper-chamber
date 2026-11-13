import {open} from 'node:fs/promises';
import {extname} from 'node:path';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {containedFile, isPassiveMediaPath} from './catalog';

export class HttpError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
	) {
		super(message);
		this.name = 'HttpError';
	}
}
export function sendJson(response: ServerResponse, status: number, value: unknown): void {
	const body = JSON.stringify(value);
	response.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Length': Buffer.byteLength(body),
		'Cache-Control': 'no-store',
		'X-Content-Type-Options': 'nosniff',
	});
	response.end(body);
}
export async function readJson(request: IncomingMessage, limit: number): Promise<unknown> {
	if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')) {
		throw new HttpError(415, 'json_required', 'Send this request as application/json.');
	}
	const declared = request.headers['content-length'];
	if (declared && Number(declared) > limit)
		throw new HttpError(413, 'body_too_large', 'This request is too large.');
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		let overLimit = false;
		request.on('data', (chunk: Buffer) => {
			if (overLimit) return;
			size += chunk.length;
			if (size > limit) {
				overLimit = true;
				chunks.length = 0;
				reject(new HttpError(413, 'body_too_large', 'This request is too large.'));
			} else chunks.push(chunk);
		});
		request.once('error', reject);
		request.once('aborted', () =>
			reject(new HttpError(400, 'request_aborted', 'The request was interrupted.')),
		);
		request.once('end', () => {
			if (overLimit) return;
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
			} catch {
				reject(new HttpError(400, 'invalid_json', 'This request is not valid JSON.'));
			}
		});
	});
}

const mimeTypes: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.mp4': 'video/mp4',
	'.webm': 'video/webm',
	'.vtt': 'text/vtt; charset=utf-8',
	'.woff2': 'font/woff2',
	'.ico': 'image/x-icon',
};

export function parseByteRange(value: string, size: number): {start: number; end: number} | null {
	const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
	if (!match || (!match[1] && !match[2]) || size === 0) return null;
	if (!match[1]) {
		const suffix = Number(match[2]);
		if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
		return {start: Math.max(0, size - suffix), end: size - 1};
	}
	const start = Number(match[1]);
	const end = match[2] ? Number(match[2]) : size - 1;
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start)
		return null;
	return {start, end: Math.min(end, size - 1)};
}

/** File descriptors are owned by the response stream and closed on completion or disconnect. */
export async function serveFile(
	request: IncomingMessage,
	response: ServerResponse,
	root: string,
	path: string,
	options: {hash?: string; media?: boolean} = {},
): Promise<boolean> {
	if (options.media && !isPassiveMediaPath(path)) return false;
	const resolved = await containedFile(root, path);
	if (!resolved) return false;
	const file = await open(resolved, 'r');
	let streamOwnsFile = false;
	try {
		const info = await file.stat();
		const etag = options.hash
			? `"${options.hash}"`
			: `W/"${info.size}-${Math.floor(info.mtimeMs)}"`;
		const headers: Record<string, string | number> = {
			'Content-Type': mimeTypes[extname(resolved).toLowerCase()] ?? 'application/octet-stream',
			'Accept-Ranges': 'bytes',
			'Cache-Control': 'private, no-cache',
			ETag: etag,
			'X-Content-Type-Options': 'nosniff',
		};
		if (options.media) headers['Content-Security-Policy'] = "sandbox; default-src 'none'";
		if (
			request.headers['if-none-match']
				?.split(',')
				.map(value => value.trim())
				.includes(etag)
		) {
			response.writeHead(304, headers);
			response.end();
			return true;
		}
		let range: {start: number; end: number} | undefined;
		if (
			request.headers.range &&
			(!request.headers['if-range'] || request.headers['if-range'] === etag)
		) {
			const parsed = parseByteRange(request.headers.range, info.size);
			if (!parsed) {
				response.writeHead(416, {
					...headers,
					'Content-Range': `bytes */${info.size}`,
					'Content-Length': 0,
				});
				response.end();
				return true;
			}
			range = parsed;
			headers['Content-Range'] = `bytes ${range.start}-${range.end}/${info.size}`;
		}
		headers['Content-Length'] = range ? range.end - range.start + 1 : info.size;
		response.writeHead(range ? 206 : 200, headers);
		if (request.method === 'HEAD' || info.size === 0) {
			response.end();
			return true;
		}
		const stream = file.createReadStream(range);
		streamOwnsFile = true;
		stream.once('error', error => response.destroy(error));
		response.once('close', () => stream.destroy());
		stream.pipe(response);
		return true;
	} finally {
		if (!streamOwnsFile) await file.close();
	}
}
