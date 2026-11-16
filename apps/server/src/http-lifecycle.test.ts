import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import type {FileHandle} from 'node:fs/promises';
import {IncomingMessage, ServerResponse} from 'node:http';
import {Socket} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setImmediate} from 'node:timers/promises';
import {afterEach, describe, expect, it, vi} from 'vitest';

const tracked = vi.hoisted(() => ({
	handles: new Map<number, FileHandle>(),
	opens: 0,
	streams: 0,
	afterOpen: undefined as undefined | (() => void),
	duringStat: undefined as undefined | (() => void),
}));
vi.mock('node:fs/promises', async importOriginal => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return {
		...actual,
		open: async (...args: Parameters<typeof actual.open>) => {
			const file = await actual.open(...args);
			const fd = file.fd;
			tracked.opens++;
			tracked.handles.set(fd, file);
			const close = file.close.bind(file);
			file.close = async () => {
				await close();
				tracked.handles.delete(fd);
			};
			const stat = file.stat.bind(file);
			file.stat = async () => {
				const value = await stat();
				tracked.duringStat?.();
				return value;
			};
			const stream = file.createReadStream.bind(file);
			file.createReadStream = options => {
				tracked.streams++;
				return stream(options);
			};
			tracked.afterOpen?.();
			return file;
		},
	};
});
import {serveFile} from './http';

const roots: string[] = [];
afterEach(async () => {
	for (const file of tracked.handles.values()) await file.close();
	tracked.handles.clear();
	tracked.opens = 0;
	tracked.streams = 0;
	tracked.afterOpen = undefined;
	tracked.duringStat = undefined;
	for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true});
});
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'hc-http-ownership-'));
	roots.push(root);
	await writeFile(join(root, 'clip.mp4'), Buffer.alloc(4096));
	const request = new IncomingMessage(new Socket());
	request.method = 'GET';
	const response = new ServerResponse(request);
	return {root, request, response};
}
describe('media descriptor ownership on client cancellation', () => {
	it('does not open media after the response has already closed', async () => {
		const {root, request, response} = await fixture();
		response.destroy();
		await serveFile(request, response, root, 'clip.mp4', {media: true});
		await setImmediate();
		expect(tracked.opens).toBe(0);
		expect(tracked.handles.size).toBe(0);
	});
	it('closes media opened while the client disconnected', async () => {
		const {root, request, response} = await fixture();
		tracked.afterOpen = () => response.destroy();
		await serveFile(request, response, root, 'clip.mp4', {media: true});
		await setImmediate();
		expect(tracked.handles.size).toBe(0);
		expect(tracked.streams).toBe(0);
	});
	it('closes media if the client disconnects during descriptor inspection', async () => {
		const {root, request, response} = await fixture();
		tracked.duringStat = () => response.destroy();
		await serveFile(request, response, root, 'clip.mp4', {media: true});
		await setImmediate();
		expect(tracked.handles.size).toBe(0);
		expect(tracked.streams).toBe(0);
	});
});
