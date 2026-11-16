import assert from 'node:assert/strict';
import {fork, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

export const repository = fileURLToPath(new URL('../../', import.meta.url));
export const marker = 'Performance fixture: preserve this note.';

async function syntheticSeed(root) {
	const seed = join(root, 'seed');
	await mkdir(seed);
	const content = join(repository, 'content/games/sf6');
	const payload = new Map([['game.json', await readFile(join(content, 'game.json'))]]);
	const names = (await readdir(join(content, 'references')))
		.filter(name => name.endsWith('.json'))
		.sort();
	let mediaPath, referenceId;
	for (const name of names) {
		const bytes = await readFile(join(content, 'references', name));
		payload.set(`catalogs/${name}`, bytes);
		const first = JSON.parse(bytes).find(reference => reference.media?.clip);
		if (!mediaPath && first) {
			mediaPath = first.media.clip;
			referenceId = first.id;
		}
	}
	assert.ok(mediaPath && referenceId, 'A catalog reference with media is required.');
	// This is network test data, not a playable demonstration or exported reference pack.
	payload.set(mediaPath.slice(1), Buffer.alloc(2 * 1024 ** 2, 65));
	const files = [];
	for (const [path, bytes] of payload) {
		await mkdir(dirname(join(seed, path)), {recursive: true});
		await writeFile(join(seed, path), bytes);
		files.push({
			path,
			bytes: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
		});
	}
	await writeFile(
		join(seed, 'manifest.json'),
		JSON.stringify({
			formatVersion: 1,
			id: 'performance-fixture',
			version: '1',
			games: ['game.json'],
			catalogs: names.map(name => `catalogs/${name}`),
			files,
		}),
	);
	return {seed, referenceId, mediaPath};
}

function descendants(pid) {
	let rows;
	if (process.platform === 'win32') {
		rows = JSON.parse(
			execFileSync(
				'powershell.exe',
				[
					'-NoProfile',
					'-NonInteractive',
					'-Command',
					'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress',
				],
				{encoding: 'utf8'},
			),
		).map(row => ({pid: row.ProcessId, parent: row.ParentProcessId}));
	} else {
		rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8'})
			.trim()
			.split('\n')
			.map(line => {
				const [pid, parent] = line.trim().split(/\s+/).map(Number);
				return {pid, parent};
			});
	}
	const found = [];
	for (const row of rows)
		if (row.parent === pid) found.push(...descendantsFromRows(row.pid, rows), row.pid);
	return found;
}
function descendantsFromRows(pid, rows) {
	return rows
		.filter(row => row.parent === pid)
		.flatMap(row => [...descendantsFromRows(row.pid, rows), row.pid]);
}
function alive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		if (error.code === 'ESRCH') return false;
		throw error;
	}
}

export async function createFixture({resources} = {}) {
	const root = await mkdtemp(join(tmpdir(), 'hyper-chamber-performance-'));
	let child;
	let stderr = '';
	let sequence = 0;
	const pending = new Map();
	try {
		const seeded = resources ? {seed: join(resolve(resources), 'seed')} : await syntheticSeed(root);
		const serverModule = resources
			? join(resolve(resources), 'server/index.mjs')
			: join(repository, 'apps/server/dist/index.mjs');
		await readFile(serverModule).catch(() => {
			throw new Error('Build the server first: pnpm --filter @hyper-chamber/server build');
		});
		child = fork(
			fileURLToPath(new URL('./worker.mjs', import.meta.url)),
			[
				JSON.stringify({
					libraryDir: join(root, 'library'),
					seedDir: seeded.seed,
					webDir: resources ? join(resolve(resources), 'web') : undefined,
					serverModule,
				}),
			],
			{
				execArgv: ['--expose-gc'],
				stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
				env: {...process.env, NODE_OPTIONS: ''},
			},
		);
		child.stderr.on('data', chunk => {
			stderr = (stderr + chunk.toString()).slice(-16384);
		});
		let resolveReady, rejectReady;
		const ready = new Promise((resolve, reject) => {
			resolveReady = resolve;
			rejectReady = reject;
		});
		child.on('message', message => {
			if (message.type === 'ready') resolveReady(message);
			else if (message.type === 'error') rejectReady(new Error(message.error));
			else if (pending.has(message.id)) {
				pending.get(message.id).resolve(message.value);
				pending.delete(message.id);
			}
		});
		child.once('exit', code => {
			const error = new Error(`Performance fixture exited (${code}). ${stderr}`);
			rejectReady(error);
			for (const waiter of pending.values()) waiter.reject(error);
			pending.clear();
		});
		const timeout = setTimeout(
			() => rejectReady(new Error(`Performance fixture startup timed out. ${stderr}`)),
			30000,
		);
		let info;
		try {
			info = await ready;
		} finally {
			clearTimeout(timeout);
		}
		const request = async command => {
			const id = ++sequence;
			return new Promise((resolve, reject) => {
				pending.set(id, {resolve, reject});
				child.send({id, command});
			});
		};
		const catalog = await (await fetch(info.url + '/api/catalog')).json();
		const reference = catalog.references.find(reference => reference.media?.clip);
		assert.ok(reference, 'The performance fixture needs a playable reference.');
		const runtime = await (await fetch(info.url + '/api/runtime')).json();
		const saved = await fetch(info.url + '/api/practice/' + reference.id, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'X-Hyper-Chamber-Library': runtime.libraryId,
				'X-Hyper-Chamber-Maintenance': String(runtime.maintenanceRevision ?? 0),
			},
			body: JSON.stringify({expectedVersion: 0, patch: {note: marker, saved: true}}),
		});
		assert.equal(saved.status, 200, 'The disposable note fixture must save.');
		return {
			root,
			url: info.url,
			reference,
			runtime,
			references: catalog.references.length,
			snapshot: () => request('snapshot'),
			async assertPreserved() {
				const practice = await (await fetch(info.url + '/api/practice')).json();
				assert.equal(practice.libraryId, runtime.libraryId);
				assert.equal(practice.entries[reference.id].note, marker);
				assert.equal(practice.entries[reference.id].saved, true);
			},
			async close() {
				await stop();
				await rm(root, {recursive: true, force: true});
			},
		};
	} catch (error) {
		await stop();
		await rm(root, {recursive: true, force: true});
		throw error;
	}

	async function stop() {
		if (!child || child.exitCode !== null || child.signalCode !== null) return;
		const exited = once(child, 'exit');
		if (child.connected) child.send({command: 'close'});
		let timedOut = false;
		await Promise.race([
			exited,
			delay(10000, undefined, {ref: false}).then(() => {
				timedOut = true;
			}),
		]);
		if (timedOut && alive(child.pid)) {
			const owned = descendants(child.pid);
			for (const pid of owned) if (alive(pid)) process.kill(pid, 'SIGTERM');
			child.kill('SIGTERM');
			await Promise.race([exited, delay(2000, undefined, {ref: false})]);
			for (const pid of [...owned, child.pid]) if (alive(pid)) process.kill(pid, 'SIGKILL');
			await exited;
			for (const pid of owned)
				assert.equal(alive(pid), false, `Owned process ${pid} survived cleanup.`);
		}
	}
}

export async function writeReport(path, report) {
	if (!path) return;
	await mkdir(dirname(resolve(path)), {recursive: true});
	await writeFile(resolve(path), JSON.stringify(report, null, 2) + '\n');
}
