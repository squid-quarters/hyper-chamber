export type DragAxis = 'pending' | 'horizontal' | 'vertical';

export const LOOP_STORAGE_KEY = 'hyper-chamber:player-loop:v1';

// Ignore hand jitter, then commit to one axis for the rest of the gesture.
export function dragAxis(dx: number, dy: number): DragAxis {
	if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return 'pending';
	return Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
}

export function clampTime(at: number, duration: number): number {
	if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(at)) return 0;
	return Math.max(0, Math.min(at, Math.max(0, duration - 0.001)));
}

// The grab point changes nothing: one surface width traverses one clip length.
export function relativeSeek(at: number, dx: number, width: number, duration: number): number {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(dx)) return clampTime(at, duration);
	return clampTime(at + (dx / width) * duration, duration);
}

export function readLoopPreference(): boolean {
	try {
		return window.localStorage.getItem(LOOP_STORAGE_KEY) !== 'false';
	} catch {
		return true;
	}
}

export function saveLoopPreference(loop: boolean): void {
	try {
		window.localStorage.setItem(LOOP_STORAGE_KEY, String(loop));
	} catch {
		// Playback keeps the choice in memory when storage is blocked or full.
	}
}

export type AutoplayMode = 'follow' | 'always' | 'paused';
export type PlaybackSpeed = 0.5 | 0.75 | 1;
export interface PlaybackPreferences {
	autoplay: AutoplayMode;
	shortcuts: boolean;
	loop: boolean;
	speed: PlaybackSpeed;
}
export const AUTOPLAY_STORAGE_KEY = 'hyper-chamber:player-autoplay:v1';
export const SPEED_STORAGE_KEY = 'hyper-chamber:player-speed:v1';
export const SHORTCUTS_STORAGE_KEY = 'hyper-chamber:player-shortcuts:v1';

export function isAutoplayMode(value: unknown): value is AutoplayMode {
	return value === 'follow' || value === 'always' || value === 'paused';
}
export function isPlaybackSpeed(value: number): value is PlaybackSpeed {
	return value === 0.5 || value === 0.75 || value === 1;
}
export function shouldStartPlayback(mode: AutoplayMode, wasPlaying: boolean): boolean {
	return mode === 'always' || (mode === 'follow' && wasPlaying);
}
function readSetting(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}
export function readPlaybackPreferences(): PlaybackPreferences {
	const autoplay = readSetting(AUTOPLAY_STORAGE_KEY);
	const speed = Number(readSetting(SPEED_STORAGE_KEY));
	return {
		autoplay: isAutoplayMode(autoplay) ? autoplay : 'follow',
		shortcuts: readSetting(SHORTCUTS_STORAGE_KEY) !== 'false',
		loop: readLoopPreference(),
		speed: isPlaybackSpeed(speed) ? speed : 1,
	};
}
export function savePlaybackPreferences(preferences: PlaybackPreferences): void {
	saveLoopPreference(preferences.loop);
	for (const [key, value] of [
		[AUTOPLAY_STORAGE_KEY, preferences.autoplay],
		[SPEED_STORAGE_KEY, String(preferences.speed)],
		[SHORTCUTS_STORAGE_KEY, String(preferences.shortcuts)],
	]) {
		try {
			window.localStorage.setItem(key, value);
		} catch {
			// The page owns the current preferences, so blocked storage only affects future visits.
		}
	}
}
