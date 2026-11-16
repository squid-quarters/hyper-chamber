# Pack tool commands

Requires the Hyper Chamber 1.1.0 development tools. Stable 1.0.0 lacks this CLI.

## Invocation

On a standard Mac installation:

```sh
"/Applications/Hyper Chamber.app/Contents/MacOS/hyper-chamber-desktop" --pack --json < request.json
```

On Windows, locate `hyper-chamber-desktop.exe` from the installed application's
shortcut target. Use that executable with `--pack --json`, supplying UTF-8 JSON
bytes on standard input. Prefer a subprocess API or a UTF-8-capable shell rather
than interpolating arbitrary user text into a command string.

From a source checkout:

```sh
pnpm --filter @hyper-chamber/authoring build
node packages/authoring/dist/cli.mjs --json < request.json
```

Send one JSON object. Wait for the exit status and parse standard output:
`{"ok":true,"result":...}` or `{"ok":false,"error":{"code":...,"message":...}}`.
Errors return a nonzero exit status. `validate` itself can succeed with
`result.valid:false`; check that field too. Requests are bounded to 32 MiB in the
CLI; native editor requests have a 16 MiB limit.

## Commands

Use absolute `directory`, input-file and output-file paths. These examples use
`/path/to/workspace` as a destination chosen by the user; replace it.

1. **Profiles:** `{"command":"profiles"}` returns shipped game definitions. Keep
   the selected definition intact when passing it in `games` to create.
2. **Create:** `{"command":"create","directory":"/path/to/workspace","title":"My references","author":"Creator name","games":[<selected game object>]}`.
   The target must be empty. The result contains `directory` and `workspace`.
3. **Read:** `{"command":"read","directory":"/path/to/workspace"}` returns the
   latest workspace. Preserve its generated `id`, current `editRevision`, `games`
   and export metadata when preparing a save.
4. **Save:** `{"command":"save","directory":"/path/to/workspace","workspace":<complete edited workspace>}`.
   Replace references in its `references` array. Send the current `editRevision`;
   use the returned workspace afterward. Do not write `workspace.json` directly
   while the desktop editor or another agent may be using it.
5. **Add video:** `{"command":"add-media","directory":"/path/to/workspace","sourcePath":"/path/to/short.mp4","referenceId":"<workspace-id>-<uuid>"}`.
   The reference can be new and not saved yet. The tool copies the clip to a unique
   path and returns `{path,bytes}`. Use that exact path in `media.clip`.
6. **Write frame:** `{"command":"write-asset","directory":"/path/to/workspace","path":"media/<workspace-id>/<reference-id>/moment-<uuid>.jpg","base64":"<image bytes as base64>"}`.
   JPEG/PNG/WebP only, at most 8 MiB decoded. Use a fresh filename; an existing
   frame is not overwritten. Put the returned path in `media.poster` or a frame.
7. **Validate:** `{"command":"validate","directory":"/path/to/workspace"}` returns
   `{valid,errors,warnings,referenceCount,bytes}`. Missing clips, frames, invalid
   relationships or paths must be fixed before export. Draft warnings are not
   in-game verification.
8. **Export:** `{"command":"export","directory":"/path/to/workspace","output":"/path/to/new-edition.hcpack"}`.
   Existing files are not replaced. The result includes the exported path,
   manifest, reference count, bytes, warnings and updated workspace/export ledger.
   Changed content requires a new semantic edition; do not delete `lastExport` to
   try to bypass that check.
9. **Fork:** `{"command":"fork","archive":"/path/to/original.hcpack","directory":"/path/to/empty-folder","author":"New curator"}`.
   Optional `title` changes the collection's name. Forking assigns new identities,
   remaps media paths, records the source pack in `derivedFrom` and leaves review
   status as draft. Original source attribution stays intact.

The `<...>` fragments above are explanations, not literal JSON. Construct actual
JSON values with the available standard-library tooling rather than shell string
substitution. A UUID can come from that tooling's UUID generator.

## Reference fields

Use `reference-shape.json` for the complete current field layout. Replace its
synthetic identity, game, participants, input, source and media values with the
user's material. Never copy its example IDs into another workspace.

- One `participant` can use ID `main`; its `characterId` must exist in the selected
  profile. Multiple participants need actor IDs on every input step.
- `notation` is the complete sequence; `inputs` holds each step separately.
- `source.start/end` describe the source excerpt. Frame `at` values are seconds
  relative to the short clip, strictly increasing and within that duration.
- `media.poster` and at least one frame are required; complete exported references
  also require `media.clip`. Set `hasAudio` only when known.
- New references start at execution `revision:1`. Keep verification draft unless
  the annotations have actually been checked against the source. `gameVersion:null`
  is honest when no current game version has been established.
- `relatedIds` can refer only to other references in the workspace. Use `[]` when
  no relationship is established. Resources must use the selected profile's keys.
