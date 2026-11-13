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
