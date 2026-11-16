#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {createFixture, writeReport} from './fixture.mjs';

const {values} = parseArgs({
	options: {
		resources: {type: 'string', default: 'apps/desktop/build/resources'},
		output: {type: 'string'},
	},
});
const session = `hc-unavailable-notes-${randomUUID()}`;
const executable = process.env.AGENT_BROWSER_EXECUTABLE ?? 'agent-browser';
let fixture, report, failure;
let started = false;
let interrupted = false;
process.once('SIGINT', () => {
	interrupted = true;
});
process.once('SIGTERM', () => {
	interrupted = true;
});
function browser(args, input = '') {
	if (interrupted && args[0] !== 'close')
		return Promise.reject(new Error('Regression check interrupted.'));
	return new Promise((resolve, reject) => {
		const child = spawn(executable, ['--session', session, ...args], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		let output = '',
			errors = '';
		child.stdout.on('data', chunk => {
			output = (output + chunk).slice(-(1024 ** 2));
		});
		child.stderr.on('data', chunk => {
			errors = (errors + chunk).slice(-32768);
		});
		child.once('error', reject);
		child.once('close', code =>
			code === 0
				? resolve(output.trim())
				: reject(new Error(`agent-browser ${args[0]} failed (${code}): ${errors || output}`)),
		);
		child.stdin.end(input);
	});
}
async function evaluate(script) {
	return JSON.parse(await browser(['eval', '--stdin'], script));
}
async function patch(id, expectedVersion, note) {
	const response = await fetch(`${fixture.url}/api/practice/${id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'X-Hyper-Chamber-Library': fixture.runtime.libraryId,
			'X-Hyper-Chamber-Maintenance': String(fixture.runtime.maintenanceRevision),
			'X-Hyper-Chamber-Protocol': String(fixture.runtime.protocolVersion),
		},
		body: JSON.stringify({expectedVersion, patch: {note}}),
	});
	assert.equal(response.status, 200);
	return (await response.json()).entry;
}
async function seedDrafts(id, notes, base, baseVersion) {
	await evaluate(
		`(()=>{localStorage.clear();for(const [index,note] of ${JSON.stringify(notes)}.entries())localStorage.setItem(${JSON.stringify('hyper-chamber.pending-drafts.v1:' + fixture.runtime.libraryId + ':regression:')}+index,JSON.stringify({version:1,entries:{[${JSON.stringify(id)}]:{patch:{note},base:${JSON.stringify(base)},baseVersion:${baseVersion}}}}));return true;})()`,
	);
	await browser(['open', fixture.url]);
	await browser(['wait', '--text', 'Saved edits need your review.']);
	await browser(['scrollintoview', '.global-notice button']);
	await browser(['click', '.global-notice button']);
	assert.equal(
		await evaluate('document.querySelector(".unavailable-notes")?.open'),
		true,
		'Review edits must open unavailable references.',
	);
}
await writeReport(values.output, {passed: false, status: 'running', session});
try {
	fixture = await createFixture({resources: resolve(values.resources)});
	const id = 'regression-unavailable-note';
	const first = await patch(id, 0, 'Original saved note');
	await patch(id, first.rowVersion, 'Another device saved this note');
	started = true;
	await browser(['open', fixture.url]);
	await browser(['set', 'viewport', '360', '800']);
	await browser(['wait', '--text', 'All references']);
	await seedDrafts(
		id,
		['Recovered local note'],
		{saved: false, status: 'untried', note: first.note, revision: 1},
		first.rowVersion,
	);
	assert.equal(await evaluate('document.activeElement?.textContent.trim()'), 'Keep my edits');
	assert.equal(
		await evaluate(
			'document.querySelectorAll(".unavailable-notes .conflict-actions button").length',
		),
		2,
	);
	await browser(['click', '.unavailable-notes .conflict-actions button:first-child']);
	await browser([
		'wait',
		'--fn',
		'document.querySelector(".unavailable-notes .edit-conflict") === null',
	]);
	let practice = await (await fetch(fixture.url + '/api/practice')).json();
	assert.equal(practice.entries[id].note, 'Recovered local note');
	assert.ok(practice.entries[id].rowVersion > first.rowVersion);
	const recoveryId = 'regression-unavailable-recovery';
	assert.equal(practice.entries[recoveryId], undefined);
	await seedDrafts(
		recoveryId,
		['First unsaved version', 'Second unsaved version'],
		{saved: false, status: 'untried', note: '', revision: 1},
		0,
	);
	assert.equal(
		await evaluate(
			'document.querySelectorAll(".unavailable-notes [data-conflict=true] button").length',
		),
		3,
		'Recovery-only IDs need resolution controls even without a saved entry.',
	);
	await browser(['scrollintoview', '.unavailable-notes .conflict-actions button']);
	await browser(['click', '.unavailable-notes .conflict-actions button']);
	await browser(['wait', '--fn', 'document.querySelector(".global-notice") === null']);
	practice = await (await fetch(fixture.url + '/api/practice')).json();
	assert.equal(
		practice.entries[recoveryId],
		undefined,
		'Keeping an absent saved version must not create a row.',
	);
	assert.equal(practice.entries[id].note, 'Recovered local note');
	assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false);
	assert.equal((await browser(['errors'])).trim(), '');
	await fixture.assertPreserved();
	report = {
		passed: true,
		session,
		cases: [
			'conflicting draft for an unavailable saved reference',
			'multiple recovered drafts for an unavailable ID without a saved entry',
		],
		limits:
			'Real built web app and API in a disposable library; this does not test native file pickers.',
	};
} catch (error) {
	failure = error;
	report = {passed: false, session, error: error.message};
} finally {
	try {
		if (started) await browser(['close']);
	} catch (error) {
		failure ??= error;
		report = {...report, passed: false, cleanupError: error.message};
	}
	try {
		await fixture?.close();
	} catch (error) {
		failure ??= error;
		report = {...report, passed: false, cleanupError: error.message};
	}
}
await writeReport(values.output, report);
console.log(JSON.stringify(report, null, 2));
if (failure) throw failure;
