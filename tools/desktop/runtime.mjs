import {execFileSync} from 'node:child_process';

export function assertMacOsMinimum(runtimeMinimum, applicationMinimum) {
	const parts = version => {
		if (typeof version !== 'string' || !/^\d+\.\d+(?:\.\d+)?$/.test(version))
			throw new Error(`Invalid macOS minimum version: ${version}`);
		return version.split('.').map(Number).concat([0]).slice(0, 3);
	};
	const runtime = parts(runtimeMinimum);
	const application = parts(applicationMinimum);
	for (let index = 0; index < 3; index++) {
		if (application[index] > runtime[index]) return;
		if (application[index] < runtime[index])
			throw new Error(
				`The bundled Node runtime requires macOS ${runtimeMinimum}; the application advertises ${applicationMinimum}. Raise bundle.macOS.minimumSystemVersion before packaging.`,
			);
	}
}

export function verifyMacOsRuntime(applicationMinimum, executable = process.execPath) {
	const loadCommands = execFileSync('otool', ['-l', executable], {encoding: 'utf8'});
	const minimums = [...loadCommands.matchAll(/^\s+minos\s+([\d.]+)/gm)].map(match => match[1]);
	if (!minimums.length)
		throw new Error('The bundled Node runtime minimum macOS version could not be identified.');
	for (const minimum of minimums) assertMacOsMinimum(minimum, applicationMinimum);
}

export const BUNDLED_NODE_VERSION = 'v24.14.1';
export function assertNativeRuntime({version, platform, arch}, target = {}) {
	if (version !== BUNDLED_NODE_VERSION)
		throw new Error(
			`Desktop packaging requires official Node ${BUNDLED_NODE_VERSION}; found ${version}.`,
		);
	if (
		!['darwin', 'win32'].includes(platform) ||
		!['arm64', 'x64'].includes(arch) ||
		(platform === 'win32' && arch !== 'x64')
	)
		throw new Error(`Unsupported desktop runtime: ${platform}-${arch}`);
	if ((target.platform && target.platform !== platform) || (target.arch && target.arch !== arch))
		throw new Error(
			`The bundled Node runtime must match the native build target (${target.platform ?? platform}-${target.arch ?? arch}); use its architecture-native runner.`,
		);
}
