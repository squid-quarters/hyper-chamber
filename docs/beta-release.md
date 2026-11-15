# Publishing releases

Releases come from reviewed commits on the canonical `develop` branch. This repository does not use Changesets. The release tooling accepts stable versions such as `1.0.0` and explicit betas such as `1.0.0-beta.1`; application and native versions must agree.

Publishing is deliberate. Build and verify the exact canonical commit, create a draft, check its uploaded assets, then publish with the release status the owner authorized. A beta is not promoted to stable just by changing its GitHub label.

## Build and verify

The **Desktop installers** workflow builds Apple Silicon and Intel Mac DMGs on native macOS runners, plus a Windows x64 NSIS installer on Windows. It has read-only repository permissions and never publishes a release. Pull requests exercise the same build. After merging the reviewed change, dispatch it on `develop`:

```sh
gh workflow run beta-installers.yml --ref develop
```

The workflow filename is retained from the beta. Each job tests application code, builds the installer, then starts the packaged app with a disposable library. Tests cover runtime architecture, starter media, compiled UI assets, SQLite notes surviving restart, disabled-by-default sharing and owned-process cleanup. Mac smoke uses the app mounted from the DMG; Windows smoke uses a silent per-user installation. No test opens a developer's existing library.

The artifacts are named `installer-macos-arm64`, `installer-macos-x64` and `installer-windows-x64`. Each contains one normalized installer filename and `build-info.json`, with its SHA-256 digest, source commit and smoke results. Release assembly accepts only a successful manual installer run on `develop` whose source matches the requested canonical commit. Pull-request merge refs are not release sources.

Mac builds are ad-hoc signed with hardened runtime and are not notarized by Apple. Windows setup is unsigned. Keep these facts in installation instructions. Do not remove quarantine attributes, disable Gatekeeper or suppress Windows protection checks. Developer ID/notarization and Windows publisher signing require separate credentials and configuration.

## Assemble a draft

Dispatch **Stage release draft** on `develop` with the successful installer run ID and its exact 40-character source commit:

```sh
gh workflow run assemble-release.yml --ref develop -f installer_run_id=RUN_ID -f source_commit=COMMIT_SHA
```

The workflow checks out that source, downloads the three installer artifacts, builds the 32 character packs and tests the actual archives through the application API in a disposable library. Pack checks cover imports, stable IDs, a clip from each character, and notes/content surviving a server restart. Archives are built sequentially; original recordings, `.local` data and learner notes are excluded.

Assembly requires a clean checkout, including untracked files. It refuses mixed versions, failed native smokes, changed hashes and incomplete character indexes. It creates `release-manifest.json`, `SHA256SUMS.txt`, installers, character packs and verification records. All three builds must identify the same exact source commit.

After verification, the workflow atomically reserves the release tag at the exact source commit, then creates and uploads a **draft** GitHub release. It checks the actual tag reference again after upload. It does not publish it or change the latest public release. Existing release tags and releases are not overwritten. Inspect any reserved tag and partial draft before attempting recovery; published assets must never be silently replaced.

Before publication, check the draft's complete asset inventory, byte sizes and SHA-256 digests against the assembled records. Keep the three-demo starter distinct from the full-library screenshots and the 32 optional character packs.

## Publish

Publish the verified draft with a tag that matches its version and source. Use the explicit status for that version:

| Version                   | GitHub prerelease | Latest  |
| ------------------------- | ----------------- | ------- |
| Stable, e.g. `1.0.0`      | `false`           | `true`  |
| Beta, e.g. `1.0.0-beta.2` | `true`            | `false` |

For the first stable release:

```sh
gh release edit v1.0.0 --draft=false --prerelease=false --latest=true
```

For a beta, use `--draft=false --prerelease=true --latest=false` with its own matching beta tag. Neither a prerelease flag nor a title substitutes for the version checks. Never publish from an unreviewed branch or a pull-request merge ref.

After the public URLs work, update the checksummed cask in `squid-quarters/homebrew-tap` through a separately reviewed PR. Audit both Mac architectures and test installation in an isolated application directory. Preserve user libraries on uninstall. Then activate the matching project-site and README links through their own PR, so visitors are directed only to published assets and a working tap recipe.

The stable Homebrew command is:

```sh
brew install --cask squid-quarters/tap/hyper-chamber
```

The `hyper-chamber@beta` cask remains a separate channel. Both install `Hyper Chamber.app` and cannot be installed together. To move from beta, quit the app, uninstall the beta cask without `--zap`, then install the stable cask. The library and settings remain outside the app bundle.

No automatic in-app update feed is configured. Users should quit before replacing an installed app; closing its window only hides it. Application updates and content-pack imports preserve the separate learner library.

## Local pack and assembly checks

For a local release build, use a complete checkout and a dedicated output directory:

```sh
node tools/release/build-packs.mjs --output /path/to/packs
node tools/release/check-packs.mjs --packs /path/to/packs --output /path/to/content-verification.json
gh run download RUN_ID --pattern 'installer-*' --dir /path/to/installers
node tools/release/assemble.mjs --installers /path/to/installers --packs /path/to/packs --source-commit COMMIT_SHA --pack-verification /path/to/content-verification.json --output /path/to/release
```

Pack creation runs sequentially and verifies completed entries when resumed. Packs retain reference IDs, execution revisions, media hashes and source credits. Each archive must remain below the app's and GitHub's 2 GiB per-file limit. Publication authority is recorded in `content/publication.json`; it does not establish third-party media licensing or in-game verification.
