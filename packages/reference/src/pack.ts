import {z} from 'zod';

export const MAX_FILE_BYTES = 2 * 1024 ** 3;
export const MAX_PACK_BYTES = 20 * 1024 ** 3;
export const MAX_PACK_FILES = 30000;
export const packPathSchema = z
	.string()
	.min(1)
	.max(512)
	.refine(value => {
		const segments = value.split('/');
		return (
			/^[a-zA-Z0-9_/.-]+$/.test(value) &&
			!value.startsWith('/') &&
			segments.length <= 20 &&
			segments.every(segment => segment !== '' && !segment.startsWith('.'))
		);
	}, 'Pack paths must be relative files without traversal');
export const packVersionSchema = z
	.string()
	.regex(
		/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
		'Use a semantic pack version, for example 1.0.0.',
	)
	.max(100);
const common = {
	id: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
		.max(100),
	games: z.array(packPathSchema).min(1).max(100),
	catalogs: z.array(packPathSchema).min(1).max(1000),
	files: z
		.array(
			z.strictObject({
				path: packPathSchema,
				sha256: z.string().regex(/^[a-f0-9]{64}$/),
				bytes: z.number().int().nonnegative().max(MAX_FILE_BYTES),
			}),
		)
		.max(MAX_PACK_FILES),
};
export const packManifestSchema = z
	.discriminatedUnion('formatVersion', [
		z.strictObject({formatVersion: z.literal(1), ...common, version: z.string().min(1).max(100)}),
		z.strictObject({
			formatVersion: z.literal(2),
			...common,
			version: packVersionSchema,
			title: z.string().min(1).max(120),
			author: z.string().min(1).max(120),
			derivedFrom: z.strictObject({id: common.id, version: z.string().min(1).max(100)}).optional(),
		}),
	])
	.superRefine((manifest, context) => {
		const paths = new Set(manifest.files.map(file => file.path));
		if (paths.size !== manifest.files.length || paths.has('manifest.json'))
			context.addIssue({
				code: 'custom',
				path: ['files'],
				message: 'Pack file paths must be unique; manifest.json is not a payload file',
			});
		for (const path of [...manifest.games, ...manifest.catalogs])
			if (!paths.has(path))
				context.addIssue({code: 'custom', message: `Missing manifest file: ${path}`});
		if (manifest.files.reduce((sum, file) => sum + file.bytes, 0) > MAX_PACK_BYTES)
			context.addIssue({code: 'custom', message: 'Content pack exceeds the unpacked size limit'});
	});
export type PackManifest = z.infer<typeof packManifestSchema>;

/** Unknown legacy edition strings are readable but have no guessed ordering. */
export function comparePackVersions(left: string, right: string): number | null {
	if (!packVersionSchema.safeParse(left).success || !packVersionSchema.safeParse(right).success)
		return null;
	const parse = (value: string) => {
		const content = value.split('+')[0];
		const dash = content.indexOf('-');
		const core = dash < 0 ? content : content.slice(0, dash);
		const prerelease = dash < 0 ? undefined : content.slice(dash + 1);
		return {core: core.split('.').map(BigInt), pre: prerelease?.split('.')};
	};
	const a = parse(left),
		b = parse(right);
	for (let index = 0; index < 3; index++) {
		if (a.core[index] < b.core[index]) return -1;
		if (a.core[index] > b.core[index]) return 1;
	}
	if (!a.pre && !b.pre) return 0;
	if (!a.pre) return 1;
	if (!b.pre) return -1;
	for (let index = 0; index < Math.max(a.pre.length, b.pre.length); index++) {
		const x = a.pre[index],
			y = b.pre[index];
		if (x === y) continue;
		if (x === undefined) return -1;
		if (y === undefined) return 1;
		const xn = /^\d+$/.test(x),
			yn = /^\d+$/.test(y);
		if (xn && yn) return BigInt(x) < BigInt(y) ? -1 : 1;
		if (xn !== yn) return xn ? -1 : 1;
		return x < y ? -1 : 1;
	}
	return 0;
}
