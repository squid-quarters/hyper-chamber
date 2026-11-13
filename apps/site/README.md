# Hyper Chamber project site

A small static introduction to the desktop beta and its supported platforms. The public project site is served by GitHub Pages at [squid-quarters.github.io/hyper-chamber](https://squid-quarters.github.io/hyper-chamber/). Building it locally does not publish it.

The page extends the existing Chamber identity from the root DESIGN.md. Its purpose is to show the actual reference interface, explain what it does and make the beta's development state clear. The release candidate adds direct installer links for macOS Apple silicon, Intel Mac and Windows 64-bit, with platform minimums and first-launch signing limits. The Homebrew command uses the official Squid Quarters tap. These links must not be published until the release assets and reviewed tap recipe are public. Phone/tablet access remains a browser companion to the running desktop app, with device access explicitly enabled. Screenshot narration is omitted.

Build from the workspace with `pnpm --filter @hyper-chamber/site build`. The output is `apps/site/build`; all asset links are relative so the same output works beneath `/hyper-chamber/`. `pnpm --filter @hyper-chamber/site check` checks that output's assets, path rules and development state. There is no runtime JavaScript or external font request.

The build copies the existing README screenshots from `docs/screenshots/` without retouching them. Their capture routes, app version and original-video sources are recorded in [the screenshot README](../../docs/screenshots/README.md), which also accompanies the generated assets as `assets/screenshot-sources.md`. The page identifies screenshots of the full development library; the desktop starter and public installer availability are described separately. It copies the app's existing Fontsource Barlow Condensed and DM Sans files, together with their licenses. The Hourglass H mark is the same geometry as `apps/web/src/lib/components/BrandMark.svelte`.

## Publishing

[Project site](../../.github/workflows/pages.yml) builds and checks site changes in pull requests. Reviewed changes merged into `develop` publish through the `github-pages` environment; a manual run publishes only when launched from `develop`. The repository must have Pages configured to use GitHub Actions, with its deployment environment restricted to `develop`.

The workflow checks out only the site, screenshots and workspace manifests. It installs the site's dependencies with `pnpm --filter @hyper-chamber/site install --frozen-lockfile --ignore-scripts`, then checks source syntax and builds the static output. Only `apps/site/build` is uploaded. Pull requests cannot deploy, and the deployment job alone has Pages write and OIDC permissions. All actions are pinned to verified upstream commit SHAs.

Publishing this introduction does not upload an application release, reference videos, content packs, personal notes or a SQLite library. The site has no runtime JavaScript, analytics or accounts.

## GitHub mark

Repository and release links use GitHub’s official `mark-github-16` Octicon inline, hidden from assistive technology beside each visible link label. The authored geometry comes from [primer/octicons](https://github.com/primer/octicons/blob/main/icons/mark-github-16.svg). The accompanying MIT license is kept in `assets/octicons-LICENSE.txt` and included in the static output. No icon library or remote asset request is needed.

## Editorial and platform references

The platform grouping draws on viewed [Miro](https://mobbin.com/sites/sections/726d8e20-5a6c-4527-9bf5-606d96eb26f6) and [Discord](https://mobbin.com/sites/sections/2809158e-5935-4deb-9d2d-43c1fac39424) sections from Mobbin. Their grouping informed the presentation; Hyper Chamber’s availability comes from this repository’s beta implementation and verification records. Impeccable’s clarification and polish guidance, plus OpenDesign’s bundled frontend guidance and the copy-editing workflow it references, informed the edit. The OpenDesign editor was not used.

The upstream SVG was retrieved on 2026-11-13 from the main branch. Its SHA-256 before inline accessibility and colour attributes were added was `7421820090b50ac79d7c2bf7c951a433d7098a8a9c474809207bdd45f62d9d46`.
