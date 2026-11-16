import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const options = JSON.parse(process.argv[2]);
const {startLibraryServer} = await import(pathToFileURL(options.serverModule).href);
const warnings = [];
process.on('warning', warning => warnings.push({name: warning.name, message: warning.message}));
let app;
try {
	app = await startLibraryServer({
		libraryDir: options.libraryDir,
		seedDir: options.seedDir,
		webDir: options.webDir,
		port: 0,
		appVersion: 'performance-fixture',
	});
	process.send({type: 'ready', url: app.url});
} catch (error) {
	process.send({type: 'error', error: error.message});
	process.disconnect();
}
let closing = false;
async function close() {
	if (closing) return;
	closing = true;
	await app?.close();
	if (process.connected) process.disconnect();
}
function mediaDescriptors() {
	if (process.platform === 'win32') return null;
	try {
		return execFileSync('lsof', ['-a', '-p', String(process.pid), '-Fn'], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		})
			.split('\n')
			.filter(
				line =>
					line.startsWith('n') && line.includes(options.libraryDir) && /\.(mp4|webm)$/.test(line),
			).length;
	} catch {
		return null;
	}
}
process.on('message', async message => {
	if (message.command === 'close') {
		await close();
		return;
	}
	if (message.command !== 'snapshot' || closing) return;
	await delay(150);
	const beforeGc = {memory: process.memoryUsage(), openMediaDescriptors: mediaDescriptors()};
	global.gc();
	await delay(20);
	process.send({
		id: message.id,
		value: {
			at: Date.now(),
			beforeGc,
			memory: process.memoryUsage(),
			cpu: process.cpuUsage(),
			resources: process.getActiveResourcesInfo().reduce((counts, name) => {
				counts[name] = (counts[name] ?? 0) + 1;
				return counts;
			}, {}),
			warnings: [...warnings],
		},
	});
});
process.once('disconnect', () => {
	void close();
});
process.once('SIGTERM', () => {
	void close();
});
process.once('SIGINT', () => {
	void close();
});
