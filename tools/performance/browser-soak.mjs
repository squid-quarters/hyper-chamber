#!/usr/bin/env node
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {createFixture, writeReport} from './fixture.mjs';

const {values} = parseArgs({
	options: {
		resources: {type: 'string', default: 'apps/desktop/build/resources'},
		iterations: {type: 'string', default: '20'},
		output: {type: 'string'},
	},
});
const iterations = Number(values.iterations);
assert.ok(
	Number.isInteger(iterations) && iterations >= 3 && iterations <= 500,
	'Use 3–500 browser iterations.',
);
const session = `hc-performance-${randomUUID()}`;
const executable = process.env.AGENT_BROWSER_EXECUTABLE ?? 'agent-browser';
let browserStarted = false;
let fixture;
let report;
let failure;
let interrupted = false;
process.once('SIGINT', () => {
	interrupted = true;
});
process.once('SIGTERM', () => {
	interrupted = true;
});
async function browser(args, input = '') {
	return new Promise((resolve, reject) => {
		const child = spawn(executable, ['--session', session, ...args], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		let output = '',
			errors = '';
		child.stdout.on('data', chunk => {
			output = (output + chunk.toString()).slice(-2 * 1024 ** 2);
		});
		child.stderr.on('data', chunk => {
			errors = (errors + chunk.toString()).slice(-32768);
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
	const result = await browser(['eval', '--stdin'], script);
	return JSON.parse(result);
}
const instrumentation = String.raw`(() => {
 const urls = new Set(); const listeners = new Set(); const ids = new WeakMap(); let next = 0;
 const originalCreate = URL.createObjectURL.bind(URL), originalRevoke = URL.revokeObjectURL.bind(URL);
 URL.createObjectURL = value => {const url = originalCreate(value); urls.add(url); return url;};
 URL.revokeObjectURL = url => {urls.delete(url); return originalRevoke(url);};
 const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
 function key(target, type, listener, options) {
  const name = target === window ? 'window' : target === document ? 'document' : target === window.visualViewport ? 'viewport' : null;
  if (!name || !listener || (typeof listener !== 'function' && typeof listener !== 'object')) return null;
  if (!ids.has(listener)) ids.set(listener, ++next);
  return name + ':' + type + ':' + (!!(typeof options === 'boolean' ? options : options?.capture)) + ':' + ids.get(listener);
 }
 EventTarget.prototype.addEventListener = function(type, listener, options) {const automaticallyRemoved = typeof options === "object" && options && (options.once || options.signal); const id = automaticallyRemoved ? null : key(this, type, listener, options); if(id) listeners.add(id); return add.call(this, type, listener, options);};
 EventTarget.prototype.removeEventListener = function(type, listener, options) {const id = key(this, type, listener, options); if(id) listeners.delete(id); return remove.call(this, type, listener, options);};
 const removed = []; const longTasks = [];
 const observer = new MutationObserver(records => {
  for(const record of records) for(const node of record.removedNodes) {
   if(!(node instanceof Element)) continue;
   const media = [...(node.matches('video') ? [node] : []), ...node.querySelectorAll('video')];
   for(const video of media) {const weak = new WeakRef(video); queueMicrotask(()=>{const target = weak.deref(); if(target && !target.isConnected) removed.push({paused:target.paused, source:target.getAttribute('src')});});}
  }
 });
 observer.observe(document.documentElement,{childList:true,subtree:true});
 if(PerformanceObserver.supportedEntryTypes?.includes('longtask')) {const tasks = new PerformanceObserver(list=>{for(const entry of list.getEntries())longTasks.push(entry.duration);});tasks.observe({type:'longtask',buffered:false});}
 window.__hcPerformance = {read:()=>({nodes:document.querySelectorAll('*').length,videos:document.querySelectorAll('video').length,objectUrls:urls.size,globalListeners:listeners.size,removed:[...removed],longTasks:[...longTasks],heapBytes:performance.memory?.usedJSHeapSize ?? null})};
 return {installed:true};
})()`;
const samples = [],
	timings = [];
async function cycle() {
	const started = performance.now();
	// Clicking a partly visible large card's centre may hit outside the viewport.
	await browser(['scrollintoview', 'a.reference-card h2']);
	await browser(['click', 'a.reference-card h2']);
	await browser(['wait', '--text', 'Replay Reference']);
	await browser(['wait', '--fn', 'document.querySelector("video")?.readyState >= 2']);
	assert.equal(await evaluate('document.querySelectorAll("video").length'), 1);
	const entry = await evaluate('new URL(location.href).searchParams.get("entry")');
	const paused = await evaluate('document.querySelector("video").paused');
	if (paused) {
		await browser(['scrollintoview', '[aria-label="Play Clip"]']);
		await browser(['click', '[aria-label="Play Clip"]']);
	}
	await browser([
		'wait',
		'--fn',
		'!document.querySelector("video").paused && document.querySelector("video").currentTime > 0',
	]);
	await browser(['click', '[aria-label="Next reference"]']);
	await browser([
		'wait',
		'--fn',
		`new URL(location.href).searchParams.get('entry') !== ${JSON.stringify(entry)}`,
	]);
	await browser(['click', '[aria-label="Previous reference"]']);
	await browser([
		'wait',
		'--fn',
		`new URL(location.href).searchParams.get('entry') === ${JSON.stringify(entry)}`,
	]);
	await browser(['scrollintoview', '[aria-label="Playback Settings"]']);
	await browser(['click', '[aria-label="Playback Settings"]']);
	await browser(['wait', '--fn', 'document.querySelector("[data-overlay-open=true]") !== null']);
	await browser(['press', 'Escape']);
	await browser(['scrollintoview', '.back-library']);
	await browser(['click', '.back-library']);
	await browser(['wait', '--text', 'All References']);
	await browser(['wait', '--fn', 'document.querySelectorAll("video").length === 0']);
	await browser(['set', 'viewport', '390', '844']);
	await browser(['click', '[aria-label="More Tools"]']);
	await browser([
		'wait',
		'--fn',
		'document.querySelector(".tools-panel[data-overlay-open=true]") !== null',
	]);
	await browser(['press', 'Escape']);
	await browser(['set', 'viewport', '1280', '800']);
	await browser(['wait', '--fn', 'document.querySelector(".more-tools-trigger") === null']);
	return performance.now() - started;
}
await writeReport(values.output, {passed: false, status: 'running', session});
try {
	fixture = await createFixture({resources: resolve(values.resources)});
	browserStarted = true;
	await browser(['open', fixture.url]);
	await browser(['set', 'viewport', '1280', '800']);
	await browser(['wait', '--text', 'All References']);
	await evaluate(instrumentation);
	for (let i = 0; i < 3; i++) await cycle();
	samples.push(await evaluate('window.__hcPerformance.read()'));
	for (let i = 0; i < iterations; i++) {
		assert.equal(interrupted, false, 'Browser performance check interrupted.');
		timings.push(await cycle());
		if ((i + 1) % 5 === 0 || i === iterations - 1)
			samples.push(await evaluate('window.__hcPerformance.read()'));
	}
	const last = samples.at(-1),
		first = samples[0];
	for (const sample of samples) {
		assert.equal(sample.videos, 0);
		assert.equal(
			sample.objectUrls,
			first.objectUrls,
			'Object URLs accumulated after returning to the library.',
		);
		assert.equal(
			sample.globalListeners,
			first.globalListeners,
			'Global event listeners accumulated across reference visits.',
		);
	}
	assert.ok(
		last.removed.length >= iterations * 3,
		'The workload must actually unmount its replay elements.',
	);
	assert.equal(
		last.removed.some(video => !video.paused || video.source !== null),
		false,
		'A removed replay kept playing or retained its media source.',
	);
	assert.equal((await browser(['errors'])).trim(), '', 'The browser reported an uncaught error.');
	await fixture.assertPreserved();
	const host = await fixture.snapshot();
	if (host.beforeGc.openMediaDescriptors !== null)
		assert.equal(host.beforeGc.openMediaDescriptors, 0);
	const sorted = [...timings].sort((a, b) => a - b);
	report = {
		passed: true,
		session,
		node: process.version,
		platform: process.platform,
		iterations,
		warmup: 3,
		references: fixture.references,
		latencyMs: {
			medianCycle: sorted[Math.floor(sorted.length / 2)],
			p95Cycle: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
		},
		samples,
		host,
		limits:
			'Cycle timings include agent-browser IPC and are not INP. Chromium heap is optional, unforced-GC telemetry; it is not a leak verdict. The retained instrumentation records only strings/numbers/WeakRefs, not detached DOM. This checks repeated library/replay/settings transitions; the editor and long sessions still need their own checks.',
	};
} catch (error) {
	failure = error;
	report = {passed: false, error: error.message, samples, session};
} finally {
	try {
		if (browserStarted) await browser(['close']);
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
console.log(
	JSON.stringify(
		{
			...report,
			samples: `${samples.length} samples${values.output ? ` saved to ${values.output}` : '; pass --output to retain them'}`,
		},
		null,
		2,
	),
);
if (failure) throw failure;
