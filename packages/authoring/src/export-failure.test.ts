import {cp, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {afterEach, expect, test, vi} from 'vitest';
import {exportWorkspace, readWorkspace, saveWorkspace} from './index.ts';

const fault = vi.hoisted(() => ({ledger: false, hardLinks: false}));
vi.mock('node:fs/promises', async importOriginal => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return {
		...actual,
		link: async (...args: Parameters<typeof actual.link>) => {
			if (fault.hardLinks)
				throw Object.assign(new Error('Hard links unsupported'), {code: 'EOPNOTSUPP'});
			return actual.link(...args);
		},
		rename: async (...args: Parameters<typeof actual.rename>) => {
			if (fault.ledger && String(args[1]).endsWith('workspace.json'))
				throw Object.assign(new Error('Injected ledger commit EACCES'), {code: 'EACCES'});
			return actual.rename(...args);
		},
	};
});
const roots: string[] = [];
afterEach(async () => {
	fault.ledger = false;
	fault.hardLinks = false;
	for (const root of roots.splice(0)) await rm(root, {recursive: true, force: true});
});
async function fixture() {
	const root = await mkdtemp(join(tmpdir(), 'hc-export-failure-'));
	roots.push(root);
	const directory = join(root, 'workspace');
	await cp(fileURLToPath(new URL('../../../docs/packs/sample', import.meta.url)), directory, {
		recursive: true,
	});
	return {root, directory};
}
test('never publishes an archive when its export ledger cannot be committed', async () => {
	const {root, directory} = await fixture();
	const output = join(root, 'first.hcpack');
	fault.ledger = true;
	await expect(exportWorkspace(directory, output)).rejects.toThrow('ledger commit');
	expect(
		await readFile(output).then(
			() => true,
			() => false,
		),
	).toBe(false);
	expect((await readdir(root)).some(name => name.startsWith('.hc-export-'))).toBe(false);
	expect((await readWorkspace(directory)).lastExport).toBeUndefined();
	fault.ledger = false;
	await expect(exportWorkspace(directory, output)).resolves.toMatchObject({referenceCount: 1});
});
test('an exclusive-copy publication failure keeps existing output and allows an identical retry', async () => {
	const {root, directory} = await fixture();
	const output = join(root, 'existing.hcpack');
	fault.hardLinks = true;
	await writeFile(output, 'keep user output');
	await expect(exportWorkspace(directory, output)).rejects.toThrow();
	expect(await readFile(output, 'utf8')).toBe('keep user output');
	expect((await readWorkspace(directory)).lastExport).toMatchObject({version: '1.0.0'});
	await expect(exportWorkspace(directory, join(root, 'retry.hcpack'))).resolves.toMatchObject({
		referenceCount: 1,
	});
	const changed = await readWorkspace(directory);
	changed.title += ' changed';
	await saveWorkspace(directory, changed);
	await expect(exportWorkspace(directory, join(root, 'changed.hcpack'))).rejects.toThrow(
		/edition.*exported|version/i,
	);
});
