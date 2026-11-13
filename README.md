# Hyper Chamber

Hyper Chamber is a fighting-game reference from Squid Quarters, built to keep open beside training mode. Each reference brings together an input sequence, a short replay and execution notes, so you can revisit a combo or setup without finding the same moment in a long tutorial.

Visit the [Hyper Chamber website](https://squid-quarters.github.io/hyper-chamber/) for screenshots and desktop beta status.

It started with Dhalsim and now has over 2,000 references across 32 Street Fighter 6 character libraries. The focus is on the things you want to look up while practising; longer guides and lessons stay with the source creators and [SF6 Lab](https://sf6-lab.net/en/).

![Ryu practice view, with the input sequence above a paused combo replay and playback controls.](docs/screenshots/practice.webp)

Loop a demonstration, slow it down or drag anywhere on the video to inspect a transition. Source audio is available when you want it; clips start muted and remember your sound preference. Inputs stay above the replay, with selected key moments, execution notes and source details further down. Previous and Next follow your filtered results, and Quick switch lets you find another reference without returning to the library.

![Dhalsim's library, showing search, training-goal filters and reference cards with gameplay previews.](docs/screenshots/library.webp)

You can browse by character and narrow the list to punishes, corner carry, oki, anti-air or cash-out routes. Save the references you want to return to, then keep your own notes and practice status alongside them. The practice view also adapts to phones and tablets.

<details>
<summary>See the phone view</summary>

<p><img src="docs/screenshots/phone.webp" width="320" alt="Ryu practice view on a phone, with large Previous and Next buttons, wrapped inputs and the replay controls below." /></p>

</details>

## Desktop beta

The desktop app bundles its runtime and a small starter library: three complete Dhalsim demonstrations. Additional character packs contain their own references and media. It uses a local SQLite library, with optional access from phones and tablets on the same network. No account is needed.

Version `1.0.0-beta.1` is unreleased. There are no published installers yet; the current desktop builds are local. The macOS build has been validated; Windows support has not been tested yet. An installed build runs without Node, pnpm or a development setup. See the [desktop architecture and build notes](docs/desktop-architecture.md).

## Install the beta

The first public release is being prepared as `1.0.0-beta.1`. It is a beta, not stable version 1.0. The download links below are release candidates and become available when the release is published.

| Computer                            | Installer                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Mac with Apple silicon, macOS 13.5+ | [Apple silicon DMG](https://github.com/squid-quarters/hyper-chamber/releases/download/v1.0.0-beta.1/Hyper-Chamber_1.0.0-beta.1_aarch64.dmg)   |
| Intel Mac, macOS 13.5+              | [Intel DMG](https://github.com/squid-quarters/hyper-chamber/releases/download/v1.0.0-beta.1/Hyper-Chamber_1.0.0-beta.1_x64.dmg)               |
| Windows 10+, 64-bit                 | [Windows installer](https://github.com/squid-quarters/hyper-chamber/releases/download/v1.0.0-beta.1/Hyper-Chamber_1.0.0-beta.1_x64-setup.exe) |

On macOS, open the DMG and move Hyper Chamber to Applications. On Windows, run the installer; it includes the WebView2 runtime. The app includes its runtime and three complete Dhalsim demonstrations. You do not need developer tools to use an installed copy.

The Mac beta is ad-hoc signed and is not notarized by Apple. Windows installers are unsigned. macOS may block the first launch; review [Apple’s instructions for opening an unnotarized app](https://support.apple.com/en-us/102445). Homebrew installs the same Mac app and does not remove this first-launch check.

The official Homebrew recipe is being prepared in [Squid Quarters’ tap](https://github.com/squid-quarters/homebrew-tap). Once the release and recipe are published:

```sh
brew install --cask squid-quarters/tap/hyper-chamber@beta
```

Additional references and media arrive as content packs, separate from your notes and progress. The [release notes](https://github.com/squid-quarters/hyper-chamber/releases/tag/v1.0.0-beta.1) identify the published files and checksums.

For a phone or tablet, enable device access in the desktop app and open its address in a browser on the same local network. Keep Hyper Chamber running on the computer while you practise.

## Run from source

Use Node 24 and pnpm 10.16.1. The repository includes the full reference catalog and prepared media, so allow several gigabytes for the checkout and build.

```sh
git clone https://github.com/squid-quarters/hyper-chamber.git
cd hyper-chamber
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. This starts the web development server and a local SQLite server; saves go into `.local/dev-library`. Stop both with Ctrl+C. For the built web app, run `pnpm build`, then `pnpm start` and open http://127.0.0.1:5376; its default library is `.local/library`.

Set `HYPER_CHAMBER_LIBRARY_DIR` to use a particular library folder, `HYPER_CHAMBER_PORT` to change the backend port, or `HYPER_CHAMBER_WEB_PORT` to change the development web port. The [usage notes](docs/usage.md) cover playback, keyboard shortcuts, browser-data transfer and backups.

## About the references

Each reference credits its creator and links to the original video and timestamp. “Source reviewed” means the annotations were checked against that recording, not re-tested in the game on the current patch. The [coverage index](docs/roster-source-coverage.md) records the selections and gaps for each character.

No open-source license has been chosen yet. Third-party media permissions and redistribution rights remain unassessed; attribution and source records must accompany the media. The [publication record](content/publication.json) describes the repository's current public scope. [Screenshot sources](docs/screenshots/README.md) are recorded separately.

## Development

The workspace contains the SvelteKit interface in `apps/web`, the SQLite/HTTP server in `apps/server`, the Tauri host in `apps/desktop`, and a static project site in `apps/site`. Shared catalog code lives in `packages/reference`; curated content and media tools stay in `content/games` and `tools`. Learner data stays outside the authored references.

```sh
pnpm verify
```

This checks formatting, lint, types, tests, web/server/site builds and catalog/media validation. Native checks run separately with `pnpm desktop:check`; the [desktop notes](docs/desktop-architecture.md) explain the Rust and platform prerequisites. Changes go through pull requests into `develop`. Pull-request CI validates both paths. The [Pages workflow](.github/workflows/pages.yml) builds and publishes the project site from `apps/site` when its files change on `develop`, or when run manually on that branch. Desktop installer releases remain separate.

Keep the app version and [CHANGELOG.md](CHANGELOG.md) aligned for user-facing changes. The root, web, server and desktop manifests identify this beta; this project does not use Changesets.

The [product scope](docs/product.md), [content model](docs/content-model.md) and [design notes](docs/design.md) cover the longer-term decisions.
