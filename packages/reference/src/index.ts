import {z} from 'zod';

const localMedia = z
	.string()
	.regex(/^\/media\/[a-zA-Z0-9/_\-.]+$/)
	.refine(
		path => !path.split('/').some(segment => segment === '.' || segment === '..'),
		'Media paths cannot traverse directories',
	);
export const referenceSchema = z
	.object({
		id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		revision: z.number().int().positive(),
		title: z.string().min(1),
		summary: z.string().min(1),
		kind: z.enum(['combo', 'setup', 'response']),
		situations: z.array(z.string().min(1)),
		outcomes: z.array(z.string().min(1)),
		notation: z.string().min(1),
		inputs: z
			.array(
				z.object({
					id: z.string().min(1),
					notation: z.string().min(1),
					label: z.string().min(1),
					cue: z.string().optional(),
				}),
			)
			.min(1),
		conditions: z.array(z.string()),
		notes: z.array(z.string()),
		resources: z.object({drive: z.string(), super: z.string()}),
		source: z.object({
			id: z.string(),
			title: z.string(),
			creator: z.string(),
			url: z
				.url()
				.refine(s => new URL(s).protocol === 'https:' && new URL(s).hostname === 'www.youtube.com'),
			published: z.string(),
			start: z.number().nonnegative(),
			end: z.number().positive(),
		}),
		verification: z.object({
			status: z.enum(['draft', 'source-reviewed']),
			gameVersion: z.string().nullable(),
			note: z.string(),
		}),
		media: z.object({
			clip: localMedia.optional(),
			poster: localMedia,
			frames: z
				.array(
					z.object({
						id: z.string(),
						src: localMedia,
						alt: z.string().min(1),
						label: z.string().min(1),
						at: z.number().nonnegative(),
					}),
				)
				.min(1),
		}),
		relatedIds: z.array(z.string()),
	})
	.superRefine((r, ctx) => {
		if (r.source.end <= r.source.start)
			ctx.addIssue({
				code: 'custom',
				path: ['source', 'end'],
				message: 'Source end must follow start',
			});
		if (r.media.frames.some(f => f.at >= r.source.end - r.source.start))
			ctx.addIssue({
				code: 'custom',
				path: ['media', 'frames'],
				message: 'Frame must fall within the clip',
			});
		if (new Set(r.inputs.map(i => i.id)).size !== r.inputs.length)
			ctx.addIssue({code: 'custom', path: ['inputs'], message: 'Step IDs must be unique'});
	});
export type Reference = z.infer<typeof referenceSchema>;
export type ReferenceKind = Reference['kind'];
export type PracticeStatus = 'untried' | 'practising' | 'reliable';
export type PersonalEntry = {
	saved: boolean;
	status: PracticeStatus;
	note: string;
	revision: number;
};
export type PersonalLibrary = Record<string, PersonalEntry>;

export function parseCatalog(value: unknown): Reference[] {
	const catalog = z.array(referenceSchema).parse(value);
	const ids = new Set(catalog.map(r => r.id));
	if (ids.size !== catalog.length) throw new Error('Reference IDs must be unique');
	for (const r of catalog)
		if (r.relatedIds.some(id => !ids.has(id) || id === r.id))
			throw new Error(`Invalid related reference for ${r.id}`);
	return catalog;
}

function searchable(value: string): string {
	return value
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}
export function filterReferences(
	catalog: readonly Reference[],
	options: {query?: string; kind?: string; situation?: string; savedIds?: ReadonlySet<string>} = {},
): Reference[] {
	const tokens = searchable(options.query ?? '')
		.split(/\s+/)
		.filter(Boolean);
	return catalog.filter(r => {
		if (options.kind && options.kind !== 'all' && r.kind !== options.kind) return false;
		if (
			options.situation &&
			options.situation !== 'all' &&
			!r.situations.includes(options.situation)
		)
			return false;
		if (options.savedIds && !options.savedIds.has(r.id)) return false;
		const text = searchable(
			[
				r.title,
				r.summary,
				r.notation,
				r.kind,
				...r.situations,
				...r.outcomes,
				...r.conditions,
				...r.inputs.map(i => i.label),
			].join(' '),
		);
		return tokens.every(t => text.includes(t));
	});
}
export function sourceLink(r: Reference): string {
	const url = new URL(r.source.url);
	url.searchParams.set('t', String(Math.floor(r.source.start)));
	return url.href;
}
