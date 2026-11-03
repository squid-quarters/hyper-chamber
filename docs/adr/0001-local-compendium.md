# 0001: Separate local compendium and file-based references

Status: accepted for the initial version.

Use a separate Squid Quarters repository with a small pnpm/Turborepo workspace. One SvelteKit application generates static files. Shared schemas and search support both the reader and source preparation tooling. Content remains JSON with prepared media under the application's static assets.

Personal state is a separately validated, versioned browser-storage document. Imports merge explicit user choices and never become shared reference content. Stable IDs support changes to copy and media; material execution revisions should prompt reassessment rather than silently claiming mastery.

Source timestamps are seconds in the original video. Frame offsets are seconds from the beginning of the prepared reference clip. Re-encode exact intervals rather than assuming stream-copy/keyframe seeking preserves requested boundaries. Do not equate video frame rate with game-engine frame validation.

Bundled fonts and reference assets avoid runtime font/CDN dependencies. Source/guide links still require internet. No public hosting or merge-triggered deployment is configured. Future shared packages, accounts, or cloud media hosting must follow a concrete usage need.

Oxfmt formats its supported source/config/document types. A Svelte-only Prettier plugin fallback formats templates because the selected oxfmt release does not support `.svelte`; the formatters do not overlap.
