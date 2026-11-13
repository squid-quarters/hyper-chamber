#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {copyFile, mkdir, readdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {releaseVersion, installerName, describeAsset} from './model.mjs';
import {repositoryRoot} from '../desktop/pack.mjs';

const {values} = parseArgs({
	options: {
		'bundle-dir': {type: 'string'},
		output: {type: 'string'},
		verification: {type: 'string'},
	},
});
if (!values['bundle-dir'] || !values.output || !values.verification)
	throw new Error('Provide --bundle-dir, --output and --verification.');
const version = await releaseVersion(repositoryRoot);
const expected = installerName(version, process.platform, process.arch);
const extension = process.platform === 'darwin' ? '.dmg' : '.exe';
const bundleDir = resolve(values['bundle-dir']);
const matches = (await readdir(bundleDir, {recursive: true})).filter(path =>
	process.platform === 'darwin' ? path.endsWith(extension) : path.endsWith('-setup.exe'),
);
if (matches.length !== 1)
	throw new Error(`Expected one ${extension} installer, found ${matches.length}.`);
const verification = JSON.parse(await readFile(resolve(values.verification), 'utf8'));
if (
	verification.platform !== process.platform ||
	verification.arch !== process.arch ||
	verification.version !== version
)
	throw new Error('The smoke verification does not match this installer target/version.');
if (verification.passed !== true) throw new Error('Packaged smoke verification did not pass.');
const directory = resolve(values.output);
await mkdir(directory, {recursive: true});
const destination = join(directory, expected);
await copyFile(join(bundleDir, matches[0]), destination);
const asset = await describeAsset(destination);
await writeFile(
	join(directory, 'build-info.json'),
	`${JSON.stringify(
		{
			formatVersion: 1,
			version,
			tag: `v${version}`,
			sourceCommit: process.env.GITHUB_SHA ?? null,
			platform: process.platform,
			arch: process.arch,
			signing: process.platform === 'darwin' ? 'ad-hoc; not notarized' : 'unsigned',
			node: process.version,
			asset,
			verification,
		},
		null,
		2,
	)}\n`,
	{flag: 'wx'},
);
console.log(`Collected ${asset.name} (${asset.bytes} bytes, SHA-256 ${asset.sha256}).`);
