#!/usr/bin/env node
import {appendFile} from 'node:fs/promises';
import {releaseVersion} from './model.mjs';
import {repositoryRoot} from '../desktop/pack.mjs';

const version = await releaseVersion(repositoryRoot);
if (process.env.GITHUB_OUTPUT)
	await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\n`);
console.log(`Validated beta version ${version}.`);
