# Hyper Chamber desktop

Tauri opens the same application served by the bundled local library server. Its resources include Node 24, the compiled server, the web application, and three complete Dhalsim demonstrations. Additional character packs bring their own references and media. A fresh installation never needs a development toolchain.

## Build locally

From the repository root, with the contributor dependencies installed:

```sh
pnpm --filter @hyper-chamber/server build
pnpm --filter @hyper-chamber/web build
pnpm --filter @hyper-chamber/desktop build
```

The desktop build prepares its resources automatically. macOS output is under `src-tauri/target/release/bundle/`: the application and a local unsigned disk image. These are local beta artifacts, without notarization or a release feed. The macOS build requires macOS 13.5 or later, matching the bundled Node runtime. Each target platform needs its own native build and bundled Node executable.

Create a portable content archive without changing the source catalog or original media:

```sh
pnpm desktop:pack --character dhalsim --output /path/to/dhalsim.hcpack
```

Every archive contains a manifest, its reference metadata, and SHA-256 hashes and sizes for every payload file. Archive creation streams existing compressed media, rather than keeping a whole character's footage in memory. Reference IDs and execution revisions remain intact; related links are limited to references included in the pack. The desktop import picker installs the archive directly.

## Local library and lifecycle

On macOS, the default library is `~/Library/Application Support/com.squidquarters.hyperchamber/library`. The app’s library settings can reveal this folder or choose another one. Choosing an existing library opens it; choosing an empty folder initializes a separate library with the starter content. The app validates the folder and restarts after saving the choice. It never moves or deletes the previous library. `HYPER_CHAMBER_LIBRARY_DIR` can override that saved choice before launch. Quit the app before moving or copying a library folder. The library contains the SQLite database, installed content, backups, and a server log; the application bundle can be replaced separately.

Closing the main window leaves the library running. Reopen Hyper Chamber to restore the window. **Hyper Chamber → Quit Hyper Chamber**, or Cmd+Q, stops the owned library server and closes the application. A second launch reopens the existing instance. The server also watches its parent process, so an interrupted desktop process does not deliberately leave a host behind.

Device sharing starts disabled. The desktop window can enable a separate LAN listener while its own loopback address stays unchanged. Sharing needs the computer to remain awake and the OS firewall to allow connections. Native host commands require the owned window's exact loopback origin and a random host token that is never sent to browser clients. Phone and tablet clients do not receive filesystem or database commands.

For an isolated desktop probe, set `HYPER_CHAMBER_PORT=5390` and a temporary `HYPER_CHAMBER_LIBRARY_DIR`. `HYPER_CHAMBER_RESOURCES_DIR` is a developer override for generated resources. `pnpm --filter @hyper-chamber/desktop dev` uses the prepared resources in its own package.
