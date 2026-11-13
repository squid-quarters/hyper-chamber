import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Opaque local UI key; works on HTTP connections to a LAN host too. */
export function createLocalId() {
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
		byte.toString(16).padStart(2, '0'),
	).join('');
}
