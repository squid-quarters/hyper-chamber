#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {copyFile, mkdir, readFile, writeFile, readdir} from 'node:fs/promises';
import {basename, join, resolve} from 'node:path';
import {releaseVersion, describeAsset, installerName, assertReleaseSource} from './model.mjs';
import {repositoryRoot, collectPack} from '../desktop/pack.mjs';

const {values} = parseArgs({
	options: {
		installers: {type: 'string'},
		packs: {type: 'string'},
		output: {type: 'string'},
		'source-commit': {type: 'string'},
		'pack-verification': {type: 'string'},
	},
});
if (
	!values.installers ||
	!values.packs ||
	!values.output ||
	!values['pack-verification'] ||
	!/^[a-f0-9]{40}$/.test(values['source-commit'] ?? '')
)
	throw new Error(
		'Provide --installers, --packs, --pack-verification, --output and an exact --source-commit.',
	);
assertReleaseSource(repositoryRoot, values['source-commit']);
const version = await releaseVersion(repositoryRoot);
const output = resolve(values.output);
await mkdir(output, {recursive: true});
if ((await readdir(output)).length)
	throw new Error('Assemble into an empty directory; do not replace release assets.');
const records = [];
const builds = [];
const stage = async path => {
	const destination = join(output, basename(path));
	await copyFile(path, destination, constants.COPYFILE_FICLONE);
	records.push(await describeAsset(destination));
};
for (const [id, platform, arch] of [
	['macos-arm64', 'darwin', 'arm64'],
	['macos-x64', 'darwin', 'x64'],
	['windows-x64', 'win32', 'x64'],
]) {
	const directory = join(resolve(values.installers), `beta-installer-${id}`);
	const info = JSON.parse(await readFile(join(directory, 'build-info.json'), 'utf8'));
	if (
		info.sourceCommit !== values['source-commit'] ||
		info.version !== version ||
		info.platform !== platform ||
		info.arch !== arch ||
		info.verification?.passed !== true ||
		info.verification?.checks?.nativeBootstrap !== true
	)
		throw new Error(`Unverified or mismatched installer build: ${id}`);
	const file = join(directory, installerName(version, platform, arch));
	const actual = await describeAsset(file);
	if (actual.sha256 !== info.asset.sha256 || actual.bytes !== info.asset.bytes)
		throw new Error(`Installer differs from the CI checksum: ${id}`);
	await stage(file);
	const metadata = join(output, `build-info-${id}.json`);
	await writeFile(metadata, `${JSON.stringify(info, null, 2)}\n`, {flag: 'wx'});
	records.push(await describeAsset(metadata));
	builds.push({platform, arch, asset: actual.name, signing: info.signing, node: info.node});
}
const packs = JSON.parse(await readFile(join(resolve(values.packs), 'content-packs.json'), 'utf8'));
const packProof = JSON.parse(await readFile(resolve(values['pack-verification']), 'utf8'));
if (
	packProof.passed !== true ||
	packProof.version !== version ||
	packProof.indexSha256 !==
		(await describeAsset(join(resolve(values.packs), 'content-packs.json'))).sha256
)
	throw new Error('A passing, matching content-pack import verification is required.');
const catalogs = (await readdir(join(repositoryRoot, 'content/games/sf6/references')))
	.filter(name => name.endsWith('.json'))
	.map(name => name.slice(0, -5))
	.sort();
if (
	packs.version !== version ||
	JSON.stringify(packs.packs.map(entry => entry.character).sort()) !== JSON.stringify(catalogs)
)
	throw new Error('Release must include the complete, current character-pack index.');
for (const entry of packs.packs) {
	if (entry.name !== `sf6-${entry.character}_${version}.hcpack`)
		throw new Error('Unexpected character-pack filename.');
	const current = await collectPack({gameId: 'sf6', characterId: entry.character, version});
	const currentManifest = createHash('sha256')
		.update(JSON.stringify(current.manifest))
		.digest('hex');
	if (
		entry.manifestSha256 !== currentManifest ||
		entry.references !== current.referenceCount ||
		entry.demonstrations !== current.clipCount
	)
		throw new Error(`Character pack does not match the current source content: ${entry.character}`);
	const path = join(resolve(values.packs), entry.name);
	const actual = await describeAsset(path);
	if (
		actual.sha256 !== entry.sha256 ||
		actual.bytes !== entry.bytes ||
		entry.references !== entry.demonstrations
	)
		throw new Error(`Character pack differs from its index: ${entry.character}`);
	await stage(path);
}
await stage(join(resolve(values.packs), 'content-packs.json'));
const proofPath = join(output, 'content-verification.json');
await writeFile(proofPath, `${JSON.stringify(packProof, null, 2)}\n`, {flag: 'wx'});
records.push(await describeAsset(proofPath));
records.sort((a, b) => a.name.localeCompare(b.name, 'en'));
const manifestPath = join(output, 'release-manifest.json');
await writeFile(
	manifestPath,
	`${JSON.stringify({formatVersion: 1, version, tag: `v${version}`, prerelease: true, sourceCommit: values['source-commit'], builds, characters: packs.packs.length, references: packs.packs.reduce((sum, pack) => sum + pack.references, 0), files: records}, null, 2)}\n`,
	{flag: 'wx'},
);
records.push(await describeAsset(manifestPath));
await writeFile(
	join(output, 'SHA256SUMS.txt'),
	records.map(file => `${file.sha256}  ${file.name}\n`).join(''),
	{flag: 'wx'},
);
console.log(
	`Assembled ${records.length + 1} beta release assets, including ${packs.packs.length} character packs.`,
);
