#!/usr/bin/env node
import {cp, copyFile, chmod, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {basename, dirname, join, parse, resolve} from 'node:path';
import {collectPack, repositoryRoot, writeUnpackedPack} from './pack.mjs';
import {verifyMacOsRuntime} from './runtime.mjs';

const output = resolve(process.argv[2] ?? join(repositoryRoot, 'apps/desktop/build/resources'));
const server = join(repositoryRoot, 'apps/server/dist');
const web = join(repositoryRoot, 'apps/web/build');
for (const path of [join(server, 'cli.mjs'), join(web, 'index.html')]) {
	await stat(path).catch(() => {
		throw new Error(
			`Build the server and web app before preparing desktop resources. Missing: ${path}`,
		);
	});
}
if (Number(process.versions.node.split('.')[0]) !== 24)
	throw new Error('Desktop packaging requires Node 24 (the bundled runtime).');
const version = JSON.parse(
	await readFile(join(repositoryRoot, 'apps/desktop/package.json'), 'utf8'),
).version;
if (process.platform === 'darwin') {
	const config = JSON.parse(
		await readFile(join(repositoryRoot, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8'),
	);
	verifyMacOsRuntime(config.bundle.macOS.minimumSystemVersion);
}
// Refuse arbitrary recursive deletion if a path was mistyped.
if (basename(output) !== 'resources' || dirname(output) === parse(output).root)
	throw new Error('The output must be a dedicated directory named resources.');
const defaultOutput = join(repositoryRoot, 'apps/desktop/build/resources');
if (output !== defaultOutput) {
	const existing = await readdir(output).catch(error => {
		if (error.code === 'ENOENT') return [];
		throw error;
	});
	if (existing.length && !existing.includes('runtime.json'))
		throw new Error('Refusing to replace a resource directory that was not created by this tool.');
}
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
const node = join(output, process.platform === 'win32' ? 'node.exe' : 'node');
await copyFile(process.execPath, node);
await chmod(node, 0o755);
const executableDirectory = dirname(process.execPath);
const distributionRoot = dirname(executableDirectory);
const licenseCandidates = [
	join(executableDirectory, 'LICENSE'), // Windows distribution
	join(distributionRoot, 'LICENSE'), // Official Unix distribution
	join(distributionRoot, 'share/doc/node/LICENSE'),
	join(distributionRoot, 'share/doc/node@24/LICENSE'),
];
let licenseCopied = false;
for (const candidate of licenseCandidates) {
	try {
		await copyFile(candidate, join(output, 'NODE-LICENSE.txt'));
		licenseCopied = true;
		break;
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
}
if (!licenseCopied)
	throw new Error(
		'The installed Node distribution license was not found; package with an official Node 24 distribution that includes its LICENSE.',
	);
await cp(server, join(output, 'server'), {recursive: true});
await cp(web, join(output, 'web'), {
	recursive: true,
	filter: source => source !== join(web, 'media'),
});
const pack = await collectPack({starter: true, version});
await writeUnpackedPack(pack, join(output, 'seed'));
await writeFile(
	join(output, 'runtime.json'),
	`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, appVersion: version, starterReferences: pack.referenceCount, starterClips: pack.clipCount}, null, 2)}\n`,
);
console.log(
	`Desktop resources prepared: ${pack.referenceCount} catalog references; ${pack.clipCount} starter demonstrations; Node ${process.version} ${process.platform}-${process.arch}.`,
);
