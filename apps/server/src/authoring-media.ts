import {randomBytes} from 'node:crypto';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {realpath} from 'node:fs/promises';
import {readWorkspace} from '@hyper-chamber/authoring';
import {HttpError, serveFile} from './http';

const prefix = '/api/authoring/media/';
const lifetime = 2 * 60 * 60 * 1000;

/** Loopback-only, short-lived access to media in a workspace chosen by the native host. */
export class AuthoringMedia {
	private entries = new Map<string, {root: string; touched: number}>();
	private closed = false;

	async register(directory: string): Promise<{token: string; baseUrl: string}> {
		await readWorkspace(directory);
		const root = await realpath(directory);
		if (this.closed) throw new Error('The application is closing.');
		this.prune();
		if (this.entries.size >= 4)
			throw new Error('Close another pack workspace before opening a new one.');
		const token = randomBytes(32).toString('hex');
		this.entries.set(token, {root, touched: Date.now()});
		return {token, baseUrl: `${prefix}${token}/`};
	}

	release(token: string): void {
		this.entries.delete(token);
	}

	async serve(request: IncomingMessage, response: ServerResponse, path: string): Promise<boolean> {
		if (!path.startsWith(prefix)) return false;
		this.prune();
		const match = /^([a-f0-9]{64})\/(media\/.+)$/.exec(path.slice(prefix.length));
		const entry = match ? this.entries.get(match[1]) : undefined;
		if (!match || !entry || !['GET', 'HEAD'].includes(request.method ?? 'GET'))
			throw new HttpError(
				404,
				'preview_unavailable',
				'Reopen this workspace to preview its media.',
			);
		entry.touched = Date.now();
		if (!(await serveFile(request, response, entry.root, match[2], {media: true})))
			throw new HttpError(404, 'preview_unavailable', 'This workspace media could not be found.');
		return true;
	}

	close(): void {
		this.closed = true;
		this.entries.clear();
	}

	private prune(): void {
		const cutoff = Date.now() - lifetime;
		for (const [token, entry] of this.entries)
			if (entry.touched < cutoff) this.entries.delete(token);
	}
}
