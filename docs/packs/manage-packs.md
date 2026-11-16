# Manage packs and updates

This guide covers the Hyper Chamber 1.1.0 development build. Published 1.0.0 can
import packs, but does not have the installed-pack manager or removal controls.

## Import or update

Open **Library & devices** in the desktop app. **Installed packs** lists each
collection's edition, size and reference count. Choose **Import pack** and select
a `.hcpack` file.

The preview shows references being added, changed or made unavailable, along with
any conflicts. Review an older edition or overlapping collection before confirming.
An identical reimport does nothing. A rejected or interrupted import keeps the
previous selection active.

The app checks available storage before extraction. An update can temporarily need
space for both editions; do not count only the downloaded archive's size.

## Remove content

Choose **Remove** beside a pack and review what will disappear or fall back to
another installed collection. Confirm only when that is the result you want.

Removal reclaims that pack's installed and retained content. It keeps your saved
flags, notes and practice status. Reimporting the same reference IDs reconnects
those entries. References without installed content remain available in the notes
list. Removing the last pack leaves an empty library; it does not reinstall the
starter behind your back.

Do not manage installations by deleting their folders. Older releases used folder
presence for recovery; the current manager records intentional changes explicitly.

## Update the application

Quit Hyper Chamber before replacing it. Closing the native window only hides it
and can leave device access running. Install the newer application over the old
one, or update the Homebrew cask on macOS. Keep the same library folder.

Application updates do not require reimporting unchanged packs. If database changes
are needed, the app makes a snapshot before migration. A failed backup or migration
stops the update rather than starting an empty library. A phone or tablet may ask
you to reload after the host restarts; its recovery draft stays available.

## Recover notes and progress

Before a substantial change, open **Notes and progress recovery** and choose
**Back up notes**. **Restore notes…** can restore learner data while preserving
the packs currently installed. The app keeps
the current database first and asks connected clients to reload before saving.
Review the snapshot date: restoration replaces edits made since that snapshot.

A database snapshot is not a copy of all your video files. It cannot guarantee a
complete historical pack library after older media has been reclaimed. To keep a
whole-library copy, Quit Hyper Chamber first, then copy the complete library folder,
including packs. See the [desktop build and storage notes](https://github.com/squid-quarters/hyper-chamber/blob/develop/docs/desktop-architecture.md).

Do not open an upgraded library in an incompatible older app. A deliberate rollback
needs a matching saved library and application version, not just an old installer.
