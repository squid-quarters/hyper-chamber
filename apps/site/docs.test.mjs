import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {unzipSync} from 'fflate';
import {packManifestSchema, referenceSchema} from '@hyper-chamber/reference';
import {buildGuides, guideHref, renderGuide} from './docs.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
test('creator docs reject active links and directory escapes', () => {
	for (const value of [
		'javascript:alert(1)',
		'data:text/html,hello',
		'//example.com',
		'../other',
		'%2e%2e/other',
		'/absolute',
		'https://user:secret@example.com',
		'a\\b',
	]) {
		assert.throws(() => guideHref(value));
	}
	assert.equal(guideHref('format.md#json-tool-protocol'), 'format.html#json-tool-protocol');
	assert.equal(
		guideHref(
			'https://squid-quarters.github.io/hyper-chamber/create-packs/downloads/sample.hcpack',
		),
		'downloads/sample.hcpack',
	);
});
test('Markdown HTML and code remain inert while normal links work', () => {
	const {html} = renderGuide(
		'# Example\n\n<script>alert(1)</script>\n\n`<img onerror="x">`\n\n```html\n<a href="javascript:alert(1)">\n```\n\n[Guide](first-pack.md)',
	);
	assert.ok(!html.includes('<script>'));
	assert.ok(!html.includes('<img'));
	assert.ok(html.includes('&lt;script&gt;'));
	assert.ok(html.includes('href="first-pack.html"'));
	assert.throws(() => renderGuide('# Example\n\n[Unsafe](javascript:alert%281%29)'));
	assert.throws(() => renderGuide('# One\n# Two'));
});
test('downloaded sample is complete, attributable and rebuilds without mutating its source', async () => {
	const before = await readFile(join(repo, 'docs/packs/sample/workspace.json'));
	const directory = await mkdtemp(join(tmpdir(), 'hc-site-docs-test-'));
	try {
		await buildGuides(repo, directory);
		assert.deepEqual(await readFile(join(repo, 'docs/packs/sample/workspace.json')), before);
		const downloads = join(directory, 'create-packs/downloads');
		const pack = unzipSync(await readFile(join(downloads, 'sample.hcpack')));
		const manifest = packManifestSchema.parse(
			JSON.parse(Buffer.from(pack['manifest.json']).toString()),
		);
		assert.equal(manifest.formatVersion, 2);
		for (const file of manifest.files) {
			assert.equal(pack[file.path]?.byteLength, file.bytes);
			assert.equal(createHash('sha256').update(pack[file.path]).digest('hex'), file.sha256);
		}
		const references = JSON.parse(Buffer.from(pack[manifest.catalogs[0]]).toString()).map(value =>
			referenceSchema.parse(value),
		);
		assert.equal(references.length, 1);
		assert.equal(references[0].verification.status, 'draft');
		assert.equal(references[0].source.kind, 'recording');
		assert.match(references[0].summary, /not a gameplay demonstration/i);
		assert.ok(references[0].notes.some(note => note.includes('0BSD')));
		const sample = unzipSync(await readFile(join(downloads, 'sample-workspace.zip')));
		assert.ok(sample['sample-workspace/COPYING']);
		assert.ok(sample['sample-workspace/PROVENANCE.md']);
		assert.ok(sample['sample-workspace/media/demo-placeholder/clip.mp4']);
		assert.ok(!Object.keys(sample).some(path => path.includes('.sqlite')));
		const skill = unzipSync(await readFile(join(downloads, 'hyper-chamber-packs.zip')));
		assert.ok(skill['hyper-chamber-packs/SKILL.md']);
		assert.ok(skill['hyper-chamber-packs/references/commands.md']);
	} finally {
		await rm(directory, {recursive: true, force: true});
	}
});
