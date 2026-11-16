# Create packs with an AI agent

Requires the 1.1.0 pack tools. Published 1.0.0 does not include them; use a
development build until the new installers ship.

## Install the skill

Download the [pack-authoring skill](https://squid-quarters.github.io/hyper-chamber/create-packs/downloads/hyper-chamber-packs.zip)
and extract its `hyper-chamber-packs` folder.

For Codex, put it in `~/.agents/skills/` or a project's `.agents/skills/` directory,
then ask for `$hyper-chamber-packs`. Restart Codex if it does not appear.
See the [Codex skill guide](https://learn.chatgpt.com/docs/build-skills).
Other agents can use their skill installation method or read `SKILL.md` directly;
the download follows the [Agent Skills format](https://agentskills.io/specification).

## Give it your footage

Provide recordings or a tutorial source and the section you want to use. Name the
game and characters, choose a workspace folder, and say whether you are making a
new collection or updating your own pack.

```text
Use $hyper-chamber-packs to make a pack from these short recordings.
Use the game's existing profile and keep uncertain annotations as drafts.
Show me any inputs or timings you cannot establish before exporting.
```

The agent uses the same tools as the desktop creator. Open its workspace in the
app to inspect or edit the result. The installed pack tools need no separate Node
installation or source checkout; [tool access and commands](format.md#json-tool-protocol)
are in the reference guide.

## Review the result

Check inputs, clip boundaries, moment times, conditions and attribution.
YouTube excerpts need the original creator, URL and excerpt time; original
recordings should be identified honestly. Leave uncertain extraction as draft.

Validation catches malformed data and missing assets. Check gameplay and frame-data
claims against the recording and, where needed, in training mode.

Edits to your workspace keep its IDs. A fork gets independent IDs and keeps its
origin. The tools reject stale saves and require a new edition for changed
exported content. Export stays local; installing or publishing it is a separate
choice.

The project has no general open-source license. The sample's 0BSD permission
applies only to that sample.
