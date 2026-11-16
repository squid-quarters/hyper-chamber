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
