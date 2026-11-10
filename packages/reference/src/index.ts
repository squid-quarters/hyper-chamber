import {z} from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slug = z.string().regex(slugPattern);
const guideSchema = z.object({
	label: z.string().min(1),
	url: z.url({protocol: /^https$/}),
});
const notationLegendSchema = z.array(
	z.object({term: z.string().min(1), meaning: z.string().min(1)}),
);
export const gameDefinitionSchema = z
	.object({
		id: slug,
		name: z.string().min(1),
		resourceLabels: z.preprocess(
			(value, context) => {
				// Inspect original keys before the record parser can skip __proto__.
				if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
					for (const key of Object.keys(value)) {
						if (!slugPattern.test(key)) {
							context.addIssue({
								code: 'custom',
								path: [key],
								message: 'Resource IDs must be lowercase slugs',
							});
						}
					}
				}
				return value;
			},
			z.record(slug, z.string().min(1)),
		),
		notation: z.object({
			description: z.string().min(1),
			numpad: z.boolean(),
			legend: notationLegendSchema,
		}),
		guides: z.array(guideSchema),
		characters: z.array(
			z.object({
				id: slug,
				name: z.string().min(1),
				guides: z.array(guideSchema).optional(),
				notationLegend: notationLegendSchema.optional(),
			}),
		),
	})
	.superRefine((game, context) => {
		if (new Set(game.characters.map(character => character.id)).size !== game.characters.length) {
			context.addIssue({
				code: 'custom',
				path: ['characters'],
				message: 'Character IDs must be unique within each game',
			});
		}
	});
export type GameDefinition = z.infer<typeof gameDefinitionSchema>;

const localMedia = z
	.string()
	.regex(/^\/media\/[a-zA-Z0-9/_\-.]+$/)
	.refine(
		path => !path.split('/').some(segment => segment === '.' || segment === '..'),
		'Media paths cannot traverse directories',
	);
export const referenceSchema = z
	.object({
		id: slug,
		gameId: slug,
		participants: z.array(z.object({id: slug, characterId: slug})).min(1),
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
					actorId: slug.optional(),
				}),
			)
			.min(1),
		conditions: z.array(z.string()),
		notes: z.array(z.string()),
		resources: z.preprocess(
			(value, context) => {
				if (value !== null && typeof value === 'object' && Object.hasOwn(value, '__proto__')) {
					context.addIssue({
						code: 'custom',
						path: ['__proto__'],
						message: 'Resource keys cannot use __proto__',
					});
				}
				return value;
			},
			z.record(z.string(), z.string()),
		),
		source: z.object({
			id: z.string(),
			title: z.string(),
			creator: z.string(),
			url: z.url({protocol: /^https$/, hostname: /^www\.youtube\.com$/}),
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
			descriptionTrack: localMedia.optional(),
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
		if (new Set(r.media.frames.map(frame => frame.id)).size !== r.media.frames.length)
			ctx.addIssue({
				code: 'custom',
				path: ['media', 'frames'],
				message: 'Frame IDs must be unique',
			});
		if (
			r.media.frames.some((frame, index) => index > 0 && frame.at <= r.media.frames[index - 1].at)
		)
			ctx.addIssue({
				code: 'custom',
				path: ['media', 'frames'],
				message: 'Frame times must increase',
			});
		const participantIds = new Set(r.participants.map(participant => participant.id));
		if (participantIds.size !== r.participants.length) {
			ctx.addIssue({
				code: 'custom',
				path: ['participants'],
				message: 'Participant IDs must be unique',
			});
		}
		for (const [index, input] of r.inputs.entries()) {
			if (input.actorId === undefined && r.participants.length > 1) {
				ctx.addIssue({
					code: 'custom',
					path: ['inputs', index, 'actorId'],
					message: 'Each step must identify its actor when the reference has multiple participants',
				});
			} else if (input.actorId !== undefined && !participantIds.has(input.actorId)) {
				ctx.addIssue({
					code: 'custom',
					path: ['inputs', index, 'actorId'],
					message: 'Step actor must belong to the reference participants',
				});
			}
		}
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

export function parseCatalog(value: unknown, games?: readonly GameDefinition[]): Reference[] {
	const catalog = z.array(referenceSchema).parse(value);
	const referencesById = new Map(catalog.map(reference => [reference.id, reference]));
	if (referencesById.size !== catalog.length) throw new Error('Reference IDs must be unique');
	let gamesById: Map<string, GameDefinition> | undefined;
	if (games !== undefined) {
		const definitions = z.array(gameDefinitionSchema).parse(games);
		gamesById = new Map(definitions.map(game => [game.id, game]));
		if (gamesById.size !== definitions.length) throw new Error('Game IDs must be unique');
	}
	for (const reference of catalog) {
		if (gamesById) {
			const game = gamesById.get(reference.gameId);
			if (!game) throw new Error(`Unknown game ${reference.gameId} for reference ${reference.id}`);
			const characterIds = new Set(game.characters.map(character => character.id));
			for (const participant of reference.participants) {
				if (!characterIds.has(participant.characterId)) {
					throw new Error(
						`Unknown character ${participant.characterId} in game ${game.id} for reference ${reference.id}`,
					);
				}
			}
			for (const resourceId of Object.keys(reference.resources)) {
				if (!Object.hasOwn(game.resourceLabels, resourceId)) {
					throw new Error(
						`Unknown resource ${resourceId} in game ${game.id} for reference ${reference.id}`,
					);
				}
			}
		}
		for (const id of reference.relatedIds) {
			const related = referencesById.get(id);
			if (!related || id === reference.id)
				throw new Error(`Invalid related reference for ${reference.id}`);
			if (related.gameId !== reference.gameId) {
				throw new Error(`Related references must use the same game: ${reference.id} and ${id}`);
			}
		}
	}
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
	options: {
		query?: string;
		kind?: string;
		situation?: string;
		savedIds?: ReadonlySet<string>;
		gameId?: string;
	} = {},
): Reference[] {
	const tokens = searchable(options.query ?? '')
		.split(/\s+/)
		.filter(Boolean);
	return catalog.filter(r => {
		if (options.gameId && r.gameId !== options.gameId) return false;
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
