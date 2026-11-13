import {z} from 'zod';

export const referenceIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const personalEntrySchema = z.strictObject({
	saved: z.boolean(),
	status: z.enum(['untried', 'practising', 'reliable']),
	note: z.string().max(4000, 'Notes must contain at most 4,000 characters'),
	/** The reference revision assessed by the learner, not the database concurrency version. */
	revision: z.number().int().positive().safe(),
});
export const storedPersonalEntrySchema = personalEntrySchema.extend({
	rowVersion: z.number().int().nonnegative().safe(),
	updatedAt: z.iso.datetime(),
});
export type StoredPersonalEntry = z.infer<typeof storedPersonalEntrySchema>;
export const personalPatchSchema = personalEntrySchema
	.partial()
	.refine(
		patch => Object.keys(patch).length > 0,
		'A practice edit must contain at least one field',
	);
export const practicePatchRequestSchema = z.strictObject({
	patch: personalPatchSchema,
	expectedVersion: z.number().int().nonnegative().safe(),
});
export type PracticePatchRequest = z.infer<typeof practicePatchRequestSchema>;
export const legacyLibrarySchema = z.strictObject({
	version: z.literal(1),
	entries: z.preprocess(
		(value, context) => {
			if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
				for (const key of Object.keys(value)) {
					if (!referenceIdSchema.safeParse(key).success) {
						context.addIssue({code: 'custom', path: [key], message: 'Invalid reference ID'});
					}
				}
			}
			return value;
		},
		z.record(referenceIdSchema, personalEntrySchema),
	),
});
export const practiceSnapshotSchema = z.strictObject({
	libraryId: z.uuid(),
	entries: z.record(referenceIdSchema, storedPersonalEntrySchema),
});
export type PracticeSnapshot = z.infer<typeof practiceSnapshotSchema>;
export interface PracticeImportResult {
	imported: number;
	unchanged: number;
	conflicts: string[];
}
export interface LibraryRuntime {
	appVersion: string;
	libraryId: string;
	sharing: {enabled: boolean; addresses: string[]};
	content: {references: number; packs: number};
}
