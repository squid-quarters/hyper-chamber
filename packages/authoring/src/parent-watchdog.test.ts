import {spawn, type ChildProcess} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect, test} from 'vitest';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate: () => Promise<boolean>, timeout = 2500) {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (await predicate()) return true;
		await delay(25);
	}
	return false;
}
test('a native-owned tool exits after parent death and releases its workspace lease', async () => {
	const root = await mkdtemp(join(tmpdir(), 'hc-parent-watchdog-'));
	let parent: ChildProcess | undefined;
	let childPid: number | undefined;
	let db: DatabaseSync | undefined;
	try {
		const ready = join(root, 'ready.json');
		const database = join(root, 'lease.sqlite');
		const moduleUrl = new URL('./parent-watchdog.ts', import.meta.url).href;
		const childScript = join(root, 'child.mjs');
		await writeFile(
			childScript,
			`import {watchParent} from ${JSON.stringify(moduleUrl)};
import {DatabaseSync} from 'node:sqlite'; import {writeFileSync} from 'node:fs';
watchParent(process.env.HYPER_CHAMBER_PARENT_PID);
const db=new DatabaseSync(${JSON.stringify(database)}); db.exec('BEGIN EXCLUSIVE');
writeFileSync(${JSON.stringify(ready)},JSON.stringify({pid:process.pid})); setInterval(()=>{},1000);`,
		);
		const parentScript = join(root, 'parent.mjs');
		await writeFile(
			parentScript,
			`import {spawn} from 'node:child_process'; spawn(process.execPath,[${JSON.stringify(childScript)}],{stdio:'ignore',env:{...process.env,HYPER_CHAMBER_PARENT_PID:String(process.pid)}}); setInterval(()=>{},1000);`,
		);
		parent = spawn(process.execPath, [parentScript], {stdio: 'ignore'});
		expect(
			await until(async () => {
				try {
					childPid = JSON.parse(await readFile(ready, 'utf8')).pid;
					return true;
				} catch {
					return false;
				}
			}),
		).toBe(true);
		db = new DatabaseSync(database);
		expect(() => db!.exec('BEGIN EXCLUSIVE')).toThrow();
		parent.kill();
		await new Promise<void>(resolve => parent!.once('exit', () => resolve()));
		const released = await until(async () => {
			try {
				db!.exec('BEGIN EXCLUSIVE; ROLLBACK');
				return true;
			} catch {
				return false;
			}
		});
		expect(released).toBe(true);
	} finally {
		parent?.kill();
		if (childPid) {
			try {
				process.kill(childPid);
			} catch {}
		}
		db?.close();
		await rm(root, {recursive: true, force: true});
	}
}, 10000);
