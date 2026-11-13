#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {parseArgs} from 'node:util';
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
	const rows = execFileSync('ps', ['-axo', 'pid=,ppid='], {encoding: 'utf8'})
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
async function launch() {
	const port = await freePort(),
		url = `http://127.0.0.1:${port}`;
	const env = {
		...process.env,
		HYPER_CHAMBER_PORT: String(port),
		HYPER_CHAMBER_LIBRARY_DIR: join(scratch, 'library'),
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
try {
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
	const proof = {
		passed: true,
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
		['serverLog', join(scratch, 'library/server.log')],
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
