import {packVersionSchema, type Reference} from '@hyper-chamber/reference';

/** Description cues belong to one recording; editing its labels must not discard them. */
export function mediaForClip(
	previous: Reference['media'] | undefined,
	next: Pick<Reference['media'], 'clip' | 'hasAudio' | 'poster' | 'frames'>,
): Reference['media'] {
	return {
		clip: next.clip,
		hasAudio: next.hasAudio,
		poster: next.poster,
		frames: next.frames,
		...(previous?.clip === next.clip && previous?.descriptionTrack
			? {descriptionTrack: previous.descriptionTrack}
			: {}),
	};
}

/** A content edit advances the patch edition, including pre-release and build editions. */
export function nextPackEdition(value: string): string {
	packVersionSchema.parse(value);
	const [major, minor, patch] = value.split(/[.+-]/);
	return `${major}.${minor}.${BigInt(patch) + 1n}`;
}

interface CreatorSourceFields {
	sourceKind: 'recording' | 'youtube';
	sourceTitle: string;
	sourceCreator: string;
	sourceUrl: string;
}
interface SourceContext {
	id: string;
	title: string;
	creator: string;
	published: string;
	start: number;
	end: number;
}
/** Character changes retain the actor identities used by ordered inputs. */
export function participantsForCharacter(
	previous: Reference['participants'] | undefined,
	characterId: string,
): Reference['participants'] {
	return previous?.length
		? previous.map((actor, index) => (index === 0 ? {...actor, characterId} : actor))
		: [{id: 'main', characterId}];
}
export function sourceFieldsForKind(
	previous: CreatorSourceFields,
	sourceKind: CreatorSourceFields['sourceKind'],
	packAuthor: string,
): CreatorSourceFields {
	if (sourceKind === previous.sourceKind) return {...previous};
	return {
		sourceKind,
		sourceTitle: '',
		sourceCreator: sourceKind === 'recording' ? packAuthor : '',
		sourceUrl: '',
	};
}
/** External attribution is supplied explicitly; only own recordings use personal defaults. */
export function sourceForReference(
	fields: CreatorSourceFields,
	context: SourceContext,
): Reference['source'] {
	const title = fields.sourceTitle.trim(),
		creator = fields.sourceCreator.trim(),
		url = fields.sourceUrl.trim();
	const common = {
		id: context.id,
		published: context.published,
		start: context.start,
		end: context.end,
	};
	if (fields.sourceKind === 'youtube') {
		if (!title) throw new Error('Enter the original YouTube video title in Source and review.');
		if (!creator) throw new Error('Enter the YouTube video creator in Source and review.');
		if (!url) throw new Error('Enter the original YouTube URL in Source and review.');
		return {...common, kind: 'youtube', title, creator, url};
	}
	return {
		...common,
		kind: 'recording',
		title: title || context.title.trim(),
		creator: creator || context.creator.trim(),
		...(url ? {url} : {}),
	};
}

/** Legacy YouTube sources and explicit YouTube sources share the same identity rules. */
export function sameSourceIdentity(
	previous: Pick<Reference, 'source' | 'media'> | undefined,
	fields: CreatorSourceFields,
	clip: string,
): boolean {
	if (!previous) return false;
	const kind = previous.source.kind === 'recording' ? 'recording' : 'youtube';
	return (
		kind === fields.sourceKind &&
		(previous.source.url ?? '').trim() === fields.sourceUrl.trim() &&
		previous.media.clip === clip
	);
}
/** A source date is retained only while the recording and external source identity match. */
export function publicationForSource(
	previous: Pick<Reference, 'source' | 'media'> | undefined,
	fields: CreatorSourceFields,
	clip: string,
): string {
	return previous && sameSourceIdentity(previous, fields, clip) ? previous.source.published : '';
}
