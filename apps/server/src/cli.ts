import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {startLibraryServer} from './index';

const {values} = parseArgs({
	options: {
		'library-dir': {type: 'string'},
		'web-dir': {type: 'string'},
		'seed-dir': {type: 'string'},
		'media-dir': {type: 'string'},
		port: {type: 'string', default: '5376'},
		host: {type: 'string', default: '127.0.0.1'},
		'app-version': {type: 'string'},
		'admin-token': {type: 'string'},
		help: {type: 'boolean', default: false},
	},
});
if (values.help) {
	console.log(
		'Hyper Chamber local application server\n--library-dir PATH --web-dir PATH --seed-dir PATH --media-dir PATH --port NUMBER --host 127.0.0.1\nThe desktop app supplies its own runtime and these locations automatically.',
	);
} else {
	const port = Number(values.port);
	if (!Number.isInteger(port) || port < 0 || port > 65535)
		throw new Error('Port must be a number from 0 to 65535.');
	const defaultDir =
		process.platform === 'win32'
			? join(process.env.LOCALAPPDATA ?? homedir(), 'Hyper Chamber', 'library')
			: process.platform === 'darwin'
				? join(homedir(), 'Library', 'Application Support', 'Hyper Chamber', 'library')
				: join(
						process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'),
						'hyper-chamber',
						'library',
					);
	const app = await startLibraryServer({
		libraryDir: resolve(
			values['library-dir'] ?? process.env.HYPER_CHAMBER_LIBRARY_DIR ?? defaultDir,
		),
		webDir: values['web-dir'] ? resolve(values['web-dir']) : undefined,
		seedDir: values['seed-dir'] ? resolve(values['seed-dir']) : undefined,
		mediaDir: values['media-dir'] ? resolve(values['media-dir']) : undefined,
		port,
		host: values.host,
		appVersion: values['app-version'] ?? process.env.HYPER_CHAMBER_VERSION,
		adminToken: process.env.HYPER_CHAMBER_ADMIN_TOKEN ?? values['admin-token'],
	});
	console.log(
		`HYPER_CHAMBER_READY ${JSON.stringify({port: app.port, url: app.url, libraryId: app.libraryId})}`,
	);
	let stopping = false;
	const shutdown = async () => {
		if (stopping) return;
		stopping = true;
		try {
			await app.close();
		} catch (error) {
			console.error(error);
			process.exitCode = 1;
		}
	};
	process.once('SIGTERM', () => {
		void shutdown();
	});
	process.once('SIGINT', () => {
		void shutdown();
	});
	const parentPid = Number(process.env.HYPER_CHAMBER_PARENT_PID);
	if (Number.isSafeInteger(parentPid) && parentPid > 1) {
		const watchdog = setInterval(() => {
			try {
				process.kill(parentPid, 0);
			} catch (error) {
				if (error instanceof Error && 'code' in error && error.code === 'ESRCH') {
					clearInterval(watchdog);
					void shutdown();
				}
			}
		}, 1000);
		watchdog.unref();
	}
}
