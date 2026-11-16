import {createServer} from 'node:http';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {afterEach, describe, expect, it} from 'vitest';
import {createWorkspace} from '@hyper-chamber/authoring';
import {gameDefinitionSchema} from '@hyper-chamber/reference';
import {AuthoringMedia} from './authoring-media';
import {HttpError, sendJson} from './http';

const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
	for (const close of cleanup.splice(0).reverse()) await close();
});
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'hc-authoring-preview-'));
	cleanup.push(() => rm(root, {recursive: true, force: true}));
	const directory = join(root, 'workspace');
	const game = gameDefinitionSchema.parse(
		JSON.parse(
			await readFile(new URL('../../../content/games/sf6/game.json', import.meta.url), 'utf8'),
		),
	);
	await createWorkspace(directory, {title: 'Preview test', author: 'Test creator', games: [game]});
	await mkdir(join(directory, 'media'));
	await writeFile(join(directory, 'media/clip.mp4'), 'passive-media');
	const media = new AuthoringMedia();
	const server = createServer((request, response) => {
		void media
			.serve(request, response, decodeURIComponent(request.url ?? '/'))
			.then(handled => {
				if (!handled) sendJson(response, 404, {});
			})
			.catch(error => sendJson(response, error instanceof HttpError ? error.status : 500, {}));
	});
	await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
	cleanup.push(async () => {
		media.close();
		await new Promise<void>(resolve => server.close(() => resolve()));
	});
	const address = server.address();
	if (!address || typeof address === 'string') throw new Error('No preview port');
	return {root, directory, media, origin: `http://127.0.0.1:${address.port}`};
}
describe('native workspace media previews', () => {
	it('streams only passive contained media and revokes the session on release', async () => {
		const {directory, media, origin} = await fixture();
		const session = await media.register(directory);
		const clip = await fetch(origin + session.baseUrl + 'media/clip.mp4');
		expect(clip.status).toBe(200);
		expect(await clip.text()).toBe('passive-media');
		expect(clip.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'");
		expect((await fetch(origin + session.baseUrl + 'workspace.json')).status).toBe(404);
		await writeFile(join(directory, 'media/page.html'), '<script>bad()</script>');
		expect((await fetch(origin + session.baseUrl + 'media/page.html')).status).toBe(404);
		media.release(session.token);
		expect((await fetch(origin + session.baseUrl + 'media/clip.mp4')).status).toBe(404);
	});
	it('bounds retained sessions and releases them on close', async () => {
		const {directory, media, origin} = await fixture();
		const sessions = [];
		for (let i = 0; i < 4; i++) sessions.push(await media.register(directory));
		await expect(media.register(directory)).rejects.toThrow(/close another/i);
		media.release(sessions[0].token);
		await expect(media.register(directory)).resolves.toHaveProperty('token');
		media.close();
		expect((await fetch(origin + sessions[1].baseUrl + 'media/clip.mp4')).status).toBe(404);
		await expect(media.register(directory)).rejects.toThrow(/closing/i);
	});
	it('does not follow an asset link outside the chosen workspace', async () => {
		const {root, directory, media, origin} = await fixture();
		const outside = join(root, 'outside');
		await mkdir(outside);
		await writeFile(join(outside, 'secret.mp4'), 'outside bytes');
		await symlink(
			outside,
			join(directory, 'media/linked'),
			process.platform === 'win32' ? 'junction' : 'dir',
		);
		const session = await media.register(directory);
		expect((await fetch(origin + session.baseUrl + 'media/linked/secret.mp4')).status).toBe(404);
	});
});
