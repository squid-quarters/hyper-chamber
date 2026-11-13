# Hyper Chamber project site

A small static introduction and download-link page for the desktop beta. This is source for a future GitHub Pages project site; building it does not publish it.

The page extends the existing Chamber identity from the root DESIGN.md. Its purpose is to show the actual reference interface, explain what it does and make the beta's development state clear. It links to the repository's Releases page without claiming an installer is already available. Windows and macOS are described as planned desktop targets, and phone/tablet hosting is explicitly tied to the running desktop app.

Build from the workspace with `pnpm --filter @hyper-chamber/site build`. The output is `apps/site/build`; all asset links are relative so the same output works beneath `/hyper-chamber/`. `pnpm --filter @hyper-chamber/site check` checks that output's assets, path rules and development state. There is no runtime JavaScript or external font request.

The build copies the existing README screenshots from `docs/screenshots/` without retouching them. Their capture routes, app version and original-video sources are recorded in [the screenshot README](../../docs/screenshots/README.md), which also accompanies the generated assets as `assets/screenshot-sources.md`. The page captions identify them as the browser interface rather than a released desktop application. It copies the app's existing Fontsource Barlow Condensed and DM Sans files, together with their licenses. The Hourglass H mark is the same geometry as `apps/web/src/lib/components/BrandMark.svelte`.

No Pages workflow, deployment setting, release upload, analytics or accounts are introduced here. Publishing requires a separate explicit step.
