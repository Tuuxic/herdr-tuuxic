# Herdr packaging facts for a multi-mod layout repo

Research for issue #2, a child of map #1 ("Tuuxic v1.0 release"). Checked on 2026-11-15 against
Herdr 0.1.16 (`herdr-app --version`), using the herdr-app source at tag `v0.1.16` (commit
`034f8b8`, github.com/herdrdev/herdr-app, Apache-2.0), `~/.config/herdr-app/AGENTS.md` and
`herdr.d.ts` as Herdr 0.1.16 writes them, and herdr.dev's gallery index. Labels: **verified**
means read in source or run; **inferred** means it follows from those but wasn't run;
**unverified** means it wasn't checked.

Whistle's earlier research (herdr-whistle branch `research/mod-versioning`,
`docs/research/mod-versioning.md`, checked against 0.1.15) agrees with everything below and
covers the add procedure's re-add behaviour in more detail.

## Answers

1. **herdr.dev** lists **folders, not repos**. Each entry is one folder in the repo that has a
   `RECIPE.md` and either `layouts/` (a layout entry) or only `mods/` (a mod entry). Today
   tuuxic is a single layout entry at the repo root, and adding it copies the layout and all 18
   mod folders. To list single mods, each one needs its own folder laid out like a Herdr home
   (`<folder>/RECIPE.md`, `preview.png`, `mods/<name>/`), and the repo needs the `herdr-mod`
   topic. Every entry installs from the default branch's head.
2. **`mod.json` accepts any extra field**: Herdr reads only `place`, `size` and `focusable`, and
   ignores the rest. **A layout JSON accepts extra fields on read too, but Herdr drops them
   whenever it rewrites the file.** It rewrites the layout when it docks a newly seen mod into
   it, fills in missing ids, or runs `layout.set` or `layout.clone`. Anything inside a block's
   `props` is kept. **Theme files are strict**: an unknown field makes the theme invalid.
   `herdr-app check` checks one mod's code only. It never validates a layout and never rejects
   mod.json fields.
3. **A mod can import only files inside its own folder.** Imports through `../`, absolute paths
   and home-relative paths are refused, and JSON can't be imported. A manifest shared by
   several mods has to be copied into each mod, or read at runtime with
   `readTextFile`/`fs`. A renamed copy (`whistle` → `whistle-2`) gets its own
   `mods/<name>/` strings and the layout's `mod` names rewritten. Literal paths to *other*
   mods, `shared()` keys, keys.json `mod:<name>` sections and `<mod>.<command>` actions are not
   rewritten.
4. **Oldest Herdr:** by the API and commands they use, tuuxic's own mods need at least
   **0.1.12**: `terminal.pin` and `focusable` in mod.json first appear there. Several tuuxic
   mods were cloned from Herdr 0.1.13. Whistle 1.0, the planned dependency, needs **0.1.15**. (The pre-1.0 copy in tuuxic's `mods/whistle` has no `version.js` and declares no minimum.) To find the real
   minimum, run `herdr-app check` and the RECIPE's "Done when" checks on that Herdr build. The
   API scan gives only a lower bound.
5. **Cross-mod detection at runtime:**
   - presence: `readTextFile(`${appHome()}/mods/<name>/main.js`)` returns `null` for a missing
     file. tuuxic already does this.
   - version: parse `mods/<name>/mod.json` (whistle's carries `version` and `herdr`).
   - running state: `shared("whistle")` (contract `v: 1`; it has no version field).
   - in the layout: `layout()`.

   Importing another mod's `version.js` is impossible because of the import boundary.

## Findings

### 1. How herdr.dev lists and installs

- **Source of the gallery.** herdr.dev/gallery loads `https://assets.herdr.dev/layouts/index.json`
  and `.../mods/index.json` (verified: `https://herdr.dev/live/gallery.js`). Each entry has
  `owner, repo, fullName, url, defaultBranch, stars, pushedAt, headCommit, path, name, blurb`,
  plus `layoutFiles` (layouts) or `modNames, hasKeys` (mods), and `hasPreview, recipeBytes,
  previewUrl` (verified, fetched 2026-11-15).
- **Entries are folders** (`path`) in a repo. Examples:
  - `munza/herdr-mods` has 8 mod entries (`better-changes`, `better-files`, …), and each folder
    holds `RECIPE.md`, `preview.png` and `mods/<name>/`.
  - The same repo has a layout entry at `estro`.
  - `runkids/skillshare` has a layout at `herdr/skillshare` and a mod at `herdr/skillshare-mod`.
  - `herunan/herdr-over9k` has 6 mod folders, and one of them carries 10 mods.

  (Verified: index plus `gh api .../git/trees`.)
- **Classification** (inferred from the index): no `(repo, path)` pair appears in both indexes,
  and no entry lacks a recipe. So a folder that holds `layouts/` is a layout entry, and a folder
  with only `mods/` is a mod entry. AGENTS.md: "put that folder in a public GitHub repo (one
  folder each if there are several), write its `RECIPE.md`, save a screenshot of it as
  `preview.png` and add the repo topic `herdr-layout` for a layout or `herdr-mod` for a mod. It
  shows up … within the hour". A preview is optional in practice: 42 mod entries have none.
- **tuuxic today** (verified): one layout entry, `Tuuxic/herdr-tuuxic`, path `""`,
  `layoutFiles: ["layouts/tuuxic.json"]`, `headCommit d1e8f98`. The repo has only the
  `herdr-layout` topic, so none of its mods is listed alone. herdr-whistle is a mod entry
  (`modNames: ["whistle"]`, topic `herdr-mod`).
- **What "add" copies.** The copy line is ``Read ~/.config/herdr-app/AGENTS.md, then add this
  layout: https://github.com/<repo>/tree/<defaultBranch>/<path>`` (verified: `gallery-cards.js`
  `communityCards`). AGENTS.md step 2: "Copy the layout file to `layouts/` and each mod folder
  to `mods/`." So a whole-repo layout entry brings every `mods/*` folder in it, and a mod entry
  brings only the mods under its folder.
- **No version pinning.** The link is the default branch's tree. Tags and releases are ignored,
  which matches whistle ADR 0012.
- **Unverified:**
  - whether a mod folder nested *under* a root layout folder gets indexed too. No repo in the
    index has a root layout and also mod entries, so it isn't known whether
    `herdr-tuuxic/mods-dist/<name>/RECIPE.md` would be picked up next to the root layout.
  - whether the topic gates each index separately, or only gets the repo crawled at all.
    `munza/herdr-mods` has both topics.

### 2. Extra fields in mod.json, layout JSON, themes

- **mod.json** (verified, source):
  - `src/mods.rs` `struct Hint { place, size, focusable }` is read with
    `serde_json::from_str(...).ok().unwrap_or_default()`, and it has no `deny_unknown_fields`.
    Unknown fields are ignored. A *wrongly typed* known field, such as `"size": "x"`, silently
    drops the whole hint to its defaults.
  - `overlay`/`title` are read elsewhere.
  - `mod.clone` round-trips mod.json as a free `Value`, so extra fields survive, and adds
    `cloned_from`.
  - `herdr-app check` passed a mod.json with `version`, `herdr`, `whistle` and an object field
    (verified, run). Whistle ships `"version": "1.0.0", "herdr": "0.1.15"` in its mod.json.
- **Layout JSON** (verified, source `src/layout.rs`, `src/layout_sync.rs`, `src/window.rs`):
  - `struct Node` has no `deny_unknown_fields` (it uses `#[serde(flatten)]`), so unknown keys
    are ignored on read.
  - Herdr writes the file back with `layout_sync::text_of(&Node)`, which serializes only the
    known fields. That happens when:
    - a deliberate change differs from the file, such as a newly seen mod docked into the shown
      layout ("Someone (an agent) changed the file since we read it: theirs wins" otherwise),
      `window.rs:1143-1156`;
    - `keep_ids` fills in missing node ids, `window.rs:1206-1221`;
    - `layout.set` runs, `window.rs:3414-3420`;
    - `layout.clone` runs, `window.rs:250-256`.

    Each of these **drops unknown keys** (inferred from serialization; not run).
  - `content.props` is `serde_json::Value` and survives every rewrite.
  - Herdr's own layouts (`main`, `terminals`, `win98`) are never rewritten this way, but
    tuuxic's is the person's file.
  - Consequence (inferred): a root-level `"version"` in `layouts/tuuxic.json` isn't durable.
    Inside a block's `props` it would be.
- **Non-shown layouts are not validated live**. A probe `layouts/zzprobe-*.json` with unknown
  fields, and one with broken JSON, produced no `.error` file and no `herdr-app status` error
  (verified, run, then removed). Validation happens when a layout is shown (`layout.error`).
- **Theme files are strict** (verified, source): `src/settings.rs` `#[serde(deny_unknown_fields)]
  struct ThemeFile { background, foreground, selection, cursor?, ansi, colors? }`. A
  `themes/*.json` with an extra field such as `version` fails to parse. Inferred: the theme is
  then unusable.
- **keys.json**: the binary has the messages "unknown key binding field" and "unknown key
  binding command" (verified, strings). Treat it as strict. Its shape wasn't researched further.
- **`herdr-app check <mod folder>`** loads and renders one mod once. It checks code, not
  manifests, layouts or themes (AGENTS.md "Changing things safely"; verified by `--help`).

### 3. Imports outside the mod folder; the rename

- **Import boundary** (verified, run and source). The module resolver in
  `vendor/gpui-kit/crates/shell/src/engine/quickjs/mod.rs:5549-5556` canonicalizes the path and
  refuses anything outside the mod's folder.

  | Specifier | Result |
  |---|---|
  | `../shared/x.js` | "module … resolves outside the application directory `…\mods\a`" |
  | an absolute path to another mod | same message |
  | `/mods/shared/x.js`, `mods/shared/x.js` | "cannot resolve module" |
  | bare names | only built-ins: `herdr`, `gpui-kit`, `gpui-base`, `fs/promises`, … |

  Inferred: because the path is canonicalized, a symlink pointing outside the folder is refused
  too.
- **JSON can't be imported**. `import X from "./x.json" with { type: "json" }` parses the file
  as JS and fails (verified, run; matches whistle's research).
- **Reading files outside the folder is allowed**:
  - `readTextFile(path)` reads any local path and gives `null` when the file is missing
    (`src/mod_files.rs:10-14`, 1 MiB limit).
  - `fs/promises` reads anywhere under home and writes under `~/.config/herdr-app` (AGENTS.md).

  So a shared manifest can be *read* at runtime, though not imported. Either duplicate it per
  mod as JS, the way whistle's `version.js` does, or read a JSON file by path.
- **Rename on add** (AGENTS.md "Layouts and mods other people made", step 2): "Never overwrite:
  if a name is taken (yours or Herdr's), rename the new one: its file or folder, the `mod` names
  in the layout, and the mod's own `mods/<name>/` paths." It's the agent who renames. Herdr's
  own `mod.clone` rewrites the same things mechanically:
  - `mods/<from>/`, `"mods/<from>"`, `'mods/<from>'`;
  - `mod: "<from>"` in every key/quote form, in every text file of the copy (`src/mods.rs:247-258`).

  What does **not** get rewritten:
  - literal paths to *other* mods (`mods/whistle/main.js` inside tuuxic-settings);
  - `shared("…")` keys;
  - keys.json `mod:<name>` sections and `<mod>.<command>` actions (a renamed mod's commands are
    `<newname>.<command>`);
  - any name built at runtime.
- **Consequences for tuuxic** (inferred):
  - Re-adding tuuxic over a pre-1.0 install renames every taken folder (`tuuxic-agents-2`, …)
    and the layout file. AGENTS.md has no update path, so tuuxic needs its own Update section
    in its RECIPE, as whistle has.
  - A manifest read by path, such as `mods/tuuxic-<x>/…`, should go through the reading mod's
    own `mods/<self>/` string, which the rename does rewrite.
  - Another mod's folder is found by its canonical name only.

### 4. The oldest Herdr tuuxic needs

- **How it was found** (verified, run): every Herdr name tuuxic's mods import (excluding
  `mods/whistle`) and every command string in them were checked against herdr-app's
  `defaults/herdr.d.ts` and `src/commands.rs` at each tag from `v0.1.4` to `v0.1.16`. v0.1.4 is
  the oldest tag. Layout keys used by `layouts/tuuxic.json` and the mod.json fields were
  checked against `src/layout.rs` / `src/mods.rs` the same way.
- **Results:**
  - All 35 imported functions (`agents`, `setAgentOrder`, `knownAgents`, `machines`,
    `watchFolder`, `updates`, `telemetry`, …) exist in 0.1.4.
  - All commands except two exist in 0.1.4: `terminal.peek` came in **0.1.5** and
    `terminal.pin` (tuuxic-agents' pin) in **0.1.12**.
  - `focusable` in mod.json came in **0.1.12** (whistle's mod.json uses it; tuuxic-* don't).
  - `space.colors` is a `shared()` key, not a command.
  - All layout keys exist in 0.1.4. This was a coarse grep, so treat it as a lower bound.
  - `tuuxic-changes/graph/graph.js:47` already branches on `updates().app.version` against
    0.1.12.
- **Other signals:**
  - `cloned_from.version` says tuuxic-agents, tuuxic-spaces and tuuxic-chrome were cloned from
    Herdr **0.1.13**, and tuuxic-pane and tuuxic-tabs from 0.1.9.
  - Whistle 1.0 (herdr-whistle `mods/whistle/version.js` `MIN_HERDR`) needs **0.1.15** and is
    inert below that. tuuxic's current `mods/whistle` is a pre-1.0 copy with no `version.js`
    and no declared minimum. With whistle as a dependency, a person on 0.1.12–0.1.14 would get
    tuuxic without whistle (the settled "works without it and says why" path).
  - The installed app is 0.1.16.
- **Not covered by the scan:**
  - argument shapes and data fields added later (e.g. `agents()[i].pinned`);
  - gpui-kit element methods (`gpui-kit.d.ts` is generated, not in `defaults/`);
  - behaviour changes.
- **Answer:** the API floor is ≥ 0.1.12, and the practical floor is probably 0.1.13
  (unverified). The way to settle it: install that release of herdr-app (GitHub releases of
  herdrdev/herdr-app), run `herdr-app check` on every `mods/tuuxic-*`, then walk RECIPE.md's
  "Done when" list. Raise the floor until both pass. At runtime a mod reads Herdr's version from
  `updates().app.version` (`herdr.d.ts`; whistle's research verified it under check).

### 5. Detecting another mod at runtime

| Way | Gives | Notes |
|---|---|---|
| `readTextFile(`${appHome()}/mods/<name>/main.js`)` | presence (`null` when missing) | Already used: `tuuxic-bar/opens.js:20`, `tuuxic-chrome/opens.js:20`. Herdr loads only folders with a `main.js` (`src/mods.rs` `scan_dir`). |
| `readTextFile(…/mods/whistle/mod.json)` → `JSON.parse(...).version` / `.herdr` | installed version and its min Herdr | Whistle keeps mod.json and version.js in sync by test (ADR 0012). Misses a renamed copy (`whistle-2`). Reads the file, not what runs. |
| `readTextFile(…/mods/whistle/version.js)` + regex on `VERSION` | same | Whistle's source of truth, but parsing JS text is more fragile than reading mod.json. |
| `fs.readdir(`${appHome()}/mods`)` | every folder, including renamed copies | `fs/promises`, read anywhere in home (AGENTS.md). |
| `shared("whistle")` | whistle is **running** (not inert) and its state: `{ v: 1, mode, enabled, sequence, pane, onTerminal }` | Public contract (herdr-whistle `docs/contracts/state.md`). No version field. Absent while whistle is missing, inert or hidden. |
| `shared("whistle.copies")` | `{ "<folder>": version }` for each copy | Whistle's **private** key (`inert.js` `COPIES`), not a contract: don't build on it without a whistle issue. |
| `layout()` | whether a block of `mod: "whistle"` is in the shown layout | Herdr API. |
| `import "../whistle/version.js"` | — | Impossible (import boundary, §3). |

## How this was checked

- Read `~/.config/herdr-app/AGENTS.md` and `herdr.d.ts` (0.1.16), `herdr-app --help`.
- Ran `herdr-app check` on throwaway mods in a scratch folder:
  - `../`, absolute, `/mods/…` and `mods/…` imports;
  - a JSON import;
  - a mod.json with extra fields.
- Wrote two probe layouts into the live `~/.config/herdr-app/layouts/` (not shown), looked for
  `.error` files and `herdr-app status` errors, then deleted them.
- Read herdr-app source at tag v0.1.16: `src/mods.rs`, `src/layout.rs`, `src/layout_sync.rs`,
  `src/window.rs`, `src/settings.rs`, `src/mod_files.rs`, and the quickjs module resolver.
- Fetched `defaults/herdr.d.ts`, `src/commands.rs`, `src/layout.rs` and `src/mods.rs` at tags
  v0.1.4–v0.1.16 through `gh api`, and found the first tag for each name tuuxic uses.
- Fetched `herdr.dev/gallery`, `/live/gallery.js`, `/live/gallery-cards.js` and
  `assets.herdr.dev/{layouts,mods}/index.json`. Inspected repo trees with `gh api`.
