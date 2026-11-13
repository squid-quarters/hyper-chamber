#!/usr/bin/env node
import {spawn, execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {access, readFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
import {repositoryRoot} from './pack.mjs';

const mode = process.argv[2];
if (!['dev', 'start'].includes(mode))
	throw new Error('Usage: node tools/desktop/local-server.mjs dev|start');
const require = createRequire(new URL('../../apps/web/package.json', import.meta.url));
const owned = new Set();
let stopping = false;

function descendants(pid) {
	if (process.platform === 'win32') return [];
	const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8'})
		.trim()
		.split('\n')
		.map(line => line.trim().split(/\s+/).map(Number));
	const found = [];
	const queue = [pid];
	while (queue.length) {
		const parent = queue.shift();
		for (const [child, parentId] of rows)
			if (parentId === parent && child !== process.pid) {
				found.push(child);
				queue.push(child);
			}
	}
	return found;
}

function exists(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

async function shutdown(code = 0) {
	if (stopping) return;
	stopping = true;
	const pids = [
		...new Set(
			[...owned].flatMap(child =>
				child.pid ? [...descendants(child.pid).reverse(), child.pid] : [],
			),
		),
	];
	if (pids.length) console.log(`Stopping owned Hyper Chamber processes: ${pids.join(', ')}`);
	if (process.platform === 'win32') {
		for (const child of owned)
			if (child.pid && exists(child.pid)) {
				try {
					execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {stdio: 'ignore'});
				} catch {}
			}
	} else {
		for (const pid of pids) {
			try {
				process.kill(pid, 'SIGTERM');
			} catch {}
		}
		for (let attempt = 0; attempt < 60 && pids.some(exists); attempt++) await delay(50);
		for (const pid of pids.filter(exists)) {
			try {
				process.kill(pid, 'SIGKILL');
			} catch {}
		}
		if (pids.some(exists)) await delay(100);
		const survivors = pids.filter(exists);
		if (survivors.length) console.error(`Processes still shutting down: ${survivors.join(', ')}`);
	}
	process.exitCode = code;
}
process.once('SIGINT', () => void shutdown(130));
process.once('SIGTERM', () => void shutdown(143));

function launch(command, args, options = {}) {
	if (stopping) throw new Error('Hyper Chamber startup was cancelled.');
	const child = spawn(command, args, {cwd: repositoryRoot, stdio: 'inherit', ...options});
	owned.add(child);
	child.once('error', error => {
		console.error(error.message);
		void shutdown(1);
	});
	return child;
}

async function buildServer() {
	// Windows cannot spawn a .cmd shim directly. The shell command here is fixed, with no user input.
	const build =
		process.platform === 'win32'
			? launch(process.env.ComSpec ?? 'cmd.exe', [
					'/d',
					'/s',
					'/c',
					'pnpm --filter @hyper-chamber/server build',
				])
			: launch('pnpm', ['--filter', '@hyper-chamber/server', 'build']);
	await new Promise((resolveBuild, reject) => {
		build.once('error', reject);
		build.once('exit', code =>
			code === 0 ? resolveBuild() : reject(new Error('The library server build failed.')),
		);
	});
	owned.delete(build);
}

try {
	if (Number(process.versions.node.split('.')[0]) < 24)
		throw new Error('Hyper Chamber requires Node 24 or later.');
	await buildServer();
	if (stopping) process.exitCode = 130;
	else {
		const webDir = join(repositoryRoot, 'apps/web/build');
		if (mode === 'start')
			await access(join(webDir, 'index.html')).catch(() => {
				throw new Error('Build the web app first: pnpm --filter @hyper-chamber/web build');
			});
		const version = JSON.parse(
			await readFile(join(repositoryRoot, 'apps/server/package.json'), 'utf8'),
		).version;
		const libraryDir = resolve(
			process.env.HYPER_CHAMBER_LIBRARY_DIR ??
				join(repositoryRoot, '.local', mode === 'dev' ? 'dev-library' : 'library'),
		);
		const backend = launch(
			process.execPath,
			[
				join(repositoryRoot, 'apps/server/dist/cli.mjs'),
				'--library-dir',
				libraryDir,
				'--seed-dir',
				join(repositoryRoot, 'content'),
				'--media-dir',
				join(repositoryRoot, 'apps/web/static/media'),
				'--web-dir',
				webDir,
				'--port',
				process.env.HYPER_CHAMBER_PORT ?? '5376',
				'--host',
				'127.0.0.1',
				'--app-version',
				version,
			],
			{
				stdio: ['ignore', 'pipe', 'inherit'],
				env: {...process.env, HYPER_CHAMBER_PARENT_PID: String(process.pid)},
			},
		);
		const apiUrl = await new Promise((resolveReady, reject) => {
			const timer = setTimeout(
				() => reject(new Error('The library server did not become ready.')),
				45000,
			);
			const lines = createInterface({input: backend.stdout});
			lines.on('line', line => {
				console.log(line);
				if (!line.startsWith('HYPER_CHAMBER_READY ')) return;
				try {
					const ready = JSON.parse(line.slice('HYPER_CHAMBER_READY '.length));
					if (!Number.isInteger(ready.port) || ready.port < 1 || ready.port > 65535)
						throw new Error('The library server returned an invalid port.');
					clearTimeout(timer);
					resolveReady(`http://127.0.0.1:${ready.port}`);
				} catch (error) {
					clearTimeout(timer);
					reject(error);
				}
			});
			backend.once('error', error => {
				clearTimeout(timer);
				reject(error);
			});
			backend.once('exit', () => {
				clearTimeout(timer);
				reject(new Error('The library server stopped before it became ready.'));
			});
		});
		backend.once('exit', code => {
			if (!stopping) void shutdown(code ?? 1);
		});
		if (mode === 'dev' && !stopping) {
			const vite = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');
			const frontend = launch(
				process.execPath,
				[
					vite,
					'dev',
					'--host',
					'127.0.0.1',
					'--port',
					process.env.HYPER_CHAMBER_WEB_PORT ?? '5173',
					'--strictPort',
				],
				{
					cwd: join(repositoryRoot, 'apps/web'),
					env: {...process.env, HYPER_CHAMBER_API_URL: apiUrl},
				},
			);
			frontend.once('exit', code => {
				if (!stopping) void shutdown(code ?? 1);
			});
		} else if (!stopping) console.log(`Hyper Chamber: ${apiUrl}\nLibrary: ${libraryDir}`);
	}
} catch (error) {
	console.error(error.message);
	await shutdown(1);
}
