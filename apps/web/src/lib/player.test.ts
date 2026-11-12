import {afterEach, describe, expect, it, vi} from 'vitest';
import {
	clampTime,
	dragAxis,
	relativeSeek,
	readLoopPreference,
	saveLoopPreference,
	LOOP_STORAGE_KEY,
	AUTOPLAY_STORAGE_KEY,
	SPEED_STORAGE_KEY,
	SHORTCUTS_STORAGE_KEY,
	MUTED_STORAGE_KEY,
	shouldStartPlayback,
	readPlaybackPreferences,
	savePlaybackPreferences,
} from './player';

afterEach(() => vi.unstubAllGlobals());

describe('relative clip inspection', () => {
	it('leaves a grab at the current moment and seeks relative to it in either direction', () => {
		expect(relativeSeek(4, 0, 600, 12)).toBe(4);
		expect(relativeSeek(4, 100, 600, 12)).toBe(6);
		expect(relativeSeek(4, -100, 600, 12)).toBe(2);
	});

	it('clamps either end while preserving exact key moment times', () => {
		expect(relativeSeek(4, -900, 600, 12)).toBe(0);
		expect(relativeSeek(4, 900, 600, 12)).toBeCloseTo(11.999);
		expect(clampTime(3.1415, 12)).toBe(3.1415);
	});

	it('ignores jitter and gives vertical scrolling priority on a diagonal tie', () => {
		expect(dragAxis(5, -5)).toBe('pending');
		expect(dragAxis(6, 2)).toBe('horizontal');
		expect(dragAxis(-10, 6)).toBe('horizontal');
		expect(dragAxis(6, -6)).toBe('vertical');
		expect(dragAxis(3, 8)).toBe('vertical');
	});

	it('does not produce invalid seek targets before metadata or when a surface has no width', () => {
		expect(relativeSeek(4, 100, 0, 12)).toBe(4);
		expect(relativeSeek(4, Number.NaN, 600, 12)).toBe(4);
		for (const duration of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(relativeSeek(4, 100, 600, duration)).toBe(0);
		}
		expect(clampTime(Number.NaN, 12)).toBe(0);
	});
});

describe('remembered clip looping', () => {
	it.each([null, 'true', 'broken', '{invalid', '0'])(
		'uses the short-clip default for an absent or invalid value %j',
		value => {
			vi.stubGlobal('window', {localStorage: {getItem: () => value}});
			expect(readLoopPreference()).toBe(true);
		},
	);

	it('remembers an explicit off choice under a separate player key', () => {
		let stored: string | null = null;
		const getItem = vi.fn(() => stored);
		const setItem = vi.fn((_key: string, value: string) => {
			stored = value;
		});
		vi.stubGlobal('window', {localStorage: {getItem, setItem}});
		saveLoopPreference(false);
		expect(setItem).toHaveBeenCalledWith(LOOP_STORAGE_KEY, 'false');
		expect(readLoopPreference()).toBe(false);
		expect(getItem).toHaveBeenCalledWith(LOOP_STORAGE_KEY);
		saveLoopPreference(true);
		expect(readLoopPreference()).toBe(true);
	});

	it('keeps playback usable when a storage getter, read, or write throws', () => {
		for (const browser of [
			Object.defineProperty({}, 'localStorage', {
				get() {
					throw new Error('SecurityError');
				},
			}),
			{
				localStorage: {
					getItem() {
						throw new Error('SecurityError');
					},
					setItem() {
						throw new Error('QuotaExceededError');
					},
				},
			},
			undefined,
		]) {
			vi.stubGlobal('window', browser);
			expect(readLoopPreference()).toBe(true);
			expect(() => saveLoopPreference(false)).not.toThrow();
		}
	});
});

describe('reference playback preferences', () => {
	it.each([
		['follow', false, false],
		['follow', true, true],
		['always', false, true],
		['always', true, true],
		['paused', false, false],
		['paused', true, false],
	] as const)('%s with previous playing=%s starts=%s', (mode, previous, expected) => {
		expect(shouldStartPlayback(mode, previous)).toBe(expected);
	});
	it('defaults to following a paused first open, normal speed and the existing loop preference', () => {
		vi.stubGlobal('window', {
			localStorage: {getItem: (key: string) => (key === LOOP_STORAGE_KEY ? 'false' : null)},
		});
		expect(readPlaybackPreferences()).toEqual({
			autoplay: 'follow',
			shortcuts: true,
			loop: false,
			muted: true,
			speed: 1,
		});
		expect(shouldStartPlayback(readPlaybackPreferences().autoplay, false)).toBe(false);
	});
	it.each(['always', 'paused', 'follow'] as const)(
		'remembers %s without changing the learner library',
		autoplay => {
			const values = new Map<string, string>();
			const storage = {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			};
			vi.stubGlobal('window', {localStorage: storage});
			savePlaybackPreferences({autoplay, shortcuts: true, loop: false, muted: true, speed: 0.75});
			expect(readPlaybackPreferences()).toEqual({
				autoplay,
				shortcuts: true,
				loop: false,
				muted: true,
				speed: 0.75,
			});
			expect([...values.keys()].sort()).toEqual(
				[
					AUTOPLAY_STORAGE_KEY,
					LOOP_STORAGE_KEY,
					SPEED_STORAGE_KEY,
					SHORTCUTS_STORAGE_KEY,
					MUTED_STORAGE_KEY,
				].sort(),
			);
		},
	);
	it.each(['', 'broken', '{invalid', 'true', 'null'])(
		'rejects unknown mode %j and unsupported rates',
		value => {
			vi.stubGlobal('window', {localStorage: {getItem: () => value}});
			expect(readPlaybackPreferences()).toMatchObject({autoplay: 'follow', speed: 1});
		},
	);
	it.each([0.5, 0.75, 1])('accepts supported playback rate %s', speed => {
		vi.stubGlobal('window', {
			localStorage: {getItem: (key: string) => (key === SPEED_STORAGE_KEY ? String(speed) : null)},
		});
		expect(readPlaybackPreferences().speed).toBe(speed);
	});
	it.each(['0', '-1', '1.5', 'Infinity', 'NaN'])('rejects unsupported rate %s', speed => {
		vi.stubGlobal('window', {
			localStorage: {getItem: (key: string) => (key === SPEED_STORAGE_KEY ? speed : null)},
		});
		expect(readPlaybackPreferences().speed).toBe(1);
	});
	it('handles unavailable storage without preventing playback or preference changes', () => {
		const browsers = [
			undefined,
			Object.defineProperty({}, 'localStorage', {
				get() {
					throw new Error('blocked');
				},
			}),
			{
				localStorage: {
					getItem() {
						throw new Error('blocked');
					},
					setItem() {
						throw new Error('full');
					},
				},
			},
		];
		for (const browser of browsers) {
			vi.stubGlobal('window', browser);
			expect(readPlaybackPreferences()).toEqual({
				autoplay: 'follow',
				shortcuts: true,
				loop: true,
				muted: true,
				speed: 1,
			});
			expect(() =>
				savePlaybackPreferences({
					autoplay: 'always',
					shortcuts: true,
					loop: false,
					muted: false,
					speed: 0.5,
				}),
			).not.toThrow();
		}
	});
});

describe('single-key shortcut opt-out', () => {
	it('remembers an explicit off choice independently of playback policy and can turn it back on', () => {
		const values = new Map<string, string>();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			},
		});
		savePlaybackPreferences({
			autoplay: 'follow',
			loop: true,
			muted: true,
			speed: 1,
			shortcuts: false,
		});
		expect(readPlaybackPreferences()).toEqual({
			autoplay: 'follow',
			loop: true,
			muted: true,
			speed: 1,
			shortcuts: false,
		});
		savePlaybackPreferences({
			autoplay: 'follow',
			loop: true,
			muted: true,
			speed: 1,
			shortcuts: true,
		});
		expect(readPlaybackPreferences().shortcuts).toBe(true);
	});
});

describe('remembered source audio', () => {
	it.each([null, '', 'true', 'broken', '{invalid', '0', 'null'])(
		'keeps the first-open mute default for absent or invalid value %j',
		value => {
			vi.stubGlobal('window', {
				localStorage: {getItem: (key: string) => (key === MUTED_STORAGE_KEY ? value : null)},
			});
			expect(readPlaybackPreferences().muted).toBe(true);
		},
	);
	it('remembers an explicit unmute independently of learner data and other player choices', () => {
		const values = new Map<string, string>([
			[AUTOPLAY_STORAGE_KEY, 'paused'],
			[LOOP_STORAGE_KEY, 'false'],
			[SPEED_STORAGE_KEY, '0.75'],
			[SHORTCUTS_STORAGE_KEY, 'false'],
		]);
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => values.get(key) ?? null,
				setItem: (key: string, value: string) => values.set(key, value),
			},
		});
		const original = readPlaybackPreferences();
		expect(original.muted).toBe(true);
		savePlaybackPreferences({...original, muted: false});
		expect(values.get(MUTED_STORAGE_KEY)).toBe('false');
		expect(readPlaybackPreferences()).toEqual({...original, muted: false});
		savePlaybackPreferences({...original, muted: true});
		expect(readPlaybackPreferences()).toEqual(original);
		expect([...values.keys()].every(key => key.startsWith('hyper-chamber:player-'))).toBe(true);
	});
	it('does not overwrite the current sound choice when persistence is blocked', () => {
		vi.stubGlobal('window', {
			localStorage: {
				getItem() {
					throw new Error('blocked');
				},
				setItem() {
					throw new Error('full');
				},
			},
		});
		const current = {...readPlaybackPreferences(), muted: false};
		expect(() => savePlaybackPreferences(current)).not.toThrow();
		expect(current.muted).toBe(false);
		expect(readPlaybackPreferences().muted).toBe(true);
	});
});
