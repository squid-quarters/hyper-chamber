# Publishing a beta

Application releases are deliberate GitHub prereleases. The existing canonical branch is `develop`; reviewed source changes reach it through a pull request. This repository does not use Changesets. The first public version is `1.0.0-beta.1`; beta tooling refuses stable versions.

## Build and verify

The **Beta installers** workflow builds Apple Silicon and Intel Mac DMGs on native macOS runners, plus a Windows x64 NSIS installer on Windows. It has read-only repository permissions and never publishes a release. Pull requests exercise the same build. After merging the reviewed change, dispatch the workflow on `develop` so the distributable artifacts record the actual canonical commit:

```sh
gh workflow run beta-installers.yml --ref develop
```

Each job tests application code, builds the installer, then starts the packaged application with a disposable library. Tests cover runtime architecture, starter media, compiled UI assets, SQLite notes surviving restart, disabled-by-default sharing, and owned-process cleanup. Mac smoke uses the application mounted from the DMG; Windows smoke uses a silent per-user installation. No test opens a developer's existing library.

The artifacts are named `beta-installer-macos-arm64`, `beta-installer-macos-x64` and `beta-installer-windows-x64`. Each contains one normalized installer filename and `build-info.json`, including a SHA-256 digest, source commit and smoke results. Download all three from the successful canonical run:

```sh
gh run download RUN_ID --pattern 'beta-installer-*' --dir /path/to/installers
```

The Mac beta is ad-hoc signed with hardened runtime and is not notarized. Windows setup is unsigned. Keep these limitations visible in download and installation instructions. Do not remove quarantine attributes, disable Gatekeeper or suppress Windows protection checks in installer scripts. Developer ID/notarization and Windows publisher signing require their own credentials and configuration.

## Reference content

The installer carries three complete Dhalsim demonstrations. Build the existing curated library as separate character packs from a complete checkout; never package `.local` data, original recordings, learner notes or extraction workfiles:

```sh
node tools/release/build-packs.mjs --output /path/to/packs
```

This writes an index and one `.hcpack` per populated character, preserving IDs, execution revisions, media hashes and source credits. It runs sequentially and verifies completed entries when resumed. Archives must remain below the application's and GitHub's 2 GiB per-file limit. Publication authority is recorded in `content/publication.json`; it does not establish third-party media licensing or in-game verification.

Before publishing, test pack imports against a disposable library and confirm the expected full reference count. Keep the initial starter and the displayed full-library screenshots clearly distinguished in release copy.

## Assemble and publish

Use the exact source commit recorded by all three successful canonical builds:

```sh
node tools/release/assemble.mjs --installers /path/to/installers --packs /path/to/packs --source-commit COMMIT_SHA --output /path/to/release
```

Assembly refuses mixed versions, mismatched commits, failed native smokes, changed file hashes and incomplete character indexes. It produces `release-manifest.json` and `SHA256SUMS.txt`, alongside the installers, packs and per-platform build records. Use a fresh output directory; published beta assets must not be silently replaced.

Create a **draft** GitHub release at that commit, with the matching `v1.0.0-beta.N` tag and explicit prerelease status. Upload files in batches, verify the uploaded names, sizes and digests, then publish the draft as a prerelease with `latest=false`. Never promote it to a stable release automatically. Do not publish from a pull-request merge ref or an unreviewed branch.

After the public download URLs work, update the checksummed beta cask in `squid-quarters/homebrew-tap` through a separately reviewed PR. Audit both Mac architectures and install into an isolated test application directory. Preserve user libraries on uninstall. Only then activate download links and Homebrew instructions on the project site and README through their own PR, so visitors do not receive links to unpublished assets.

The Homebrew command is:

```sh
brew install --cask squid-quarters/tap/hyper-chamber@beta
```

No automatic in-app update feed is configured. Upgrades replace the application independently of the library; users should quit the app before installing an update.
