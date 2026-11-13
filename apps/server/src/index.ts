import {createServer, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import {networkInterfaces} from 'node:os';
import {extname} from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {z, ZodError} from 'zod';
import {referenceIdSchema, type LibraryRuntime} from '@hyper-chamber/reference';
import {LibraryCatalog} from './catalog';
import {HttpError, readJson, sendJson, serveFile} from './http';
import {PracticeConflict, PracticeStore} from './store';

export {LibraryCatalog, packManifestSchema} from './catalog';
export {PracticeStore, PracticeConflict, migrateDatabase, databaseMigrations} from './store';
export {parseByteRange} from './http';
export interface ServerOptions {
	libraryDir: string;
	webDir?: string;
	seedDir?: string;
	mediaDir?: string;
	port?: number;
	host?: string;
	adminToken?: string;
	appVersion?: string;
	onError?: (error: unknown) => void;
}
export interface LibraryServer {
	readonly port: number;
	readonly url: string;
	readonly libraryId: string;
	runtime(): LibraryRuntime;
	setSharing(enabled: boolean): Promise<LibraryRuntime['sharing']>;
	close(): Promise<void>;
}
function portOf(server: Server): number {
	const address = server.address();
	if (!address || typeof address === 'string')
		throw new Error('The application server has not started.');
	return address.port;
}
function localAddress(value: string | undefined): boolean {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}
function networkAddresses(port: number): string[] {
	const addresses: string[] = [];
	for (const entries of Object.values(networkInterfaces())) {
		for (const entry of entries ?? []) {
			if (entry.family === 'IPv4' && !entry.internal)
				addresses.push(`http://${entry.address}:${port}`);
		}
	}
	return [...new Set(addresses)].sort();
}
function tokenMatches(
	actual: string | string[] | undefined,
	expected: string | undefined,
): boolean {
	if (!expected || typeof actual !== 'string') return false;
	const left = Buffer.from(actual);
	const right = Buffer.from(expected);
	return left.length === right.length && timingSafeEqual(left, right);
}
function listen(server: Server, port: number, host: string): Promise<void> {
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(port, host, () => {
			server.removeListener('error', reject);
			resolve();
		});
	});
}
async function stop(server: Server): Promise<void> {
	if (!server.listening) return;
	await new Promise<void>(resolve => {
		const timer = setTimeout(() => server.closeAllConnections(), 1500);
		timer.unref();
		server.close(() => {
			clearTimeout(timer);
			resolve();
		});
	});
}

export async function startLibraryServer(options: ServerOptions): Promise<LibraryServer> {
	const host = options.host ?? '127.0.0.1';
	if (!['127.0.0.1', '::1'].includes(host))
		throw new Error('The primary server must listen on loopback. Use sharing for network access.');
	const catalog = await LibraryCatalog.open(options);
	const store = await PracticeStore.open(options.libraryDir);
	let lan: Server | undefined;
	let closed = false;
	let closing: Promise<void> | undefined;
	let sharingChange = false;
	let sharingTask: Promise<LibraryRuntime['sharing']> | undefined;
	const handlers = new Set<Promise<void>>();
	const onError = options.onError ?? (error => console.error(error));
	const sharing = (): LibraryRuntime['sharing'] => ({
		enabled: !!lan?.listening,
		addresses: lan?.listening ? networkAddresses(portOf(lan)) : [],
	});
	const runtime = (): LibraryRuntime => ({
		appVersion: options.appVersion ?? '1.0.0-beta.1',
		libraryId: store.libraryId,
		sharing: sharing(),
		content: {references: catalog.snapshot.references.length, packs: catalog.packCount},
	});

	const assertHost = (request: IncomingMessage, server: Server): URL => {
		let url: URL;
		try {
			url = new URL(`http://${request.headers.host}`);
		} catch {
			throw new HttpError(400, 'invalid_host', 'The request has no valid host.');
		}
		if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
			throw new HttpError(400, 'invalid_host', 'The request has no valid host.');
		const allowed = new Set([
			'127.0.0.1',
			'localhost',
			'[::1]',
			...networkAddresses(portOf(server)).map(address => new URL(address).hostname),
		]);
		if (!allowed.has(url.hostname) || Number(url.port || 80) !== portOf(server))
			throw new HttpError(403, 'invalid_host', 'This host is not part of the local application.');
		return url;
	};
	const requireWriteOrigin = (request: IncomingMessage, origin: URL): void => {
		if (
			request.headers['sec-fetch-site'] === 'cross-site' ||
			(request.headers.origin && request.headers.origin !== origin.origin)
		) {
			throw new HttpError(
				403,
				'invalid_origin',
				'Practice changes must come from the application.',
			);
		}
	};
	const requireLibrary = (request: IncomingMessage): void => {
		if (request.headers['x-hyper-chamber-library'] !== store.libraryId)
			throw new HttpError(
				409,
				'library_changed',
				'The active library has changed. Reload the application before saving.',
			);
	};
	const requireAdmin = (request: IncomingMessage, server: Server): void => {
		if (
			server !== primary ||
			!localAddress(request.socket.remoteAddress) ||
			!tokenMatches(request.headers['x-hyper-chamber-host'], options.adminToken)
		) {
			throw new HttpError(
				403,
				'host_only',
				'This action is available from the desktop application.',
			);
		}
	};

	const handler = async (
		request: IncomingMessage,
		response: ServerResponse,
		server: Server,
	): Promise<void> => {
		try {
			if (closed)
				throw new HttpError(
					503,
					'closing',
					'Hyper Chamber is closing. Your unsaved draft has been kept.',
				);
			const origin = assertHost(request, server);
			const rawPath = (request.url ?? '/').split('?')[0];
			let path: string;
			try {
				path = decodeURIComponent(rawPath);
			} catch {
				throw new HttpError(400, 'invalid_path', 'The request path is invalid.');
			}
			if (
				path.includes('\\') ||
				path.includes('\0') ||
				path.split('/').some(segment => segment === '.' || segment === '..')
			) {
				throw new HttpError(400, 'invalid_path', 'The request path is invalid.');
			}
			const method = request.method ?? 'GET';
			if (method === 'POST' || method === 'PATCH') requireWriteOrigin(request, origin);
			if (path === '/api/health' && method === 'GET') {
				sendJson(response, 200, {
					app: 'hyper-chamber',
					protocolVersion: 1,
					libraryId: store.libraryId,
				});
				return;
			}
			if (path === '/api/runtime' && method === 'GET') {
				sendJson(response, 200, runtime());
				return;
			}
			if (path === '/api/catalog' && method === 'GET') {
				sendJson(response, 200, {...catalog.snapshot, libraryId: store.libraryId});
				return;
			}
			if (path === '/api/practice' && method === 'GET') {
				sendJson(response, 200, store.snapshot());
				return;
			}
			if (path === '/api/practice/import' && method === 'POST') {
				requireLibrary(request);
				sendJson(response, 200, store.importLegacy(await readJson(request, 16 * 1024 ** 2)));
				return;
			}
			if (path.startsWith('/api/practice/') && method === 'PATCH') {
				requireLibrary(request);
				const id = referenceIdSchema.parse(path.slice('/api/practice/'.length));
				const entry = store.patch(id, await readJson(request, 32 * 1024), catalog.revision(id));
				sendJson(response, 200, {entry});
				return;
			}
			if (path.startsWith('/api/admin/')) {
				requireAdmin(request, server);
				if (method !== 'POST')
					throw new HttpError(405, 'method_not_allowed', 'This action requires POST.');
				if (path === '/api/admin/sharing') {
					const value = z.strictObject({enabled: z.boolean()}).parse(await readJson(request, 4096));
					sendJson(response, 200, await app.setSharing(value.enabled));
					return;
				}
				if (path === '/api/admin/content/import') {
					const value = z
						.strictObject({path: z.string().min(1).max(4096)})
						.parse(await readJson(request, 8192));
					try {
						sendJson(response, 200, await catalog.importArchive(value.path));
					} catch (error) {
						throw new HttpError(
							400,
							'invalid_pack',
							error instanceof Error ? error.message : 'The content pack could not be installed.',
						);
					}
					return;
				}
				if (path === '/api/admin/backup') {
					sendJson(response, 200, {file: await store.snapshotBackup()});
					return;
				}
				if (path === '/api/admin/shutdown') {
					sendJson(response, 200, {closing: true});
					setImmediate(() => {
						void app.close().catch(onError);
					});
					return;
				}
			}
			if (path.startsWith('/api/'))
				throw new HttpError(404, 'not_found', 'This application endpoint was not found.');
			if (method !== 'GET' && method !== 'HEAD')
				throw new HttpError(405, 'method_not_allowed', 'This resource is read-only.');
			if (path.startsWith('/media/')) {
				const file = catalog.media(path);
				if (
					file &&
					(await serveFile(request, response, file.root, file.path, {
						hash: file.sha256,
						media: true,
					}))
				)
					return;
				throw new HttpError(
					404,
					'media_unavailable',
					'This clip or frame is not installed. Import its character pack to view it.',
				);
			}
			if (options.webDir) {
				const localPath = path === '/' ? 'index.html' : path.slice(1);
				if (
					!localPath.split('/').some(segment => segment.startsWith('.')) &&
					(await serveFile(request, response, options.webDir, localPath))
				)
					return;
				if (!extname(path) && (await serveFile(request, response, options.webDir, 'index.html')))
					return;
			}
			throw new HttpError(404, 'not_found', 'This application resource was not found.');
		} catch (error) {
			if (response.headersSent || response.destroyed) {
				response.destroy();
				return;
			}
			if (error instanceof PracticeConflict)
				sendJson(response, 409, {
					error: {code: 'conflict', message: error.message},
					entry: error.entry,
				});
			else if (error instanceof ZodError)
				sendJson(response, 400, {
					error: {
						code: 'invalid_request',
						message: error.issues[0]?.message ?? 'The request is invalid.',
					},
				});
			else if (error instanceof HttpError)
				sendJson(response, error.status, {error: {code: error.code, message: error.message}});
			else {
				onError(error);
				sendJson(response, 500, {
					error: {
						code: 'storage_unavailable',
						message:
							'The application could not complete this request. Your unsaved changes have been kept.',
					},
				});
			}
		}
	};
	const newServer = (): Server => {
		const server = createServer((request, response) => {
			const promise = handler(request, response, server);
			handlers.add(promise);
			void promise.catch(onError).finally(() => handlers.delete(promise));
		});
		server.requestTimeout = 30000;
		server.headersTimeout = 10000;
		return server;
	};
	const primary = newServer();
	const app: LibraryServer = {
		get port() {
			return portOf(primary);
		},
		get url() {
			return `http://${host === '::1' ? '[::1]' : host}:${portOf(primary)}`;
		},
		libraryId: store.libraryId,
		runtime,
		async setSharing(enabled) {
			if (closed || sharingChange)
				throw new HttpError(409, 'sharing_busy', 'Network sharing is changing. Try again.');
			sharingChange = true;
			sharingTask = (async () => {
				try {
					if (enabled && !lan) {
						const candidate = newServer();
						try {
							await listen(candidate, 0, '0.0.0.0');
							if (closed) {
								await stop(candidate);
								throw new HttpError(503, 'closing', 'Hyper Chamber is closing.');
							}
							lan = candidate;
						} catch (error) {
							await stop(candidate);
							throw error;
						}
					} else if (!enabled && lan) {
						const previous = lan;
						lan = undefined;
						await stop(previous);
					}
					return sharing();
				} finally {
					sharingChange = false;
				}
			})();
			return sharingTask;
		},
		close() {
			if (closing) return closing;
			closed = true;
			closing = (async () => {
				await sharingTask?.catch(() => undefined);
				await Promise.all([stop(primary), lan ? stop(lan) : Promise.resolve()]);
				await Promise.allSettled(handlers);
				store.close();
			})();
			return closing;
		},
	};
	try {
		await listen(primary, options.port ?? 5376, host);
	} catch (error) {
		store.close();
		throw error;
	}
	return app;
}
