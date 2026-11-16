#!/usr/bin/env node
import {executeAuthoringCommand} from './index.ts';
import {watchParent} from './parent-watchdog.ts';
import {readFile} from 'node:fs/promises';
import {gameDefinitionSchema} from '@hyper-chamber/reference';
import {z} from 'zod';

async function main(): Promise<void> {
	watchParent(process.env.HYPER_CHAMBER_PARENT_PID);
	if (process.argv.includes('--help')) {
		console.log(
			'Hyper Chamber pack tools\nRun with --json and send a JSON request on standard input.\nCommands: profiles, create, read, save, validate, add-media, write-asset, export, fork.\nAll commands use a directory field naming an editable workspace folder.',
		);
		return;
	}
	if (process.argv.slice(2).some(value => value !== '--json'))
		throw new Error('Use --json with a request on standard input, or --help.');
	let size = 0;
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		size += chunk.length;
		if (size > 32 * 1024 ** 2) throw new Error('The authoring request exceeds 32 MiB.');
		chunks.push(chunk);
	}
	const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	let result: unknown;
	if (
		value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		'command' in value &&
		value.command === 'profiles'
	) {
		if (Object.keys(value).length !== 1)
			throw new Error('The profiles command accepts no additional fields.');
		const path = new URL(
			import.meta.url.endsWith('/src/cli.ts') ? '../dist/profiles.json' : './profiles.json',
			import.meta.url,
		);
		result = z
			.array(gameDefinitionSchema)
			.min(1)
			.parse(JSON.parse(await readFile(path, 'utf8')));
	} else result = await executeAuthoringCommand(value);
	console.log(JSON.stringify({ok: true, result}));
}
main().catch(error => {
	console.log(
		JSON.stringify({
			ok: false,
			error: {
				code: 'authoring_failed',
				message: error instanceof Error ? error.message : 'The authoring command failed.',
			},
		}),
	);
	process.exitCode = 1;
});
