import type {LibraryReturn} from './lib/navigation';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			libraryReturn?: LibraryReturn;
		}
		// interface Platform {}
	}
}

export {};
