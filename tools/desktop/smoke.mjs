#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
import {assertNativeRuntime} from './runtime.mjs';

const {values} = parseArgs({
	options: {
		resources: {type: 'string'},
		native: {type: 'string'},
		output: {type: 'string'},
		'expected-platform': {type: 'string'},
		'expected-arch': {type: 'string'},
	},
});
if (!values.resources)
	throw new Error(
		'Usage: node tools/desktop/smoke.mjs --resources PATH [--native EXECUTABLE] --expected-platform darwin|win32 --expected-arch arm64|x64',
	);
if (values.native && process.env.CI !== 'true')
	throw new Error(
		'Native app smoke is CI-only, to avoid interacting with an existing desktop instance.',
	);
const resources = resolve(values.resources);
if (values.output) {
	await mkdir(dirname(resolve(values.output)), {recursive: true});
	await writeFile(
		resolve(values.output),
		JSON.stringify({passed: false, platform: process.platform, arch: process.arch}) + '\n',
	);
}
const metadata = JSON.parse(await readFile(join(resources, 'runtime.json'), 'utf8'));
assertNativeRuntime(
	{version: metadata.node, platform: metadata.platform, arch: metadata.architecture},
	{platform: values['expected-platform'], arch: values['expected-arch']},
);
assert.equal(metadata.platform, process.platform, 'Smoke must run on the packaged platform.');
assert.equal(metadata.architecture, process.arch, 'Smoke must run on the packaged architecture.');
const node = join(resources, process.platform === 'win32' ? 'node.exe' : 'node');
assert.equal(
	createHash('sha256')
		.update(await readFile(node))
		.digest('hex'),
	metadata.nodeSha256,
	'Bundling unexpectedly changed the pinned Node runtime.',
);
const identity = JSON.parse(
	execFileSync(
		node,
		['-p', 'JSON.stringify({version:process.version,platform:process.platform,arch:process.arch})'],
		{encoding: 'utf8'},
	),
);
assertNativeRuntime(identity, {platform: metadata.platform, arch: metadata.architecture});
const scratch = await mkdtemp(join(tmpdir(), 'hyper-chamber-installer-smoke-'));
const token = randomUUID();
let child;
let knownOwned = [];
let output = '';
let interrupted = false;
let launchNative = !!values.native;
let backendPreflight = false;
let activeLibrary = join(scratch, 'library');
process.once('SIGINT', () => {
	interrupted = true;
});
process.once('SIGTERM', () => {
	interrupted = true;
});
function alive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		if (error.code === 'ESRCH') return false;
		throw error;
	}
}
function descendants(pid) {
	if (process.platform === 'win32') {
		const script =
			'$ErrorActionPreference="Stop"; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress';
		const rows = JSON.parse(
			execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
				encoding: 'utf8',
				timeout: 10000,
				windowsHide: true,
			}),
		);
		const found = [],
			queue = [pid];
		while (queue.length) {
			const parent = queue.shift();
			for (const item of rows)
				if (item.ParentProcessId === parent) {
					found.push(item.ProcessId);
					queue.push(item.ProcessId);
				}
		}
		return found;
	}
	const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8', timeout: 10000})
		.trim()
		.split('\n')
		.map(row => row.trim().split(/\s+/).map(Number));
	const found = [],
		queue = [pid];
	while (queue.length) {
		const parent = queue.shift();
		for (const [id, parentId] of rows)
			if (parentId === parent) {
				found.push(id);
				queue.push(id);
			}
	}
	return found;
}

function signalOwned(pid, signal) {
	try {
		process.kill(pid, signal);
	} catch (error) {
		if (error.code !== 'ESRCH') throw error;
	}
}

async function waitFor(test, message, timeout = 45000) {
	const until = Date.now() + timeout;
	while (Date.now() < until) {
		if (interrupted) throw new Error('Packaged smoke was interrupted.');
		if (await test()) return;
		await delay(100);
	}
	throw new Error(message + '\n' + output);
}
async function freePort() {
	const server = createServer();
	await new Promise((ok, no) => {
		server.once('error', no);
		server.listen(0, '127.0.0.1', ok);
	});
	const port = server.address().port;
	await new Promise(ok => server.close(ok));
	return port;
}
async function launch(library = join(scratch, 'library')) {
	activeLibrary = library;
	const port = await freePort(),
		url = `http://127.0.0.1:${port}`;
	const env = {
		...process.env,
		HYPER_CHAMBER_PORT: String(port),
		HYPER_CHAMBER_LIBRARY_DIR: library,
		HYPER_CHAMBER_PARENT_PID: String(process.pid),
		HYPER_CHAMBER_ADMIN_TOKEN: token,
		HYPER_CHAMBER_DIAGNOSTICS_PATH: join(scratch, 'native-startup.jsonl'),
	};
	delete env.HYPER_CHAMBER_RESOURCES_DIR;
	delete env.NODE_OPTIONS;
	const args = launchNative
		? []
		: [
				join(resources, 'server/cli.mjs'),
				'--library-dir',
				env.HYPER_CHAMBER_LIBRARY_DIR,
				'--web-dir',
				join(resources, 'web'),
				'--seed-dir',
				join(resources, 'seed'),
				'--port',
				String(port),
				'--host',
				'127.0.0.1',
				'--app-version',
				metadata.appVersion,
			];
	child = spawn(launchNative ? resolve(values.native) : node, args, {
		env,
		stdio: ['ignore', 'pipe', 'pipe'],
		windowsHide: true,
	});
	knownOwned = [child.pid];
	child.stdout.on('data', chunk => {
		output += chunk;
	});
	child.stderr.on('data', chunk => {
		output += chunk;
	});
	let spawnError;
	child.once('error', error => {
		spawnError = error;
	});
	await waitFor(async () => {
		if (spawnError) throw spawnError;
		if (child.exitCode !== null || child.signalCode !== null)
			throw new Error('Packaged process exited before readiness.\n' + output);
		try {
			return (await fetch(url + '/api/runtime', {signal: AbortSignal.timeout(1000)})).ok;
		} catch {
			return false;
		}
	}, 'Packaged application did not become ready.');
	if (launchNative) {
		await delay(2000);
		if (child.exitCode !== null || child.signalCode !== null)
			throw new Error('Native app exited during window startup.\n' + output);
	}
	knownOwned = [...new Set([...knownOwned, ...descendants(child.pid)])];
	return url;
}
async function stop(url) {
	if (!child) return;
	const owned = [...new Set([...knownOwned, ...descendants(child.pid), child.pid])];
	console.log('Owned smoke process IDs: ' + owned.join(', '));
	if (launchNative) child.kill('SIGTERM');
	else {
		const response = await fetch(url + '/api/admin/shutdown', {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Host': token},
			body: '{}',
			signal: AbortSignal.timeout(5000),
		});
		assert.equal(response.status, 200);
	}
	await waitFor(
		() => owned.every(pid => !alive(pid)),
		'Owned packaged processes did not stop.',
		12000,
	);
	child = undefined;
}

/** Exercise the real bundle's JSON stdin/stdout, including Windows GUI-subsystem binaries. */
async function packCommand(request) {
	const input = Buffer.from(JSON.stringify(request));
	assert.ok(input.length <= 2 * 1024 ** 2, 'Installer authoring input exceeds its smoke limit.');
	const env = {...process.env, HYPER_CHAMBER_PARENT_PID: String(process.pid)};
	delete env.NODE_OPTIONS;
	delete env.HYPER_CHAMBER_RESOURCES_DIR;
	const started = Date.now();
	const tool = spawn(
		values.native ? resolve(values.native) : node,
		values.native ? ['--pack', '--json'] : [join(resources, 'authoring/cli.mjs'), '--json'],
		{env, cwd: scratch, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true},
	);
	const owned = new Set();
	if (tool.pid) owned.add(tool.pid);
	let stdout = Buffer.alloc(0),
		stderr = Buffer.alloc(0),
		failure,
		finished = false,
		code,
		signal;
	const collect = (current, chunk, limit) => {
		if (current.length + chunk.length > limit) {
			failure ??= new Error('Pack CLI smoke output exceeded its bounded limit.');
			return current;
		}
		return Buffer.concat([current, chunk]);
	};
	tool.stdout.on('data', chunk => {
		stdout = collect(stdout, chunk, 4 * 1024 ** 2);
	});
	tool.stderr.on('data', chunk => {
		stderr = collect(stderr, chunk, 64 * 1024);
	});
	tool.once('error', error => {
		failure = error;
	});
	tool.stdin.once('error', error => {
		failure ??= error;
	});
	tool.once('close', (exitCode, exitSignal) => {
		finished = true;
		code = exitCode;
		signal = exitSignal;
	});
	tool.stdin.end(input);
	let sampleAt = started;
	try {
		while (!finished) {
			if (failure) throw failure;
			if (interrupted) throw new Error('Packaged authoring smoke was interrupted.');
			if (Date.now() - started > 45000)
				throw new Error('Packaged authoring CLI exceeded its 45-second deadline.');
			if (tool.pid && Date.now() >= sampleAt) {
				for (const pid of descendants(tool.pid)) owned.add(pid);
				sampleAt = Date.now() + 500;
			}
			await delay(20);
		}
		if (failure) throw failure;
		assert.equal(signal, null, 'The authoring CLI exited from a signal.');
		assert.equal(
			code,
			0,
			`The authoring CLI failed: ${stderr.toString('utf8')}\n${stdout.toString('utf8')}`,
		);
		const result = JSON.parse(stdout.toString('utf8'));
		assert.equal(result.ok, true, `The authoring CLI rejected ${request.command}.`);
		return result.result;
	} finally {
		let enumerationError;
		if (tool.pid && alive(tool.pid)) {
			try {
				for (const pid of descendants(tool.pid)) owned.add(pid);
			} catch (error) {
				// Still stop the exact child and previously observed descendants if
				// process inventory failed; never report an unverified cleanup green.
				enumerationError = error;
			}
		}
		const running = [...owned].reverse().filter(alive);
		if (running.length) {
			console.log('Owned pack CLI process IDs: ' + running.join(', '));
			for (const pid of running) {
				signalOwned(pid, 'SIGTERM');
			}
			let deadline = Date.now() + 2500;
			while (running.some(alive) && Date.now() < deadline) await delay(25);
			for (const pid of running.filter(alive)) {
				signalOwned(pid, 'SIGKILL');
			}
			deadline = Date.now() + 2500;
			while (running.some(alive) && Date.now() < deadline) await delay(25);
			assert.ok(
				running.every(pid => !alive(pid)),
				'An owned pack CLI process survived cleanup.',
			);
		}
		assert.equal(enumerationError, undefined, 'Pack CLI descendants could not be fully inspected.');
	}
}
async function verifyPackAuthoringCli() {
	const profiles = await packCommand({command: 'profiles'});
	assert.ok(
		Array.isArray(profiles) && profiles.length > 0,
		'The packaged profiles must be present.',
	);
	const profile = profiles[0];
	assert.ok(typeof profile.id === 'string' && profile.characters.length > 0);
	assert.ok(
		Array.isArray(profile.notation.legend),
		'The profile must include usable notation metadata.',
	);
	const directory = join(scratch, 'pack authoring', 'empty workspace');
	const created = await packCommand({
		command: 'create',
		directory,
		title: 'Installer CLI workspace',
		author: 'Smoke test',
		games: [profile],
	});
	const opened = await packCommand({command: 'read', directory});
	assert.equal(opened.workspace.id, created.workspace.id);
	assert.equal(opened.workspace.games[0].id, profile.id);
	assert.deepEqual(opened.workspace.references, []);
	const empty = await packCommand({command: 'validate', directory});
	assert.equal(empty.valid, false, 'An empty workspace must not be exported as a complete pack.');
	assert.ok(empty.errors.length > 0);
	const sample = join(scratch, 'pack authoring', 'sample workspace');
	await cp(fileURLToPath(new URL('../../docs/packs/sample/', import.meta.url)), sample, {
		recursive: true,
	});
	const report = await packCommand({command: 'validate', directory: sample});
	assert.equal(report.valid, true);
	assert.equal(report.referenceCount, 1);
	const archive = join(scratch, 'pack authoring', 'exported sample.hcpack');
	const exported = await packCommand({command: 'export', directory: sample, output: archive});
	assert.equal(exported.manifest.formatVersion, 2);
	assert.equal(exported.referenceCount, 1);
	assert.ok((await stat(archive)).size > 0);
	const forkDirectory = join(scratch, 'pack authoring', 'fork workspace');
	const fork = await packCommand({
		command: 'fork',
		directory: forkDirectory,
		archive,
		author: 'CLI fork creator',
	});
	assert.notEqual(fork.workspace.id, exported.manifest.id);
	assert.equal(fork.workspace.derivedFrom.id, exported.manifest.id);
	assert.equal(fork.workspace.references[0].verification.status, 'draft');
	assert.equal((await packCommand({command: 'validate', directory: forkDirectory})).valid, true);
	return {
		mode: values.native ? 'native' : 'bundled-node',
		profiles: profiles.length,
		exportedReferences: 1,
		forkedReferences: 1,
	};
}

async function verifyReleasedLibraryUpgrade() {
	const library = join(scratch, 'released-v1-library');
	const seed = JSON.parse(await readFile(join(resources, 'seed/manifest.json'), 'utf8'));
	const legacy = {
		formatVersion: 1,
		id: seed.id,
		version: '1.0.0',
		games: seed.games,
		catalogs: seed.catalogs,
		files: seed.files,
	};
	const packRoot = join(library, 'packs', legacy.id);
	await cp(join(resources, 'seed'), packRoot, {recursive: true});
	const manifest = JSON.stringify(legacy, null, 2) + '\n';
	await writeFile(join(packRoot, 'manifest.json'), manifest);
	await writeFile(join(packRoot, '.installed.json'), JSON.stringify({installedAt: 1794700800000}));
	const fixture = fileURLToPath(
		new URL('../../apps/server/src/test-fixtures/v1.0.0.sql', import.meta.url),
	);
	execFileSync(
		node,
		[
			'--input-type=module',
			'-e',
			`import {DatabaseSync} from 'node:sqlite';import{readFileSync}from'node:fs';const db=new DatabaseSync(process.argv[1]);db.exec(readFileSync(process.argv[2],'utf8'));db.close();`,
			join(library, 'hyper-chamber.sqlite'),
			fixture,
		],
		{encoding: 'utf8'},
	);
	const query = () =>
		JSON.parse(
			execFileSync(
				node,
				[
					'--input-type=module',
					'-e',
					`import{DatabaseSync}from'node:sqlite';const db=new DatabaseSync(process.argv[1],{readOnly:true});console.log(JSON.stringify({schema:db.prepare('PRAGMA user_version').get().user_version,packs:db.prepare('SELECT id,root FROM installed_packs ORDER BY id').all()}));db.close();`,
					join(library, 'hyper-chamber.sqlite'),
				],
				{encoding: 'utf8'},
			),
		);
	const hashes = new Map();
	for (const file of legacy.files)
		hashes.set(
			file.path,
			createHash('sha256')
				.update(await readFile(join(packRoot, file.path)))
				.digest('hex'),
		);
	const expectedId = '6e1b9675-e60a-4e04-8ae7-d6a93d219380';
	let address = await launch(library);
	const runtime = await (await fetch(address + '/api/runtime')).json();
	assert.equal(
		runtime.appVersion,
		metadata.appVersion,
		'The candidate app version is independent of a v1 library.',
	);
	assert.equal(runtime.protocolVersion, 2);
	assert.equal(runtime.libraryId, expectedId);
	assert.equal(runtime.content.packs, 1);
	const entries = (await (await fetch(address + '/api/practice')).json()).entries;
	assert.deepEqual(entries['dhalsim-full-early-lights-od-fire'], {
		saved: true,
		status: 'reliable',
		note: 'Keep this released-library note.',
		revision: 3,
		rowVersion: 3,
		updatedAt: '2026-11-15T00:00:00.000Z',
	});
	assert.equal(entries['temporarily-unavailable'].note, 'Keep unavailable references too.');
	const state = query();
	assert.equal(state.schema, 2);
	assert.deepEqual(state.packs, [{id: legacy.id, root: `packs/${legacy.id}`}]);
	assert.equal(
		await readFile(join(packRoot, 'manifest.json'), 'utf8'),
		manifest,
		'Upgrading must not rewrite legacy pack metadata.',
	);
	for (const [path, hash] of hashes)
		assert.equal(
			createHash('sha256')
				.update(await readFile(join(packRoot, path)))
				.digest('hex'),
			hash,
			`Upgrading changed legacy pack bytes: ${path}`,
		);
	const catalog = await (await fetch(address + '/api/catalog')).json();
	assert.equal(catalog.references.length, 3);
	const clip = await fetch(address + catalog.references[0].media.clip, {
		headers: {Range: 'bytes=0-127'},
	});
	assert.equal(clip.status, 206);
	assert.equal((await clip.arrayBuffer()).byteLength, 128);
	const snapshots = await readdir(join(library, 'snapshots'));
	assert.equal(snapshots.length, 1);
	assert.match(snapshots[0], /^before-schema-1-/);
	await stop(address);
	address = await launch(library);
	const repeated = await (await fetch(address + '/api/practice')).json();
	assert.equal(repeated.libraryId, expectedId);
	assert.deepEqual(repeated.entries, entries);
	assert.deepEqual(query(), state);
	assert.deepEqual(
		await readdir(join(library, 'snapshots')),
		snapshots,
		'Reopening a migrated library must not create another migration snapshot.',
	);
	await stop(address);
	return {from: '1.0.0', schema: 2, legacyPacks: 1, preservedEntries: Object.keys(entries).length};
}

try {
	const packAuthoring = await verifyPackAuthoringCli();
	// First isolate the packaged backend from native bootstrap on the Windows installer runner.
	if (values.native && process.platform === 'win32') {
		launchNative = false;
		const preflightUrl = await launch();
		const preflight = await (await fetch(preflightUrl + '/api/catalog')).json();
		assert.equal(preflight.references.length, 3);
		await stop(preflightUrl);
		await rm(join(scratch, 'library'), {recursive: true, force: true});
		backendPreflight = true;
		launchNative = true;
		console.log('Installed Windows backend preflight passed.');
	}
	let url = await launch();
	const runtime = await (await fetch(url + '/api/runtime')).json();
	assert.equal(runtime.appVersion, metadata.appVersion);
	assert.equal(runtime.content.references, 3);
	assert.equal(runtime.content.packs, 1);
	assert.equal(runtime.sharing.enabled, false);
	const page = await fetch(url + '/');
	assert.equal(page.status, 200);
	const html = await page.text();
	const assets = [
		...new Set([...html.matchAll(/(?:href|src)="(\/_app\/[^"]+)"/g)].map(match => match[1])),
	];
	assert.ok(assets.length > 0, 'The bundled UI entry must reference its compiled assets.');
	for (const asset of assets) {
		const response = await fetch(url + asset);
		assert.equal(response.status, 200, `Missing bundled UI asset: ${asset}`);
		assert.ok((await response.arrayBuffer()).byteLength > 0);
	}
	const catalog = await (await fetch(url + '/api/catalog')).json();
	assert.equal(catalog.references.length, 3);
	for (const reference of catalog.references) {
		const clip = await fetch(url + reference.media.clip, {headers: {Range: 'bytes=0-127'}});
		assert.equal(clip.status, 206);
		assert.equal((await clip.arrayBuffer()).byteLength, 128);
		assert.match(clip.headers.get('content-type'), /^video\//);
		const poster = await fetch(url + reference.media.poster);
		assert.equal(poster.status, 200);
		assert.ok((await poster.arrayBuffer()).byteLength > 0);
	}
	const notices = await readFile(join(resources, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
	for (const required of [
		'@fontsource/dm-sans',
		'@fontsource/barlow-condensed',
		'@lucide/svelte',
		'svelte ',
		'tauri ',
	])
		assert.ok(notices.includes(required), `Missing notice: ${required}`);
	const reference = catalog.references[0];
	const changed = await fetch(url + '/api/practice/' + reference.id, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Origin: url,
			'X-Hyper-Chamber-Library': runtime.libraryId,
			'X-Hyper-Chamber-Maintenance': String(runtime.maintenanceRevision),
			'X-Hyper-Chamber-Protocol': String(runtime.protocolVersion),
		},
		body: JSON.stringify({
			expectedVersion: 0,
			patch: {
				saved: true,
				note: 'Installer smoke persistence.',
				status: 'practising',
				revision: reference.revision,
			},
		}),
	});
	assert.equal(changed.status, 200);
	await stop(url);
	url = await launch();
	const stored = await (await fetch(url + '/api/practice')).json();
	assert.equal(stored.libraryId, runtime.libraryId);
	assert.equal(stored.entries[reference.id].note, 'Installer smoke persistence.');
	assert.equal(stored.entries[reference.id].saved, true);
	await stop(url);
	const upgrade = await verifyReleasedLibraryUpgrade();
	const proof = {
		passed: true,
		upgrade,
		packAuthoring,
		platform: process.platform,
		arch: process.arch,
		version: metadata.appVersion,
		node: metadata.node,
		checks: {
			nativeBootstrap: !!values.native,
			...(backendPreflight ? {backendPreflight: true} : {}),
			runtimePin: true,
			nodeByteIntegrity: true,
			cleanLibraryBootstrap: true,
			starterReferences: 3,
			mediaRanges: 3,
			uiAssets: assets.length,
			sqliteSave: true,
			persistenceAfterRestart: true,
			upgradeFromV1: true,
			packAuthoringCli: true,
			ownedProcessesStopped: true,
			thirdPartyNotices: true,
		},
	};
	if (values.output) await writeFile(resolve(values.output), JSON.stringify(proof, null, 2) + '\n');
	console.log(JSON.stringify(proof));
} catch (error) {
	const diagnostics = {};
	for (const [name, path] of [
		['nativeStartup', join(scratch, 'native-startup.jsonl')],
		['serverLog', join(activeLibrary, 'server.log')],
	]) {
		try {
			diagnostics[name] = (await readFile(path, 'utf8')).slice(-65536);
		} catch (readError) {
			if (readError.code !== 'ENOENT') diagnostics[name] = String(readError);
		}
	}
	const failure = {
		passed: false,
		platform: process.platform,
		arch: process.arch,
		version: metadata.appVersion,
		backendPreflight,
		error: String(error),
		output: output.slice(-65536),
		diagnostics,
	};
	if (values.output)
		await writeFile(resolve(values.output), JSON.stringify(failure, null, 2) + '\n');
	console.error(JSON.stringify(failure, null, 2));
	throw error;
} finally {
	if (child?.pid) {
		const owned = [...new Set([...knownOwned, ...descendants(child.pid), child.pid])].reverse();
		console.error('Cleaning failed smoke process IDs: ' + owned.join(', '));
		for (const pid of owned) {
			try {
				process.kill(pid, 'SIGTERM');
			} catch {}
		}
		await delay(1200);
		for (const pid of owned.filter(alive)) {
			try {
				process.kill(pid, 'SIGKILL');
			} catch {}
		}
	}
	await rm(scratch, {recursive: true, force: true});
}
