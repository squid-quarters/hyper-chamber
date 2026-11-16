import {describe, expect, it} from 'vitest';
import {mediaForClip, nextPackEdition} from './creator';

describe('editing recorded references', () => {
	const existing = {
		clip: '/media/old/clip.mp4',
		hasAudio: true,
		descriptionTrack: '/media/old/descriptions.vtt',
		poster: '/media/old/poster.jpg',
		frames: [],
	};
	it('retains accessible descriptions when editing the same recording', () => {
		const result = mediaForClip(existing, {
			clip: existing.clip,
			hasAudio: existing.hasAudio,
			poster: existing.poster,
			frames: existing.frames,
		});
		expect(result.descriptionTrack).toBe(existing.descriptionTrack);
	});
	it('clears descriptions from a replaced recording and uses its explicit audio choice', () => {
		const result = mediaForClip(existing, {
			clip: '/media/new/clip.mp4',
			hasAudio: false,
			poster: '/media/new/poster.jpg',
			frames: [],
		});
		expect(result.descriptionTrack).toBeUndefined();
		expect(result.hasAudio).toBe(false);
	});
});

it('advances exported editions without numeric rounding or reusing pre-release editions', () => {
	for (const version of ['1.0.0', '1.0.0-beta.1', '1.0.0+build.1'])
		expect(nextPackEdition(version)).toBe('1.0.1');
	expect(nextPackEdition('1.0.9007199254740993')).toBe('1.0.9007199254740994');
	expect(() => nextPackEdition('invalid')).toThrow();
});
