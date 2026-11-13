#!/usr/bin/env node
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {parseArgs} from 'node:util';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {collectPack, repositoryRoot, writeUnpackedPack} from '../desktop/pack.mjs';
import {startLibraryServer} from '../../apps/server/dist/index.mjs';
import {releaseVersion, describeAsset} from './model.mjs';

const {values} = parseArgs({options: {packs: {type: 'string'}, output: {type: 'string'}}});
if (!values.packs || !values.output) throw new Error('Provide --packs and --output.');
const directory = resolve(values.packs);
const index = JSON.parse(await readFile(join(directory, 'content-packs.json'), 'utf8'));
const version = await releaseVersion(repositoryRoot);
assert.equal(index.version, version);
assert.ok(index.packs.length > 0);
await writeFile(resolve(values.output), `${JSON.stringify({passed: false, version})}\n`);
const scratch = await mkdtemp(join(tmpdir(), 'hyper-chamber-release-packs-'));
let app;
const token = randomUUID();
const imported = [];
try {
	await writeUnpackedPack(await collectPack({starter: true, version}), join(scratch, 'seed'));
	const options = {
		libraryDir: join(scratch, 'library'),
		seedDir: join(scratch, 'seed'),
		webDir: join(repositoryRoot, 'apps/web/build'),
		port: 0,
		adminToken: token,
		appVersion: version,
	};
	app = await startLibraryServer(options);
	const runtime = await (await fetch(app.url + '/api/runtime')).json();
	assert.equal(runtime.content.references, 3);
	const starter = await (await fetch(app.url + '/api/catalog')).json();
	const reference = starter.references[0];
	const note = await fetch(app.url + '/api/practice/' + reference.id, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Origin: app.url,
			'X-Hyper-Chamber-Library': runtime.libraryId,
		},
		body: JSON.stringify({
			expectedVersion: 0,
			patch: {
				saved: true,
				note: 'Release pack persistence check.',
				status: 'practising',
				revision: reference.revision,
			},
		}),
	});
	assert.equal(note.status, 200);
	for (const pack of index.packs) {
		const file = join(directory, pack.name);
		assert.equal((await describeAsset(file)).sha256, pack.sha256);
		const response = await fetch(app.url + '/api/admin/content/import', {
			method: 'POST',
			headers: {'Content-Type': 'application/json', 'X-Hyper-Chamber-Host': token},
			body: JSON.stringify({path: file}),
			signal: AbortSignal.timeout(600000),
		});
		const result = await response.json();
		assert.equal(response.status, 200, JSON.stringify(result));
		assert.equal(result.id, pack.packId);
		assert.equal(result.version, version);
		imported.push({character: pack.character, references: pack.references, sha256: pack.sha256});
		console.log(`Imported ${pack.character}: ${result.references} total references.`);
	}
	const expected = index.packs.reduce((sum, pack) => sum + pack.references, 0);
	const all = await (await fetch(app.url + '/api/catalog')).json();
	assert.equal(all.references.length, expected);
	assert.equal(new Set(all.references.map(reference => reference.id)).size, expected);
	let mediaChecks = 0;
	for (const pack of index.packs) {
		const sample = all.references.find(reference =>
			reference.participants.some(participant => participant.characterId === pack.character),
		);
		assert.ok(sample, `Missing imported character ${pack.character}.`);
		const clip = await fetch(app.url + sample.media.clip, {headers: {Range: 'bytes=0-127'}});
		assert.equal(clip.status, 206);
		assert.equal((await clip.arrayBuffer()).byteLength, 128);
		mediaChecks++;
	}
	await app.close();
	app = await startLibraryServer(options);
	const restored = await (await fetch(app.url + '/api/runtime')).json();
	assert.equal(restored.libraryId, runtime.libraryId);
	assert.equal(restored.content.references, expected);
	assert.equal(restored.sharing.enabled, false);
	const personal = await (await fetch(app.url + '/api/practice')).json();
	assert.equal(personal.entries[reference.id].note, 'Release pack persistence check.');
	assert.equal(personal.entries[reference.id].saved, true);
	const indexSha256 = (await describeAsset(join(directory, 'content-packs.json'))).sha256;
	const proof = {
		indexSha256,
		passed: true,
		version,
		characters: index.packs.length,
		references: expected,
		imported,
		checks: {
			cleanStarter: true,
			allArchivesImported: true,
			stableIdsUnique: true,
			sampledClipRanges: mediaChecks,
			persistenceAfterRestart: true,
			learnerNotePreserved: true,
			sharingDisabled: true,
		},
	};
	await writeFile(resolve(values.output), `${JSON.stringify(proof, null, 2)}\n`);
	console.log(`Verified ${expected} references in ${index.packs.length} imported character packs.`);
} finally {
	if (app) await app.close();
	await rm(scratch, {recursive: true, force: true});
}
