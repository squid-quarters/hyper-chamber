/** Stop this tool if its native owner disappears. It never signals another PID. */
export function watchParent(value: string | undefined): void {
	if (value === undefined) return;
	if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)))
		throw new Error('The native pack-tool parent identity is invalid.');
	const parentPid = Number(value);
	const check = () => {
		try {
			// Signal 0 only checks liveness. The only process terminated is this tool.
			process.kill(parentPid, 0);
		} catch (error) {
			if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') {
				process.stderr.write(
					'Hyper Chamber closed; its unfinished pack-tool operation was stopped. Reopen the workspace before retrying.\n',
				);
				process.exit(1);
			}
		}
	};
	check();
	setInterval(check, 250).unref();
}
