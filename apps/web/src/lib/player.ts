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
