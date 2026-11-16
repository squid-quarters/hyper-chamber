# Create packs with an AI agent

Requires Hyper Chamber 1.1.0 pack tools. The published 1.0.0 application does not
provide these commands. Use a development build until the new installers ship.

## Install the skill

Download the [Hyper Chamber pack-authoring skill](https://squid-quarters.github.io/hyper-chamber/create-packs/downloads/hyper-chamber-packs.zip)
and extract its `hyper-chamber-packs` folder. It follows the
[Agent Skills format](https://agentskills.io/specification).

For Codex, place the folder in `~/.agents/skills/`, or in a project's
`.agents/skills/` directory. Ask for `$hyper-chamber-packs` in your prompt.
If it does not appear, restart Codex. Other agents can use their supported skill
installation method, or read `SKILL.md` directly. These locations are documented
in [the Codex skill guide](https://learn.chatgpt.com/docs/build-skills).

The skill is a workflow resource in the Hyper Chamber repository. The project has
not chosen a general open-source license. The synthetic sample's separate 0BSD
permission applies only to that sample.

## Give the agent usable material

Provide a short recording or a tutorial source with the section you want to turn
into references. Say which game and characters it covers, where the workspace
should live, and whether this is a new collection or an update to your own pack.

For example:

```text
Use $hyper-chamber-packs to make a pack from these short recordings.
Use the game's existing profile, keep the annotations as drafts, and show me
any inputs or timings you cannot establish from the footage before exporting.
```

The skill queries the game profiles shipped with the app, creates or opens a
workspace, and uses the same validation/export code as the manual creator. You
can open that workspace in the app to inspect and edit the result.

## Review what the AI extracted

Check each input, the clip boundaries, moment times, conditions and attribution.
The agent should preserve a source URL and excerpt time for YouTube footage, or
identify an original recording honestly. Uncertain extraction stays draft.

Technical validation catches malformed data and missing assets. It cannot certify
frame advantage, combo validity or current-patch accuracy. Review those claims
against the recording and, where needed, in training mode.

The tools preserve IDs when editing your workspace, reject stale saves, and require
a new edition for changed exported content. A fork receives independent identities
and keeps its origin. Export remains a local action; publishing or installing the
result is a separate choice.

## Tool access

On an installed Mac build, the agent can run:

```sh
"/Applications/Hyper Chamber.app/Contents/MacOS/hyper-chamber-desktop" --pack --json < request.json
```

On Windows, use `hyper-chamber-desktop.exe` from the installed app's location.
The agent should send UTF-8 JSON on standard input and read the JSON response.
The app does not need to open its window or library for these commands. No separate
Node installation or repository checkout is required for the installed tool.

For a source checkout, build the authoring package and run its bundled CLI:

```sh
pnpm --filter @hyper-chamber/authoring build
node packages/authoring/dist/cli.mjs --json < request.json
```

A profile request is just:

```json
{"command": "profiles"}
```

The downloaded skill includes the full command reference. The
[format guide](format.md) explains workspace files and pack editions.
