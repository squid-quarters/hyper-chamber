# Make your first pack

Requires the Hyper Chamber 1.1.0 development build. These controls are not in the
published 1.0.0 installers yet.

## Create a workspace

Open **Pack creator** in the desktop app. Enter a pack title and your name or
handle, then choose **New workspace** and select an empty folder.

The folder holds your editable references and media. **Open workspace** returns
to it later. To adapt someone else's exported pack, choose **Fork a pack**;
that makes an independent collection and retains the original attribution.

## Add a short recording

New workspaces start with the supplied Street Fighter 6 profile. Add a reference,
choose its character, and give it a title and short summary. Opened workspaces
and forked packs keep their game profile. Choose an already-trimmed MP4 or WebM clip. You can record a single
attempt directly or shorten a longer recording in your usual video editor first.

The clip is copied into the workspace. Your original recording stays in place.
Play it in the editor to check the recording. If it has audio you want available
in the replay, enable **Clip includes audio** after checking the soundtrack.
New and replacement clips start with this unchecked.

## Capture key moments

Pause at a useful moment and choose **Capture moment**. Capture at least one;
the first also supplies the poster. Give each moment a short label explaining
what to look for. Times are relative to the short clip, not the full source video.

You do not need a still for every animation frame. Pick the positions, transitions
or timing cues that make the sequence easier to practise.

## Enter the reference

Add each input as a separate step, with its notation and a readable move label.
Use the game's notation key consistently. Enter starting situations, outcomes and
any important conditions; these fields help people find the reference later.
Keep notes about execution short and specific.

Choose **Own recording** for footage you made. For a YouTube excerpt, preserve its
creator, title, URL and original start time. Do not substitute a made-up tutorial
URL for an original recording.

Leave the reference as a draft while inputs or timing are uncertain. Mark source
review only after checking the annotations against the recording. That does not
mean it has been tested in-game on the current patch.

## Save and export

Choose **Save reference**, then **Preview saved reference** to check its input
sequence, replay, captured moments and source details together. **Discard** leaves
the saved reference unchanged.

When the collection is ready, choose **Export pack** and save the `.hcpack` file.
Export checks the references, file paths and required media. Import the file from
**Library & devices → Installed packs → Import pack** to use it in your library.
Exporting by itself does not install or publish anything.

## Make a later edition

Open the same workspace and keep its existing IDs. The editor advances the pack
edition after changes to exported content. Material execution changes also receive
a new reference revision; wording changes alone keep that revision.

Export a new file and import it to preview the update. Notes and progress remain
associated with the stable reference IDs. A changed execution asks the learner to
reassess it. If an AI agent edited the same workspace meanwhile, reload before
saving; the tools reject stale saves instead of replacing the newer edit.
