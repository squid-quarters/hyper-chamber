#!/usr/bin/env node
import assert from 'node:assert/strict';
import {get} from 'node:http';
import {performance} from 'node:perf_hooks';
import {parseArgs} from 'node:util';
import {createFixture, writeReport} from './fixture.mjs';
const {values} = parseArgs({
	options: {iterations: {type: 'string', default: '100'}, output: {type: 'string'}},
});
const iterations = Number(values.iterations);
assert.ok(
	Number.isInteger(iterations) && iterations >= 10 && iterations <= 5000,
	'Use 10–5000 iterations.',
);
await writeReport(values.output, {passed: false, status: 'running'});
const fixture = await createFixture();
const timings = [];
const samples = [];
let report;
let interrupted = false;
process.once('SIGINT', () => {
	interrupted = true;
});
process.once('SIGTERM', () => {
	interrupted = true;
});
async function cancelledMedia() {
	await new Promise((resolve, reject) => {
		const request = get(
			fixture.url + fixture.reference.media.clip,
			{headers: {Range: 'bytes=0-2097151'}},
			response => {
				response.once('data', () => {
					response.destroy();
					resolve();
				});
				response.once('error', error => {
					if (error.code === 'ECONNRESET') resolve();
					else reject(error);
				});
			},
		);
		request.once('error', reject);
		request.setTimeout(10000, () => request.destroy(new Error('Media cancellation timed out.')));
	});
}
async function cycle() {
	const started = performance.now();
	const catalog = await (await fetch(fixture.url + '/api/catalog')).json();
	assert.equal(catalog.references.length, fixture.references);
	const media = await fetch(fixture.url + fixture.reference.media.clip, {
		headers: {Range: 'bytes=0-4095'},
	});
	assert.equal(media.status, 206);
	assert.equal((await media.arrayBuffer()).byteLength, 4096);
	await cancelledMedia();
	await fixture.assertPreserved();
	return performance.now() - started;
}
try {
	for (let i = 0; i < 10; i++) await cycle();
	samples.push(await fixture.snapshot());
	for (let i = 0; i < iterations; i++) {
		assert.equal(interrupted, false, 'Performance check interrupted.');
		timings.push(await cycle());
		if ((i + 1) % 10 === 0 || i === iterations - 1) samples.push(await fixture.snapshot());
	}
	await fixture.assertPreserved();
	for (const sample of samples) {
		if (sample.beforeGc.openMediaDescriptors !== null)
			assert.equal(
				sample.beforeGc.openMediaDescriptors,
				0,
				'A completed/cancelled media transfer left a file descriptor open.',
			);
		assert.equal(
			sample.warnings.some(warning =>
				/closing file descriptor|garbage collection.*filehandle/i.test(warning.message),
			),
			false,
			'File handles were only closed by garbage collection.',
		);
	}
	const sorted = [...timings].sort((a, b) => a - b);
	report = {
		passed: true,
		node: process.version,
		platform: process.platform,
		architecture: process.arch,
		workload: {
			references: fixture.references,
			iterations,
			warmup: 10,
			perIteration:
				'catalog JSON, 4 KiB media range, cancelled 2 MiB transfer, preserved note check',
		},
		latencyMs: {
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
		},
		samples,
		limits:
			'Memory samples describe this isolated server, not a leak-free guarantee. Windows/media-descriptor inspection is unavailable when lsof is absent. RSS and GC timing vary; no fixed heap threshold is enforced.',
	};
} finally {
	await fixture.close();
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
