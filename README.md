# Hyper Chamber

A visual Street Fighter 6 compendium for quick reference beside the game. Start with Dhalsim: each entry keeps its input notation, conditions, individual replay clip, selected frames, and quick notes together.

Guides and longer lessons link to [SF6 Lab](https://sf6-lab.net/en/fighters/dhalsim). Hyper Chamber focuses on finding and inspecting individual references.

## Run locally

Use Node 24 and pnpm 10.16.1.

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5376
```

Open http://127.0.0.1:5376. Bundled fonts and prepared clips do not require a cloud account. Source and guide links require internet access. This version has no service worker or installable offline mode.

```sh
pnpm verify
```

This runs formatting, lint, type checks, unit tests, the static build, and catalog/media validation. Svelte's compiler checks the templates. Build output is in `apps/web/build`.

## Your library

Saved references, practice status, and notes stay in this browser. Export/import a JSON backup from **Your library** to move them between browsers or keep a copy. Clearing site storage removes local data. Storage failures are shown in the interface; export a backup before closing if changes cannot be saved.

## Content and provenance

Initial demonstrations are short, silent excerpts from [elieatscrayons' Dhalsim combo/oki tutorial](https://www.youtube.com/watch?v=UW6GlWHKy7o), published 4 July 2025. Each entry records the original source interval and review status. Source review confirms what the footage demonstrates; it does not establish validity on the current game patch. See [source audit](docs/source-audit.md).

This repository starts private. No open-source license or public media redistribution policy has been chosen. Attribution and source records must accompany media; public publication requires a separate asset review.

## Workspace

- `apps/web`: SvelteKit reader and browser-local personal library.
- `packages/reference`: shared catalog types, validation, and search.
- `content/dhalsim`: curated references, separate from personal data.
- `tools/ingest`: repeatable extraction and preparation tools.
- `docs`: product, source, design, and architecture decisions.

The repository starts on `develop`. Feature changes are reviewed through pull requests. CI verifies changes and does not deploy or publish the application. A release branch and deployment target can be introduced when needed.
