# Manage Packs and Updates

Requires the 1.1.0 development build. Published 1.0.0 can import packs, but does
not have the installed-pack manager or removal controls.

## Import or Update a Pack

Open **Library & devices → Installed packs → Import pack** and select a `.hcpack`.
Review the references being added, changed or made unavailable, then confirm.
Older editions and overlapping collections need extra review.

An identical reimport changes nothing. A rejected or interrupted import keeps the
previous selection active. Updates may temporarily need space for both editions;
the app checks storage before extraction.

## Remove a Pack

Choose **Remove** beside it and review what will disappear or fall back to another
collection. Manage installations here rather than deleting their folders.

Removal reclaims installed and retained media. It keeps saved flags, notes and
practice status; reimporting the same reference IDs reconnects them. Until then,
look under notes for unavailable references. Removing the last pack leaves an
empty library.

## Update the App

**Quit Hyper Chamber first.** Closing its window only hides it and can leave
device access running. Replace the app, or update the Homebrew cask, and reopen
the same library folder. Unchanged packs do not need another import.

The app snapshots the database before a required migration. A failed backup or
migration stops startup. Phones and tablets may need to reload after the host
restarts; their recovery drafts remain available.

Do not reopen an upgraded library in an incompatible older app. Rolling back
requires a matching saved library and app version.

## Recover Notes and Progress

In **Notes and progress recovery**, choose **Back up notes** before a substantial
change. **Restore notes…** keeps the currently installed packs and replaces learner
edits made after the selected snapshot. Check its date before confirming.
The app backs up the current database first and asks connected clients to reload.

A database snapshot does not include videos or restore reclaimed historical media.
For a whole-library copy, Quit the app and copy the complete library folder,
including packs. See the [storage notes](https://github.com/squid-quarters/hyper-chamber/blob/develop/docs/desktop-architecture.md).
