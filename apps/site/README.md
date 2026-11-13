# Hyper Chamber project site

A small static introduction and download-link page for the desktop beta. The public project site is served by GitHub Pages at [squid-quarters.github.io/hyper-chamber](https://squid-quarters.github.io/hyper-chamber/). Building it locally does not publish it.

The page extends the existing Chamber identity from the root DESIGN.md. Its purpose is to show the actual reference interface, explain what it does and make the beta's development state clear. It links to the repository's Releases page without claiming an installer is already available. The page distinguishes the validated macOS build from untested Windows support, and ties phone/tablet access to the running desktop app.

Build from the workspace with `pnpm --filter @hyper-chamber/site build`. The output is `apps/site/build`; all asset links are relative so the same output works beneath `/hyper-chamber/`. `pnpm --filter @hyper-chamber/site check` checks that output's assets, path rules and development state. There is no runtime JavaScript or external font request.

The build copies the existing README screenshots from `docs/screenshots/` without retouching them. Their capture routes, app version and original-video sources are recorded in [the screenshot README](../../docs/screenshots/README.md), which also accompanies the generated assets as `assets/screenshot-sources.md`. The page identifies screenshots of the full development library; the desktop starter and public installer availability are described separately. It copies the app's existing Fontsource Barlow Condensed and DM Sans files, together with their licenses. The Hourglass H mark is the same geometry as `apps/web/src/lib/components/BrandMark.svelte`.

## Publishing

[Project site](../../.github/workflows/pages.yml) builds and checks site changes in pull requests. Reviewed changes merged into `develop` publish through the `github-pages` environment; a manual run publishes only when launched from `develop`. The repository must have Pages configured to use GitHub Actions, with its deployment environment restricted to `develop`.

The workflow checks out only the site, screenshots and workspace manifests. It installs the site's dependencies with `pnpm --filter @hyper-chamber/site install --frozen-lockfile --ignore-scripts`, then checks source syntax and builds the static output. Only `apps/site/build` is uploaded. Pull requests cannot deploy, and the deployment job alone has Pages write and OIDC permissions. All actions are pinned to verified upstream commit SHAs.

Publishing this introduction does not upload an application release, reference videos, content packs, personal notes or a SQLite library. The site has no runtime JavaScript, analytics or accounts.
