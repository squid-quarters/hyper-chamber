import {afterEach, describe, expect, it, vi} from 'vitest';
import {
	clampTime,
	dragAxis,
	relativeSeek,
	readLoopPreference,
	saveLoopPreference,
	LOOP_STORAGE_KEY,
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
